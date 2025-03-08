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
  Alert,
  useWindowDimensions,
  TouchableOpacity,
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
import { auth, db, storage } from "@/firebase";
import Posts from "./Posts";
import BottomSheet, {
  BottomSheetFlashList,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { AntDesign, Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import { useUserInfo } from "@/components/UserContext";
import { useRecoilState } from "recoil";
import { modalConstituencyComment } from "@/atoms/modalAtom";
import { useUser } from "@clerk/clerk-expo";
import Comments from "./Comments";
import { router } from "expo-router";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { Image } from "react-native";
import { ResizeMode, Video } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Avatar } from "react-native-elements";

const Feed = () => {
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false); // Separate loading state for comments
  const [posts, setPosts] = useState([]);
  const [input, setInput] = useState("");
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const bottomSheetRef = useRef(null);
  const [comments, setComments] = useState([]);

  const [postID] = useRecoilState(modalConstituencyComment);
  const { user } = useUser();
  const { formatNumber } = useUserInfo();

  const snapPoints = useMemo(() => ["100%", "100%"], []);
  const openBottomSheet = useCallback(() => setIsBottomSheetOpen(true), []);
  const [userData, setUserData] = useState(null);
  const colorScheme = useColorScheme();

  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState({ uri: null, type: null });
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const { width } = useWindowDimensions();

  const pickMedia = useCallback(async (type: "Images" | "Videos") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        type === "Images"
          ? ImagePicker.MediaTypeOptions.Images
          : ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setMedia({ uri: result.assets[0].uri, type });
    }
  }, []);

  const uploadMedia = async (docRefId: string) => {
    if (!media.uri) return;

    const blob = await (await fetch(media.uri)).blob();
    const mediaRef = ref(storage, `constituency/${docRefId}/${media.type}`);
    await uploadBytes(mediaRef, blob);

    const downloadUrl = await getDownloadURL(mediaRef);
    await updateDoc(
      doc(db, "constituency", userData?.constituency, "posts", docRefId),
      {
        [media.type.toLowerCase()]: downloadUrl,
      }
    );
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

  const sendPost = async () => {
    setLoading(true);
    if (!input.trim()) {
      Alert.alert("Error", "Post content cannot be empty.");
      return;
    }

    // Ensure user and userData exist
    if (!user || !userData) {
      Alert.alert("Error", "User not authenticated. Please log in again.");
      return;
    }
    const docRef = await addDoc(
      collection(db, "constituency", userData?.constituency, "posts"),
      {
        uid: user?.id,
        text: input.trim(),
        userImg: userData?.userImg || null,
        timestamp: serverTimestamp(),
        lastname: userData?.lastname,
        name: userData?.name,
        nickname: userData?.nickname,
        constituency: userData?.constituency,
      }
    );

    if (media.uri) await uploadMedia(docRef.id);

    setInput("");
    setMedia({ uri: null, type: null });
    setLoading(false);
  };
  const getColorFromName = (name) => {
    if (!name) return "#ccc"; // Default color if no name exists

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
    if (!userData?.constituency) return;

    setLoadingPosts(true);

    const q = query(
      collection(db, "constituency", userData.constituency, "posts"),
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
  }, [userData?.constituency]); // ✅ Only runs when `userData.constituency` changes

  // Fetch comments for a specific post
  const fetchComments = useCallback(async () => {
    if (!postID) return;

    setLoadingComments(true); // Set loading state for comments
    try {
      const q = query(
        collection(db, "constituency", postID, "comments"),
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
  }, [postID]);

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
      await addDoc(collection(db, "constituency", postID, "comments"), {
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
    <View className="flex-1  dark:bg-gray-800">
      <View className="shadow-md p-4">
        <View className="flex-row items-center justify-between">
          <Text className="font-extrabold text-2xl dark:text-white">
            {userData?.constituency} Constituency
          </Text>
          <Avatar
            size={40}
            source={userData?.userImg && { uri: userData?.userImg }}
            title={userData?.name && userData?.name[0].toUpperCase()}
            containerStyle={{
              backgroundColor: getColorFromName(userData?.name),
              borderRadius: 5,
            }} // Consistent color per user
            avatarStyle={{
              borderRadius: 5, // This affects the actual image
            }}
          />
        </View>
      </View>
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
      <View style={{ flex: 1 }}>
        <TouchableOpacity
          style={{
            position: "absolute",
            bottom: 10,
            right: 20,
            backgroundColor: "#3400be",
            width: 56,
            height: 56,
            borderRadius: 50,
            justifyContent: "center",
            alignItems: "center",
            elevation: 5, // For Android shadow
            shadowColor: "blue", // For iOS shadow
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
          }}
          onPress={() => router.push("/(inputs)/constituencyInput")}
        >
          <AntDesign name="plus" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Feed;
