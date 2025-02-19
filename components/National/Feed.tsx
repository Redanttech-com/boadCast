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
  Modal,
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
import { db, storage } from "@/firebase";
import Posts from "./Posts";
import BottomSheet, {
  BottomSheetFlashList,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useUserInfo } from "@/components/UserContext";
import { useRecoilState } from "recoil";
import { modalComment } from "@/atoms/modalAtom";
import { useUser } from "@clerk/clerk-expo";
import Comments from "./Comments";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "react-native-elements";
import { Image } from "react-native";
import StatusFeed from "@/app/(status)/StatusFeed";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Video } from "expo-av";

const Feed = () => {
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false); // Separate loading state for comments
  const [posts, setPosts] = useState([]);
  const [input, setInput] = useState("");
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const bottomSheetRef = useRef(null);
  const [comments, setComments] = useState([]);
  const [postID] = useRecoilState(modalComment);
  const { formatNumber } = useUserInfo();
  const snapPoints = useMemo(() => ["100%", "100%"], []);
  const openBottomSheet = useCallback(() => setIsBottomSheetOpen(true), []);
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState({ uri: null, type: null });
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState("");
  const { user } = useUser();
  const [userData, setUserData] = useState(null);
  const colorScheme = useColorScheme();
  const [isModalVisible, setISModalVisible] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const { width } = useWindowDimensions();

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

  const pickMedia = useCallback(async (type) => {
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

  const uploadMedia = async (docRefId) => {
    if (!media.uri) return;
    const blob = await (await fetch(media.uri)).blob();
    const mediaRef = ref(storage, `national/${docRefId}/${media.type}`);
    await uploadBytes(mediaRef, blob);
    const downloadUrl = await getDownloadURL(mediaRef);
    await updateDoc(doc(db, "national", docRefId), {
      [media.type.toLowerCase()]: downloadUrl,
    });
  };

  const handleConfirm = () => {
    if (selectedLevel === "county") sendPost("county");
    else if (selectedLevel === "constituency") sendPost("constituency");
    else if (selectedLevel === "ward") sendPost("ward");
    setModalVisible(false);
  };

  const sendPost = async (level) => {
    if (!input.trim() || loading) {
      Alert.alert("Error", "Post content cannot be empty.");
      return;
    }
    if (!userData) {
      Alert.alert("Error", "User data is still loading. Please try again.");
      return;
    }
    setLoading(true);
    try {
      const docRef = await addDoc(
        collection(db, level, userData[level], "posts"),
        {
          uid: userData?.uid,
          text: input.trim(),
          userImg: userData?.userImg || null,
          timestamp: serverTimestamp(),
          lastname: userData?.lastname,
          name: userData?.name,
          nickname: userData?.nickname,
        }
      );
      if (media.uri) await uploadMedia(docRef.id);
      setInput("");
      setMedia({ uri: null, type: null });
    } catch (error) {
      Alert.alert("Error", "Failed to send post. Try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  const sendNational = async () => {
    setLoading(true)
    if (!input.trim()) {
      Alert.alert("Error", "Post content cannot be empty.");
      return;
    }
    if (!userData) {
      Alert.alert("Error", "User data is still loading. Please try again.");
      return;
    }

    const docRef = await addDoc(collection(db, "national"), {
      uid: userData?.uid,
      text: input.trim(),
      userImg: userData?.userImg || null,
      timestamp: serverTimestamp(),
      lastname: userData?.lastname,
      name: userData?.name,
      nickname: userData?.nickname,
    });
    if (media.uri) await uploadMedia(docRef.id);
    setInput("");
    setMedia({ uri: null, type: null });

    setLoading(false)
  };

  const getColorFromName = (name) => {
    if (!name) return "#ccc"; // Default color if no name exists

    // Generate a hash number from the name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
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

  // Fetch posts
  useEffect(() => {
    if (!user) return;

    setLoadingPosts(true);

    const q = query(collection(db, "national"), orderBy("timestamp", "desc"));

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
  }, []); // ✅ Only runs when `userData.ward` changes

  // Fetch comments for a specific post
  const fetchComments = useCallback(async () => {
    if (!postID) return;

    setLoadingComments(true); // Set loading state for comments
    try {
      const q = query(
        collection(db, "national", postID, "comments"),
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
      await addDoc(collection(db, "national", postID, "comments"), {
        uid: user.id,
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

  if (loadingPosts) {
    return (
      <View className="flex-1 justify-center items-center dark:bg-gray-800">
        <ActivityIndicator size={"large"}
          color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
        />
      </View>
    );
  }

  return (
    <View className="flex-1  dark:bg-gray-800">
      <View>
        <View className="shadow-md p-2  dark:bg-gray-800">
          <View className="flex-row items-center justify-between">
            <Text className="font-extrabold text-3xl dark:text-white">
              National
            </Text>
            <Avatar
              size={40}
              rounded
              source={userData?.userImg && { uri: userData?.userImg }}
              title={userData?.name && userData?.name[0].toUpperCase()}
              containerStyle={{
                backgroundColor: getColorFromName(userData?.name),
              }} // Consistent color per user
            />
          </View>
          <View className="mt-3  h-15 ">
            <StatusFeed />
          </View>
          <View className="w-full flex-row items-center mt-2">
            <TextInput
              placeholder="What's on your mind?"
              placeholderTextColor={
                colorScheme === "dark" ? "#FFFFFF" : "#808080"
              } // Light gray for light mode, white for dark mode
              value={input}
              onChangeText={setInput}
              multiline
              numberOfLines={3}
              style={{
                width: "88%",
                padding: 8,
                borderBottomWidth: 1,
                borderBottomColor: "gray",
                color: colorScheme === "dark" ? "#FFFFFF" : "#000000", // Text color
              }}
            />
            {loading ? (
              <ActivityIndicator
                size="small"
                color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
              />
            ) : (
              <Pressable
                onPress={sendNational}
                className="ml-2 bg-blue-500 p-2 rounded-md"
              >
                <Text className="text-white">Cast</Text>
              </Pressable>
            )}
          </View>
          {media?.uri && (
            <View className="relative mt-4 w-full items-center ">
              {media.type === "video" ? (
                  <Pressable onPress={() => setIsPaused((prev) => !prev)}>
                    <Video
                      source={{ uri: media.uri }}
                      style={{
                        width: width,
                        height: width * 0.56, // 16:9 aspect ratio
                        borderRadius: 10,
                      }}
                      useNativeControls={false}
                      isLooping
                      shouldPlay={!isPaused}
                      resizeMode="contain"
                      isMuted={isMuted}
                    />

                    <Pressable
                      onPress={() => setIsMuted(!isMuted)}
                      className="absolute bottom-2 right-2 bg-gray-700 p-2 rounded-full"
                    >
                      <FontAwesome name="volume-down" size={24} color="white" />
                    </Pressable>
                  </Pressable>
              ) : (
                <Image
                  source={{ uri: media.uri }}
                  style={{
                    width: width,
                    height: width * 0.75, // 4:3 aspect ratio
                    borderRadius: 10,
                  }}
                  resizeMode="cover"
                />
              )}

              {/* Remove Media Button */}
              <Pressable
                onPress={() => setMedia(null)}
                className="absolute top-2 right-2 bg-gray-700 p-2 rounded-full"
              >
                <FontAwesome name="times" size={16} color="white" />
              </Pressable>
            </View>
          )}

          <View className="flex-row mt-4 gap-2 justify-between w-full items-center">
            <View className="flex-row  justify-center gap-3">
              <Pressable onPress={() => pickMedia("Images")}>
                <Ionicons
                  name="image-outline"
                  size={24}
                  color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
                />
              </Pressable>

              <Pressable onPress={() => pickMedia("Videos")}>
                <Ionicons
                  name="videocam-outline"
                  size={24}
                  color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
                />
              </Pressable>
            </View>

            {["county", "constituency", "ward"].map((level) => (
              <Pressable
                key={level}
                onPress={() => {
                  setSelectedLevel(level);
                  setModalVisible(true);
                }}
                className="px-4 py-2 rounded-full bg-gray-200"
              >
                <Text
                  className={`font-bold ${
                    selectedLevel === level ? "text-blue-500" : "text-black"
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
          <Modal
            visible={modalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setModalVisible(false)}
          >
            <View className="flex-1 justify-center items-center bg-black/50 px-4">
              <View className="bg-white p-6 rounded-lg w-11/12 max-w-sm shadow-lg">
                <Text className="text-xl font-bold text-gray-800 text-center">
                  Confirm Post
                </Text>
                <Text className="text-gray-600 text-center mt-2">
                  Are you sure you want to post in your {selectedLevel}?
                </Text>
                <View className="flex-row justify-between mt-6">
                  <Pressable
                    onPress={() => setModalVisible(false)}
                    className="flex-1 bg-gray-300 py-2 rounded-lg mr-2"
                  >
                    <Text className="text-center text-gray-800 font-semibold">
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleConfirm}
                    className="flex-1 bg-blue-500 py-2 rounded-lg ml-2"
                  >
                    <Text className="text-center text-white font-semibold ">
                      Confirm
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
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
    </View>
  );
};

export default Feed;
