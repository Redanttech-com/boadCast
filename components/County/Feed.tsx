import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Alert,
  Image,
  useWindowDimensions,
} from "react-native";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import Posts from "./Posts";
import BottomSheet, {
  BottomSheetFlashList,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { AntDesign, Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import { useUserInfo } from "@/components/UserContext";
import { useRecoilState } from "recoil";
import { modalCountyComment } from "@/atoms/modalAtom";
import { useUser } from "@clerk/clerk-expo";
import Comments from "./Comments";
import { router } from "expo-router";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { ResizeMode, Video } from "expo-av";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/firebase";
import * as ImagePicker from "expo-image-picker";
import { Avatar } from "react-native-elements";
import { TouchableOpacity } from "react-native";

const Feed = () => {
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false); // Separate loading state for comments
  const [posts, setPosts] = useState([]);
  const [input, setInput] = useState("");
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const bottomSheetRef = useRef(null);
  const [comments, setComments] = useState([]);
  const [postID] = useRecoilState(modalCountyComment);
  const { user } = useUser();
  const { formatNumber } = useUserInfo();
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const { width } = useWindowDimensions();
  const snapPoints = useMemo(() => ["100%", "100%"], []);
  const openBottomSheet = useCallback(() => setIsBottomSheetOpen(true), []);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState({ uri: null, type: null });
  const colorScheme = useColorScheme();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;

      const q = query(collection(db, "userPosts"), where("uid", "==", user.id));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setUserData(querySnapshot.docs[0].data());
      }
    };

    fetchUserData();
  }, [user]);

  const getColorFromName = (name) => {
    // Generate a hash number from the name
    let hash = 0;
    for (let i = 0; i < name?.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Predefined colors for better visuals
    const colors = [
      "#FF5733",
      "#33FF57",
      "#3357FF",
      "#F1C40F",
      "#8E44AD",
      "#E74C3C",
      "#2ECC71",
      "#1ABC9C",
      "#3498DB",
    ];

    // Pick a color consistently based on the hash value
    return colors[Math.abs(hash) % colors.length];
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      const q = query(collection(db, "userPosts"), where("uid", "==", user.id));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setUserData(querySnapshot.docs[0].data());
      }
    };
    fetchUserData();
  }, [user]);

  // Fetch posts
  useEffect(() => {
    if (!userData?.county) return;

    setLoadingPosts(true);

    const q = query(
      collection(db, "county", userData.county, "posts"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))); // ✅ Extract data
        setLoadingPosts(false);
      },
      (error) => {
        console.error("Error fetching posts:", error);
        setLoadingPosts(false);
      }
    );

    return () => unsubscribe(); // ✅ Cleanup on unmount
  }, [userData?.county]); // ✅ Only runs when `userData.county` changes

  // Fetch comments for a specific post
  const fetchComments = useCallback(async () => {
    if (!postID || !userData?.county) return;

    setLoadingComments(true); // Set loading state for comments
    try {
      const q = query(
        collection(db, "county", postID, "comments"),
        orderBy("timestamp", "desc")
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const commentsData = snapshot.docs;
        setComments(commentsData);
        setLoadingComments(false);
      });
      return () => unsubscribe(); // Unsubscribe on unmount
    } catch (error) {
      console.error("Error fetching comments:", error);
      setLoadingComments(false);
    }
  }, [postID, userData?.county]);

  // Trigger fetching comments when bottom sheet opens
  useEffect(() => {
    if (isBottomSheetOpen) {
      fetchComments();
    }
  }, [isBottomSheetOpen, fetchComments]);

  // Send a comment
  async function sendComment() {
    if (!user && !userData) {
      router.replace("/(auth)");
      return;
    }

    if (!input.trim()) {
      alert("Comment cannot be empty!");
      return;
    }

    if (!user || !userData) {
      Alert.alert("Error", "User not authenticated. Please log in again.");
      return;
    }

    setLoadingComments(true); // Show loader when sending comment
    try {
      await addDoc(collection(db, "county", postID, "comments"), {
        uid: user?.id,
        comment: input.trim(),
        timestamp: serverTimestamp(),
        email: user?.primaryEmailAddress?.emailAddress,
        name: userData.name,
        lastname: userData.lastname,
        nickname: userData.nickname,
        userImg: userData.userImg || null,
      });
      setInput("");
      // Clear the input
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setLoadingComments(false);
    }
  }

  const [visiblePostIds, setVisiblePostIds] = useState(new Set());

  const onViewableItemsChanged = useCallback(({ viewableItems, changed }) => {
    const visibleIds = new Set(viewableItems.map((item) => item.key));
    setVisiblePostIds(visibleIds); // Update the state with visible items
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50, // Define what percentage of the item should be visible to count as visible
  };

  // if (loadingPosts) {
  //   return (
  //     <View className="flex-1 justify-center items-center dark:bg-gray-800">
  //       <ActivityIndicator
  //         color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
  //       />
  //     </View>
  //   );
  // }

  return (
    <View className="flex-1 dark:bg-gray-800">
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Posts
            post={item}
            id={item.id}
            openBottomSheet={openBottomSheet}
            isPaused={!visiblePostIds.has(item.id)}
          />
        )}
        initialNumToRender={10}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center">
            <Text className="dark:text-white">No posts available</Text>
          </View>
        }
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
      <TouchableOpacity
        style={{
          position: "absolute",
          bottom: 70, // Adjusted to be behind input field
          right: 20,
          backgroundColor: "gray",
          width: 56,
          height: 56,
          borderRadius: 50,
          justifyContent: "center",
          alignItems: "center",
          elevation: 5, // Android shadow
          shadowColor: "gray", // iOS shadow
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          zIndex: 100, // Ensures it is behind input
        }}
        onPress={() => router.push("/(inputs)/countyInput")}
      >
        <AntDesign name="plus" size={24} color="white" />
      </TouchableOpacity>

      <BottomSheet
        ref={bottomSheetRef}
        index={isBottomSheetOpen ? 1 : -1}
        snapPoints={snapPoints}
        onChange={(index) => setIsBottomSheetOpen(index >= 1)}
        enablePanDownToClose={true}
      >
        {/* Header Title */}
        <View
          className={`${
            loadingComments
              ? "hidden"
              : "p-4 border-b border-hairline dark:border-gray-700 border-gray-300 flex-row items-center justify-center dark:bg-gray-800"
          }`}
        >
          {/* <View></View> */}
          <Text className="text-lg font-bold text-center dark:text-white ">
            Comments ({formatNumber(comments.length)})
          </Text>
          {/* <Pressable
          className=""
        >
          <Feather name="x" size={28} color="black" />
        </Pressable> */}
        </View>

        <View className="flex-1 bg-gray-50 dark:bg-gray-800  z-50 dark:text-white">
          {loadingComments ? (
            <View className="hidden w-full h-full justify-center items-center flex-1">
              <ActivityIndicator size="large" color="#0000ff" />
            </View>
          ) : (
            <BottomSheetFlashList
              data={comments}
              keyExtractor={(item) => item.id}
              estimatedItemSize={100}
              renderItem={({ item }) => (
                <Comments comment={item} id={item.id} />
              )}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View className="flex-1 justify-center items-center">
                  <Text className="dark:text-white">No comments available</Text>
                </View>
              }
            />
          )}
        </View>

        <BottomSheetView className="px-4 z-50  bg-white   fixed dark:bg-gray-800">
          <View className="flex-row items-center justify-between px-4 mb-1 border rounded-full border-gray-500 ">
            <TextInput
              placeholder="Comment"
              placeholderTextColor={
                colorScheme === "dark" ? "#FFFFFF" : "#808080"
              } // Light gray for light mode, white for dark mode
              value={input}
              onChangeText={setInput}
              className="flex-1 rounded-full p-3 dark:text-white "
            />

            <Pressable onPress={sendComment}>
              <Ionicons
                name="send"
                color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
                size={24}
              />
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
};

export default Feed;
