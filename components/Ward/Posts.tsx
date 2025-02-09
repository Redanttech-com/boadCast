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
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  Alert,
  StyleSheet,
  TextInput,
  ScrollView,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import AntDesign from "@expo/vector-icons/AntDesign";

import * as ImagePicker from "expo-image-picker";
import { auth, db, storage } from "@/firebase";
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useUserInfo } from "@/components/UserContext";
import { router } from "expo-router";
import { deleteObject, ref } from "firebase/storage";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useRecoilState } from "recoil";
import Moment from "react-moment";
import { useUser } from "@clerk/clerk-expo";
import Popover from "react-native-popover-view";
import { Video } from "expo-av";
import { modalWardComment } from "@/atoms/modalAtom";
import moment from "moment";
import { Avatar } from "react-native-elements";

const Posts = ({ post, id, openBottomSheet, isPaused }) => {
  const { userDetails, formatNumber } = useUserInfo();
  const [image, setImage] = useState<string | null>(null);
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [hasLiked, setHasLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [postID, setPostID] = useRecoilState(modalWardComment);
  const [citeInput, setCiteInput] = useState("");
  const { user } = useUser();
  const videoRef = useRef(null);

  // like

  useEffect(() => {
    if (!db || !id || !userDetails) {
      return;
    }
    const unsubscribe = onSnapshot(
      collection(db, "ward", userDetails?.ward, "posts", id, "comments"),
      (snapshot) => setComments(snapshot.docs)
    );
  }, [db]);

  useEffect(() => {
    try {
      if (!db || !id || !userDetails) {
        return;
      }
      const unsubscribe = onSnapshot(
        collection(db, "ward", userDetails?.ward, "posts", id, "likes"),
        (snapshot) => setLikes(snapshot.docs)
      );

      return () => unsubscribe();
    } catch (error) {
      console.log("likes error", error);
    }
  }, [db]);

  useEffect(() => {
    if (user) {
      setHasLiked(likes.findIndex((like) => like.uid === user.id) !== -1);
    }
  }, [likes]);

  async function likePost() {
    try {
      // Check if userDetails, userDetails.uid, and id exist
      if (userDetails && userDetails?.uid && id) {
        if (hasLiked) {
          // Unlike the post
          await deleteDoc(
            doc(
              db,
              "ward",
              userDetails?.ward,
              "posts",
              id,
              "likes",
              userDetails?.uid
            )
          );
        } else {
          // Like the post
          await setDoc(
            doc(
              db,
              "ward",
              userDetails?.ward,
              "posts",
              id,
              "likes",
              userDetails?.uid
            ),
            {
              username: userDetails.nickname || "Anonymous",
            }
          );
        }
      } else {
        // Redirect to the authentication page if any required data is missing
        router.push("/(auth)");
      }
    } catch (error) {
      console.log("[Error liking post]:", error);
    }
  }

  // Repost

  const repost = async () => {
    if (!userDetails?.uid) {
      router.replace("/(auth)");
      return;
    }

    if (post) {
      Alert.alert(
        "Repost Confirmation",
        "Are you sure you want to repost this? It will appear on your profile.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Repost",
            style: "default",
            onPress: async () => {
              const postData = post;
              try {
                // Construct the new post data object
                const newPostData = {
                  uid: userDetails?.uid,
                  text: postData.text,
                  userImg: userDetails.userImg,
                  timestamp: serverTimestamp(),
                  lastname: userDetails.lastname,
                  name: userDetails.name,
                  nickname: userDetails.nickname,
                  from: postData.name,
                  fromNickname: userDetails.nickname,
                  citeUserImg: postData.userImg,
                  ...(postData.category && { fromCategory: postData.category }),
                  ...(postData.images && { images: postData.images }),
                  ...(postData.video && { video: postData.video }),
                };

                await addDoc(
                  collection(db, "ward", userDetails?.ward, "posts"),
                  newPostData
                );
                console.log("Post successfully reposted.");
              } catch (error) {
                console.error("Error reposting the post:", error);
              }
            },
          },
        ],
        { cancelable: true }
      );
    } else {
      console.log("No post data available to repost.");
    }
  };

  // views

  useEffect(() => {
    if (!id || !userDetails?.uid) return;

    const fetchPost = async () => {
      try {
        const userRef = doc(db, "userPosts", userDetails?.uid); // Reference to the user's document
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userDetails = userSnap.data();

          // Check if the post ID is already in viewedPosts
          if (userDetails.viewedPosts?.includes(id)) {
            console.log("Post already viewed.");
            return;
          }

          // Increment the post's view count
          const postRef = doc(db, "ward", userDetails?.ward, "posts", id);
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
  }, [id, userDetails?.uid]);

  //delete post
  async function deletePost() {
    if (!id) {
      console.log("No post document reference available to delete.");
      return;
    }

    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post? This action cannot be undone.",
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
              // Delete all likes associated with the post
              const likesCollectionRef = collection(
                db,
                "postd",

                id,
                "likes"
              );
              const likesSnapshot = await getDocs(likesCollectionRef);
              const deleteLikesPromises = likesSnapshot.docs.map((likeDoc) =>
                deleteDoc(likeDoc.ref)
              );
              await Promise.all(deleteLikesPromises);

              // Delete the post document
              await deleteDoc(doc(db, "ward", userDetails?.ward, "posts", id));

              // Delete the video associated with the post, if it exists
              const vidRef = ref(storage, `posts/${id}/video`);
              try {
                await deleteObject(vidRef);
              } catch (videoError) {
                console.warn(
                  "Video could not be deleted (may not exist):",
                  videoError
                );
              }

              // Delete the image associated with the post, if it exists
              const imageRef = ref(storage, `posts/${id}/image`);
              try {
                await deleteObject(imageRef);
              } catch (imageError) {
                console.warn(
                  "Image could not be deleted (may not exist):",
                  imageError
                );
              }

              console.log(
                "Post and associated resources deleted successfully."
              );
            } catch (error) {
              console.error("An error occurred during deletion:", error);
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
    if (citeInput === "") return;
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
          await addDoc(collection(db, "ward", userDetails?.ward, "posts"), {
            uid: user?.id,
            text: postData.text,
            citeInput: citeInput,
            userImg: userDetails.userImg,
            lastname: userDetails.lastname,
            timestamp: serverTimestamp(),
            citetimestamp: postData.timestamp.toDate(),
            name: userDetails.name,
            fromUser: postData.name,
            nickname: userDetails.nickname,
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
  return (
    <View className="mb-1 rounded-md  border-gray-200  shadow-md bg-white p-2">
      <View className="flex-row items-center gap-1">
        <Avatar
          size={40}
          rounded
          source={post?.userImg ? { uri: post?.userImg } : null}
          title={post?.name ? post?.name[0].toUpperCase() : "?"}
          containerStyle={{ backgroundColor: getColorFromName(post?.name) }} // Consistent color per user
        />
        <View className="flex-row gap-2 items-center ">
          <Text
            className="text-md max-w-20 min-w-12 font-bold  "
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
            className="text-md max-w-20 min-w-12 text-gray-400"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            @{post?.nickname}
          </Text>

          <View className="flex-row items-center gap-2  bg-gray-100 rounded-full p-2">
            <MaterialCommunityIcons
              name="clock-check-outline"
              size={14}
              color="gray"
            />
            <Text
              className="text-gray-400 max-w-18 min-w-18"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {moment(post?.timestamp?.toDate()).fromNow(true)}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center ml-auto gap-2">
          {user?.id === post?.uid && (
            <Pressable onPress={deletePost}>
              <Feather name="trash-2" size={20} color="black" />
            </Pressable>
          )}

          <TouchableOpacity>
            <Feather name="more-horizontal" size={20} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      {post?.citeInput ? (
        <View className="gap-3">
          <Text className="ml-12">{post?.citeInput}</Text>
          <View className="bg-gray-100 ml-20 gap-3 p-2 rounded-md">
            <View className="flex-row items-center gap-1">
              <Avatar
                  size={40}
                  rounded
                  source={post?.citeUserImg ? { uri: post?.citeUserImg } : null}
                  title={post?.name ? post?.name[0].toUpperCase() : "?"}
                  containerStyle={{
                    backgroundColor: getColorFromName(post?.name),
                  }} // Consistent color per user
                />
              <View className="flex-row  w-full mx-auto">
                <Text
                  className="text-gray-800  font-bold max-w-24 min-w-12 "
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {post?.fromUser}
                </Text>
                <Text
                  className="text-gray-800 font-bold max-w-24 min-w-12"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {post?.fromlastname}
                </Text>
                <Text
                  className="text-gray-600 max-w-24 min-w-12 "
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {" "}
                  @{post?.fromNickname}
                </Text>
              </View>
            </View>
            <View className="w-full ">
              <Text className="ml-12">{post?.text}</Text>
            </View>
          </View>
        </View>
      ) : (
        <>
          <View className="ml-12 mb-4">
            <Text className="text-md">{post?.text}</Text>
            {post?.fromNickname && (
              <Text className="text-gray-500">
                Reposted by @{post?.fromNickname}
              </Text>
            )}
          </View>
          {post?.videos && (
            <Video
              ref={videoRef}
              source={{
                uri: post?.videos,
              }}
              style={{ width: "100%", height: 400, borderRadius: 10 }}
              useNativeControls
              isLooping
              shouldPlay={!isPaused}
              resizeMode="contain"
            />
          )}
          {post?.images && (
            <Image
              source={{
                uri: post?.images,
              }}
              className="w-full h-96 rounded-md"
              resizeMode="cover"
            />
          )}
        </>
      )}

      <View className="items-center justify-between  flex-row m-5 ">
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
            className="flex-row items-center p-3"
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={24}
              color="black"
            />
            <View>
              <Text>
                {comments.length > 0 ? formatNumber(comments.length) : ""}
              </Text>
            </View>
          </Pressable>
        </TouchableOpacity>

        <View>
          <Pressable onPress={repost} className="p-3">
            <Feather name="corner-up-left" size={20} color="black" />
          </Pressable>
        </View>

        <Popover
          from={
            <TouchableOpacity className="p-3">
              <Feather name="edit" size={20} color="black" />
            </TouchableOpacity>
          }
        >
          <View className="p-4  min-w-96 bg-white rounded-md shadow-md">
            <TextInput
              onChangeText={setCiteInput}
              value={citeInput}
              placeholder="Cite this post..."
              className="w-full p-2 border border-gray-300 rounded-md   min-w-96"
            />
            <Pressable
              className="mt-4 p-3 bg-blue-700 rounded-md w-full flex items-center   min-w-96"
              onPress={cite}
            >
              <Text className="text-white font-semibold">
                {loading ? "Citing..." : "Cite"}
              </Text>
            </Pressable>
          </View>
        </Popover>

        <TouchableOpacity className="flex-row items-center">
          <Pressable onPress={likePost} className="p-3 ">
            <AntDesign
              name="hearto"
              size={20}
              color={hasLiked ? "red" : "gray"}
            />
          </Pressable>
          {likes.length > 0 && (
            <View>
              <Text>{formatNumber(likes.length)}</Text>
            </View>
          )}
        </TouchableOpacity>
        <View className="flex-row items-center gap-2">
          <Feather name="eye" size={20} color="black" />
          <Text>{formatNumber(post?.views)}</Text>
        </View>
        <TouchableOpacity className="p-3">
          <AntDesign name="sharealt" size={20} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Posts;
