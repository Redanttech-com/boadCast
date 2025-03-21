import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Alert,
  TextInput,
  ActivityIndicator,
  Button,
  useWindowDimensions,
  Share,
  Image,
  Modal,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import AntDesign from "@expo/vector-icons/AntDesign";
import { db, storage } from "@/firebase";
import * as Sharing from "expo-sharing";
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { useUserInfo } from "@/components/UserContext";
import { Link, router } from "expo-router";
import { deleteObject, ref } from "firebase/storage";
import { useRecoilState } from "recoil";
import { useUser } from "@clerk/clerk-expo";
import Popover from "react-native-popover-view";
import { ResizeMode, Video } from "expo-av";
import { modalComment } from "@/atoms/modalAtom";
import moment from "moment";
import { Avatar } from "react-native-elements";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { FontAwesome5 } from "@expo/vector-icons";

const Posts = ({ post, id, openBottomSheet, isPaused }) => {
  const { formatNumber } = useUserInfo();
  const [image, setImage] = useState<string | null>(null);
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [hasLiked, setHasLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [postID, setPostID] = useRecoilState(modalComment);
  const [citeInput, setCiteInput] = useState("");
  const videoRef = useRef(null);
  const { user } = useUser();
  const [isMuted, setIsMuted] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState({});
  const [userData, setUserData] = useState(null);
  const colorScheme = useColorScheme();
  const [mediaSize, setMediaSize] = useState({ width: "100%", height: 300 });
  const { width } = useWindowDimensions();
  const [modalVisible, setModalVisible] = useState(false);
  const [bookmarkVisible, setBookmarkVisible] = useState(false);


    const handleBookmark = () => {
      toggleBookmark();
      setBookmarkVisible(false); // Close modal after action
    };

  // const cite = () => {
  //   setLoading(true);
  //   // Your cite logic here
  //   setTimeout(() => {
  //     setLoading(false);
  //     setModalVisible(false);
  //   }, 2000); // Simulate async action
  // };

  const onShare = async () => {
    try {
      const url = `https://redanttech.com/view/${id}`; // Replace with your actual URL
      const message = `${post?.nickname}/${id}\nCheck it out here: ${url}`;

      const result = await Share.share({ message });

      if (result.action === Share.sharedAction) {
        console.log(
          result.activityType
            ? `Shared with: ${result.activityType}`
            : "Shared successfully"
        );
      } else if (result.action === Share.dismissedAction) {
        console.log("Share dismissed");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  useEffect(() => {
    if (post?.images) {
      Image.getSize(post.images, (imgWidth, imgHeight) => {
        const aspectRatio = imgWidth / imgHeight;
        setMediaSize({ width: "100%", height: width / aspectRatio });
      });
    }
  }, [post?.images]);

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

  useEffect(() => {
    if (!id) {
      return;
    }
    const unsubscribe = onSnapshot(
      collection(db, "national", id, "comments"),
      (snapshot) => setComments(snapshot.docs)
    );
    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (!id) {
      return;
    }
    const unsubscribe = onSnapshot(
      collection(db, "national", id, "likes"),
      (snapshot) => setLikes(snapshot.docs)
    );

    return () => unsubscribe();
  }, [db]);

  useEffect(() => {
    if (user) {
      setHasLiked(likes.findIndex((like) => like.id === user.id) !== -1);
    }
  }, [likes]);

  async function likePost() {
    // Check if userData, userData.uid, and id exist
    if (userData && user?.id && id) {
      if (hasLiked) {
        // Unlike the post
        await deleteDoc(doc(db, "national", id, "likes", user.id));
        // console.log("Post unliked successfully.");
      } else {
        // Like the post
        await setDoc(doc(db, "national", id, "likes", user.id), {
          id: user.id || "Anonymous",
        });
      }
    } else {
      // Redirect to the authentication page if any required data is missing
      router.push("/(auth)");
    }
  }

  // Repost

  const repost = async () => {
    if (!userData?.uid) {
      router.replace("/(auth)");
      return;
    }

    setLoading(true);

    if (post) {
      Alert.alert(
        "Recast Confirmation",
        "Are you sure you want to recast this?",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => setLoading(false),
          },
          {
            text: "Recast",
            style: "default",
            onPress: async () => {
              const postData = post;
              try {
                // Construct the new post data object
                const newPostData = {
                  uid: userData.uid,
                  text: postData.text,
                  userImg: userData.userImg || null,
                  timestamp: serverTimestamp(),
                  lastname: userData.lastname,
                  name: userData.name,
                  nickname: userData.nickname,
                  from: postData.name,
                  fromNickname: userData.nickname,
                  citeUserImg: postData.userImg,
                  ...(postData.category && { fromCategory: postData.category }),
                  ...(postData.images && { images: postData.images }),
                  ...(postData.video && { video: postData.video }),
                };

                await addDoc(collection(db, "national"), newPostData);
                console.log("Post successfully reposted.");
              } catch (error) {
                console.error("Error reposting the post:", error);
              } finally {
                setLoading(false);
              }
            },
          },
        ],
        { cancelable: true }
      );
    } else {
      console.log("No post data available to repost.");
      setLoading(false);
    }
  };

  // views

  useEffect(() => {
    if (!id || !userData?.uid) return;

    const fetchPost = async () => {
      try {
        const userRef = doc(db, "userPosts", userData.uid); // Reference to the user's document
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();

          // Check if the post ID is already in viewedPosts
          if (userData.viewedPosts?.includes(id)) {
            console.log("Post already viewed.");
            return;
          }

          // Increment the post's view count
          const postRef = doc(db, "national", id);
          const postSnap = await getDoc(postRef);

          if (postSnap.exists()) {
            const postData = postSnap.data();
            await updateDoc(postRef, { views: (postData.views || 0) + 1 });
          }

          // Add this post ID to the user's viewedPosts
          await updateDoc(userRef, {
            viewedPosts: arrayUnion(id),
          });
        } else {
          // console.log("No user document found!");
        }
      } catch (error) {
        console.error("Error updating views:", error);
      }
    };

    fetchPost();
  }, [id, userData?.uid]);

  //delete post
  async function deletePost() {
    if (!id) {
      console.log("No post document reference available to delete.");
      return;
    }

    Alert.alert(
      "Delete Cast",
      "Are you sure you want to delete this cast? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Reference to comments under the post
              const commentsRef = collection(db, "national", id, "comments");
              const commentsSnapshot = await getDocs(commentsRef);
              const nationalLikesRef = collection(db, "national", id, "likes");

              const nationalLikesSnapshot = await getDocs(nationalLikesRef);
              const deletenationalLikes = nationalLikesSnapshot.docs.map(
                (likeDoc) => deleteDoc(likeDoc.ref)
              );

              // Iterate through each comment to delete its likes and the comment itself
              const deleteCommentPromises = commentsSnapshot.docs.map(
                async (commentDoc) => {
                  const commentId = commentDoc.id;

                  // Reference to likes inside the comment
                  const likesRef = collection(
                    db,
                    "national",
                    commentId,
                    "likes"
                  );
                  const likesSnapshot = await getDocs(likesRef);

                  // Delete all likes inside the comment
                  const deleteLikesPromises = likesSnapshot.docs.map(
                    (likeDoc) => deleteDoc(likeDoc.ref)
                  );
                  await Promise.all([
                    ...deletenationalLikes,
                    ...deleteLikesPromises,
                  ]);

                  // Delete the comment itself
                  await deleteDoc(commentDoc.ref);
                }
              );

              // Wait for all comments and their likes to be deleted
              await Promise.all(deleteCommentPromises);

              // Finally, delete the main post
              await deleteDoc(doc(db, "national", id));

              console.log("Post, comments, and likes deleted successfully!");
            } catch (error) {
              console.error(
                "Error deleting post with comments and likes:",
                error
              );
            }
          },
        },
      ],
      { cancelable: true } // Allows the user to dismiss the alert by tapping outside
    );
  }
  //cite post
  const cite = async () => {
    if (!user?.id) {
      router.replace("/(auth)");
    }
    if (citeInput === "") {
      return;
    }
    setLoading(true);

    if (post && user) {
      const postData = post;

      // Check if postData and properties are defined and of correct type
      if (
        postData &&
        typeof postData.text === "string" &&
        typeof citeInput === "string"
      ) {
        try {
          await addDoc(collection(db, "national"), {
            uid: user?.id,
            text: postData.text,
            citeInput: citeInput,
            userImg: userData.userImg || null,
            lastname: userData.lastname,
            timestamp: serverTimestamp(),
            citetimestamp: postData.timestamp.toDate(),
            name: userData.name,
            fromUser: postData.name,
            nickname: userData.nickname,
            fromNickname: postData.nickname,
            fromlastname: postData.lastname,
            citeUserImg: postData.userImg,
            // Include image and video only if they are defined

            ...(postData.category && { fromCategory: postData.category }),
            ...(postData.images && { images: postData.images }),
            ...(postData.video && { video: postData.video }),
          });
        } catch (error) {
          console.error("Error reposting the post:", error);
        }
      } else {
        console.error(
          "Invalid data detected. postData.text or citeInput is not a string."
        );
      }

      setLoading(false);
      setCiteInput("");
    } else {
      console.log("No post data available to repost.");
    }
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

  const userId = userData?.uid;
  const pstId = post?.id;
  // Toggle bookmark
  const checkBookmark = async () => {
    if (!userId || !pstId) return;
    try {
      const docRef = doc(db, `bookmarks/${userId}/bookmarks`, pstId);
      const docSnap = await getDoc(docRef);
      setIsBookmarked((prev) => ({
        ...prev,
        [pstId]: docSnap.exists(),
      }));
    } catch (error) {
      console.error("Error checking bookmark status:", error);
    }
  };

  // Toggle bookmark
  const toggleBookmark = async () => {
    if (!userId || !pstId) return;
    try {
      const collectionRef = collection(db, `bookmarks/${userId}/bookmarks`);
      const docRef = doc(collectionRef, pstId);

      if (isBookmarked[pstId]) {
        // Remove bookmark
        await deleteDoc(docRef);
        setIsBookmarked((prev) => ({
          ...prev,
          [pstId]: false,
        }));
      } else {
        // Add bookmark
        const images = post?.images || [];
        const videos = post?.videos || null;

        // Add new document to the collection
        const bookmarkData = { pstId, timestamp: Date.now() };
        if (images.length) bookmarkData.images = images;
        if (videos) bookmarkData.videos = videos;

        await setDoc(docRef, bookmarkData); // Use setDoc to ensure consistent doc IDs
        setIsBookmarked((prev) => ({
          ...prev,
          [pstId]: true,
        }));
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };

  useEffect(() => {
    checkBookmark();
  }, [pstId, userId]);

  const uid = post?.uid;

  return (
    <View className="mb-[0.5px] rounded-md  border-gray-200  shadow-md bg-white  dark:bg-gray-700">
      <Pressable
        className="flex-row items-center gap-1 p-2 "
        onPress={() => router.push(`/(userProfile)/${uid}`)}
      >
        <Avatar
          size={40}
          source={post?.userImg && { uri: post?.userImg }}
          title={post?.name && post?.name[0].toUpperCase()}
          containerStyle={{
            backgroundColor: getColorFromName(post?.name),
            borderRadius: 5, // Adjust this value for more or less roundness
          }}
          avatarStyle={{
            borderRadius: 5, // This affects the actual image
          }}
        />

        <View className="flex-row gap-2 items-center ">
          <Text
            className="text-md max-w-20 min-w-12 font-bold dark:text-white  "
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {post?.name}
          </Text>

          {/* <Text
            className="text-md max-w-20 min-w-12 font-bold"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {post?.lastname}
          </Text> */}

          <Text
            className="text-md max-w-20 min-w-12 text-gray-400 dark:text-white "
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            @{post?.nickname}
          </Text>

          <View className="flex-row items-center gap-2  bg-gray-100 rounded-full p-2 dark:bg-gray-600">
            <MaterialCommunityIcons
              name="clock-check-outline"
              size={14}
              color="gray"
            />
            <Text
              className="text-gray-400 max-w-18 min-w-18 "
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {moment(post?.timestamp?.toDate()).fromNow(true)}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center ml-auto gap-2">
          {user?.id === post?.uid && (
            <Pressable onPress={deletePost} className="p-4">
              <Feather
                name="trash-2"
                size={20}
                color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
              />
            </Pressable>
          )}

          <>
            <TouchableOpacity
              className="p-3"
              onPress={() => setBookmarkVisible(true)}
            >
              <Feather
                name="more-horizontal"
                size={20}
                color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
              />
            </TouchableOpacity>

            <Modal
              visible={bookmarkVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setBookmarkVisible(false)}
            >
              <View className="flex-1 justify-end items-center bg-black/40">
                <View className="bg-white dark:bg-slate-900 w-full p-4 rounded-t-2xl">
                  <Pressable
                    onPress={handleBookmark}
                    className="flex-row items-center space-x-2 p-4"
                  >
                    <Feather
                      name="bookmark"
                      size={24}
                      color={isBookmarked[pstId] ? "blue" : "gray"}
                    />
                    <Text
                      className="text-base"
                      style={{
                        color: colorScheme === "dark" ? "#FFFFFF" : "#000000",
                      }}
                    >
                      {isBookmarked[pstId] ? "Remove Bookmark" : "Add Bookmark"}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setBookmarkVisible(false)}
                    className="items-center p-4"
                  >
                    <Text className="text-red-500 font-semibold">Cancel</Text>
                  </Pressable>
                </View>
              </View>
            </Modal>
          </>
        </View>
      </Pressable>

      {post?.citeInput ? (
        <View className="gap-3">
          <Link href={`/view/${id}`} className="ml-12">
            <Text className="ml-12 dark:text-white">{post?.citeInput}</Text>
          </Link>
          <View className="bg-gray-100 ml-20 gap-3 p-2 rounded-md dark:bg-gray-600">
            <Link href={`/(userProfile)/${post?.Uid}`}>
              <Pressable className="flex-row items-center gap-1">
                <Avatar
                  size={40}
                  source={post?.citeUserImg ? { uri: post?.citeUserImg } : null}
                  title={post?.name && post?.name[0].toUpperCase()}
                  containerStyle={{
                    backgroundColor: getColorFromName(post?.name),
                    borderRadius: 5, // Adjust this value for more or less roundness
                  }} // Consistent color per user
                  avatarStyle={{
                    borderRadius: 5, // This affects the actual image
                  }}
                />
                <View className="flex-row  w-full mx-auto">
                  <Text
                    className="text-gray-800  font-bold max-w-24 min-w-12 dark:text-white"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {post?.fromUser}
                  </Text>
                  <Text
                    className="text-gray-800 font-bold max-w-24 min-w-12 dark:text-white"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {post?.fromlastname}
                  </Text>
                  <Text
                    className="text-gray-600 max-w-24 min-w-12 dark:text-white "
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {" "}
                    @{post?.fromNickname}
                  </Text>
                </View>
              </Pressable>
            </Link>

            {loading ? (
              <ActivityIndicator />
            ) : (
              <View className="bg-gray-100 rounded-md dark:bg-gray-800 w-full">
                {/* Video Handling */}
                {post?.videos && (
                  <View
                    onLayout={(event) => {
                      const { width: videoWidth } = event.nativeEvent.layout;
                      const videoHeight = videoWidth * 0.56; // Default 16:9 ratio
                      const minHeight = 300; // Minimum height for videos

                      setMediaSize({
                        width: "100%",
                        height:
                          videoHeight > minHeight ? videoHeight : minHeight, // Ensure the video height is at least the minimum value
                      });
                    }}
                  >
                    <Video
                      ref={videoRef}
                      source={{ uri: post?.videos }}
                      style={{
                        width: "100%",
                        height: 420,
                      }}
                      isLooping
                      shouldPlay={!isPaused}
                      resizeMode={ResizeMode.COVER}
                      isMuted={isMuted}
                      className="relative"
                    />
                    <Pressable
                      onPress={() => setIsMuted(!isMuted)}
                      className="absolute flex-1 w-full h-full"
                    >
                      <View className="ml-auto mt-auto m-2">
                        <FontAwesome5
                          name={isMuted ? "volume-mute" : "volume-down"}
                          size={24}
                          color={colorScheme === "dark" ? "#FFFFFF" : "#1F2937"}
                        />
                      </View>
                    </Pressable>
                  </View>
                )}

                {/* Image Handling */}
                {post?.images && (
                  <Link href={`/view/${id}`}>
                    <Image
                      source={{ uri: post.images }}
                      style={{
                        width: mediaSize.width,
                        height: 420,
                      }}
                      resizeMode={ResizeMode.COVER}
                      className="w-full"
                    />
                  </Link>
                )}
              </View>
            )}

            <View className="w-full">
              <Text className=" dark:text-white ">{post?.text}</Text>
            </View>
          </View>
        </View>
      ) : (
        <>
          <View className="mx-2 mb-1 gap-3">
            <Link href={`/view/${id}`}>
              <Text className="text-md dark:text-white ">{post?.text}</Text>
            </Link>
            {post?.fromNickname && (
              <Text className="text-gray-500">
                Reposted by @{post?.fromNickname}
              </Text>
            )}
          </View>
          {loading ? (
            <ActivityIndicator />
          ) : (
            <View className="bg-gray-100 rounded-md dark:bg-gray-800 w-screen">
              {/* Video Handling */}
              {post?.videos && (
                <View style={{ width: "100%" }}>
                  <Video
                    ref={videoRef}
                    source={{ uri: post?.videos }}
                    style={{ width: "100%", height: 420 }}
                    useNativeControls
                    resizeMode={ResizeMode.COVER}
                  />
                </View>
              )}

              {/* Image Handling */}
              {post?.images && (
                <Link href={`/view/${id}`}>
                  <Image
                    source={{ uri: post.images }}
                    style={{ width: "100%", height: 420 }}
                    resizeMode={ResizeMode.COVER}
                  />
                </Link>
              )}
            </View>
          )}
        </>
      )}

      <View className="items-center justify-between  flex-row ">
        <TouchableOpacity>
          <Pressable
            onPress={
              !user?.id
                ? () => router.push("/(auth)")
                : () => {
                    setPostID(id);
                    openBottomSheet();
                  }
            }
            className="flex-row items-center p-4"
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={24}
              color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
            />
            <View>
              <Text className="dark:text-white">
                {comments?.length > 0 ? formatNumber(comments?.length) : ""}
              </Text>
            </View>
          </Pressable>
        </TouchableOpacity>

        <View>
          {loading ? (
            <ActivityIndicator color="blue" />
          ) : (
            <Pressable onPress={repost} className="p-4">
              <Feather
                name="corner-up-left"
                size={20}
                color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
              />
            </Pressable>
          )}
        </View>

        <TouchableOpacity className="p-4" onPress={() => setModalVisible(true)}>
          <Feather
            name="edit"
            size={20}
            color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
          />
        </TouchableOpacity>
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View className="flex-1 justify-center items-center bg-black/50">
            <View className="p-4 min-w-96 bg-white dark:bg-slate-900 rounded-md shadow-md">
              <TextInput
                onChangeText={setCiteInput}
                value={citeInput}
                placeholder="Cite this post..."
                placeholderTextColor={
                  colorScheme === "dark" ? "#FFFFFF" : "#808080"
                }
                className="w-full p-2 border border-gray-300 rounded-md min-w-96"
                style={{
                  color: colorScheme === "dark" ? "#FFFFFF" : "#000000",
                }}
              />
              <Pressable
                className="mt-4 p-3 bg-blue-700 rounded-md w-full flex items-center min-w-96"
                onPress={cite}
              >
                <Text className="text-white font-semibold dark:text-white">
                  {loading ? "Citing..." : "Cite"}
                </Text>
              </Pressable>
              <Pressable
                className="mt-2 p-2 w-full items-center"
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-red-500 font-semibold">Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <TouchableOpacity
          onPress={likePost}
          className="flex-row items-center gap-2 p-4"
        >
          <AntDesign
            name={hasLiked ? "heart" : "hearto"}
            size={20}
            color={
              hasLiked ? "red" : colorScheme === "dark" ? "white" : "black"
            }
          />
          {likes.length > 0 && (
            <View>
              <Text className="dark:text-white">
                {formatNumber(likes.length)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <View className="flex-row items-center gap-2">
          <Feather
            name="eye"
            size={20}
            color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
          />
          <Text>{formatNumber(post?.views)}</Text>
        </View>
        <TouchableOpacity className="p-3">
          <AntDesign
            name="sharealt"
            size={20}
            color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
            // onPress={onShare}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Posts;
