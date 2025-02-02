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
  FlatList,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Video, ResizeMode } from "expo-av";
import FastImage from "react-native-fast-image";

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
import { useUserInfo } from "@/providers/UserContext";
import { router } from "expo-router";
import { deleteObject, ref } from "firebase/storage";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useRecoilState } from "recoil";
import { modalComment } from "@/atoms/modalAtom";
import Moment from "react-moment";
import { useUser } from "@clerk/clerk-expo";
import Popover from "react-native-popover-view";
import moment from "moment";

const Posts = ({ post, id, openBottomSheet }) => {
  const { userData, formatNumber } = useUserInfo();

  const [image, setImage] = useState<string | null>(null);
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [hasLiked, setHasLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const mediaItems = post?.data()?.media || [];

  const [postID, setPostID] = useRecoilState(modalComment);

  const [citeInput, setCiteInput] = useState("");
  const [status, setStatus] = useState({});

  const renderMediaItem = ({ item }) =>
    item.endsWith(".mp4") ? (
      <Video
        source={{ uri: item }}
        style={styles.media}
        useNativeControls
        resizeMode="contain"
      />
    ) : (
      <FastImage
        source={{ uri: item }}
        style={styles.media}
        resizeMode={FastImage.resizeMode.cover}
      />
    );

  // like

  useEffect(() => {
    try {
      if (!db || !id) {
        return;
      }
      const unsubscribe = onSnapshot(
        collection(db, "posts", id, "likes"),
        (snapshot) => setLikes(snapshot.docs)
      );

      return () => unsubscribe();
    } catch (error) {
      console.log("likes error", error);
    }
  }, [db]);

  useEffect(() => {
    if (!db || !id) {
      return;
    }
    const unsubscribe = onSnapshot(
      collection(db, "posts", id, "comments"),
      (snapshot) => setComments(snapshot.docs)
    );
  }, [db]);

  const { user } = useUser();

  useEffect(() => {
    if (user) {
      setHasLiked(likes.findIndex((like) => like.id === user?.id) !== -1);
    }
  }, [likes]);

  async function likePost() {
    try {
      // Check if userData, userData.uid, and id exist
      if (userData && userData.id && id) {
        if (hasLiked) {
          // Unlike the post
          await deleteDoc(doc(db, "posts", id, "likes", userData.id));
        } else {
          // Like the post
          await setDoc(doc(db, "posts", id, "likes", userData.id), {
            username: userData.nickname || "Anonymous",
          });
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
    if (!userData?.id) {
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
              const postData = post.data();
              try {
                // Construct the new post data object
                const newPostData = {
                  id: userData.id,
                  text: postData.text,
                  userImg: userData.userImg,
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

                await addDoc(collection(db, "posts"), newPostData);
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

  // // views

  useEffect(() => {
    if (!userData?.id) return;

    const fetchPost = async () => {
      try {
        const userRef = doc(db, "userPosts", userData.id); // Reference to the user's document
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();

          // Check if the post ID is already in viewedPosts
          if (userData.viewedPosts?.includes(id)) {
            console.log("Post already viewed.");
            return;
          }

          // Increment the post's view count
          const postRef = doc(db, "posts", id);
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
  }, [id, userData?.id]);

  // //delete post
  async function deletePost() {
    if (!id) {
      console.log("No post document reference available to delete.");
      return;
    }

    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post?.This action cannot be undone.",
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
              const likesCollectionRef = collection(db, "posts", id, "likes");
              const likesSnapshot = await getDocs(likesCollectionRef);

              const deleteLikesPromises = likesSnapshot.docs.map((likeDoc) =>
                deleteDoc(likeDoc.ref)
              );
              await Promise.all(deleteLikesPromises);

              await deleteDoc(doc(db, "posts", id));

              // Delete all images associated with the post
              const imageUrls = post?.data()?.images; // Assuming 'images' is an array of image URLs
              if (imageUrls && imageUrls.length > 0) {
                const deleteImagePromises = imageUrls.map((url, index) => {
                  const imageRef = ref(storage, `posts/${id}/image-${index}`);
                  return deleteObject(imageRef);
                });
                // Wait for all the delete operations to complete
                await Promise.all(deleteImagePromises);
              }

              // Delete the video if it exists
              if (post?.data()?.video) {
                await deleteObject(ref(storage, `posts/${id}/video`));
              }

              console.log("Post and associated data deleted successfully.");
            } catch (error) {
              console.error("An error occurred during deletion:", error);
            }
          },
        },
      ],
      { cancelable: true } // Allows the user to dismiss the alert by tapping outside
    );
  }

  // //cite post
  const cite = async () => {
    if (!user?.id) {
      router.replace("/(auth)");
    }
    setLoading(true);

    if (post && user) {
      const postData = post.data();

      // Check if postData and properties are defined and of correct type
      if (
        postData &&
        typeof postData.text === "string" &&
        typeof citeInput === "string"
      ) {
        try {
          await addDoc(collection(db, "posts"), {
            id: user.id,
            text: postData.text,
            citeInput: citeInput,
            userImg: userData.userImg,
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

  return (
    <View
      // key={id}
      className="mb-1 rounded-md  border-gray-200  shadow-md bg-white p-2"
    >
      <View className="flex-row items-center gap-3">
        <Image
          source={{
            uri: post?.data()?.userImg,
          }}
          className="h-10 w-10 rounded-md"
        />
        <FontAwesome name="check-circle" size={15} color="green" />
        <View className="flex-row gap-2 items-center">
          <Text className="text-sm">@{post?.data()?.nickname}</Text>
          <Text className="text-sm">{post?.data()?.lastname}</Text>

          <View className="flex-row items-center gap-2 bg-blue-200 rounded-full p-2">
            <MaterialCommunityIcons
              name="clock-check-outline"
              size={14}
              color="black"
            />
            <Text style={{ fontSize: 12, color: "gray" }}>
              {moment(post?.data()?.timestamp?.toDate()).fromNow()}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center ml-auto gap-2">
          {userData?.id === post?.data()?.id && (
            <Pressable onPress={deletePost}>
              <Feather name="trash-2" size={20} color="black" />
            </Pressable>
          )}

          <TouchableOpacity>
            <Feather name="more-horizontal" size={20} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      {post?.data()?.citeInput ? (
        <View className="">
          <Text className="ml-12">{post?.data()?.citeInput}</Text>
          <View className="bg-gray-100 ml-20 gap-3 p-2 rounded-md">
            <View className="flex-row items-center gap-3">
              <Image
                source={{ uri: post?.data()?.citeUserImg }}
                className="h-10 w-10 rounded-md"
              />
              <Text>
                {post?.data()?.fromUser} {post?.data()?.fromlastname} @
                {post?.data()?.fromNickname}
              </Text>
            </View>
            <View className="w-full ">
              <Text className="ml-12">{post?.data()?.text}</Text>
            </View>
          </View>
        </View>
      ) : (
        <>
          <View className="ml-12 mb-4">
            <Text>{post?.data()?.text}</Text>
            {post?.data()?.fromNickname && (
              <Text>Reposted by @{post?.data()?.fromNickname}</Text>
            )}
          </View>
          <View style={{ height: 220 }}>
            <FlatList
              data={mediaItems}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={renderMediaItem}
              keyExtractor={(item, index) => index.toString()}
            />
          </View>
        </>
      )}

      <View className="items-center justify-between gap-3 flex-row m-5 ">
        <TouchableOpacity>
          <Pressable
            onPress={
              !userData?.id
                ? () => router.push("/(auth)")
                : () => {
                    setPostID(id);
                    openBottomSheet();
                  }
            }
            className="flex-row items-center gap-2"
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={24}
              color="black"
            />
            <View>
              <Text>{formatNumber(comments.length)}</Text>
            </View>
          </Pressable>
        </TouchableOpacity>

        <View>
          <Pressable onPress={repost}>
            <Feather name="corner-up-left" size={20} color="black" />
          </Pressable>
        </View>

        <Popover
          from={
            <TouchableOpacity>
              <Feather name="edit" size={20} color="black" />
            </TouchableOpacity>
          }
        >
          <View className="p-4 w-full bg-white rounded-md shadow-md">
            <TextInput
              onChangeText={setCiteInput}
              value={citeInput}
              placeholder="Cite this post..."
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            <Pressable
              className="mt-4 p-3 bg-blue-700 rounded-md w-full flex items-center"
              onPress={cite}
            >
              <Text className="text-white font-semibold">
                {loading ? "Citing..." : "Cite"}
              </Text>
            </Pressable>
          </View>
        </Popover>

        <TouchableOpacity className="flex-row gap-2">
          <Pressable onPress={likePost}>
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
          <Text>{formatNumber(post?.data()?.views)}</Text>
        </View>
        <TouchableOpacity>
          <AntDesign name="sharealt" size={20} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Posts;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "grey",
  },
  contentContainer: {
    flex: 1,
    padding: 36,
    alignItems: "center",
  },
});

// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   Pressable,
//   ScrollView,
//   StyleSheet,
//   TextInput,
//   FlatList,
// } from "react-native";
// import FastImage from "react-native-fast-image";
// import FontAwesome from "@expo/vector-icons/FontAwesome";
// import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
// import Feather from "@expo/vector-icons/Feather";
// import Ionicons from "@expo/vector-icons/Ionicons";
// import AntDesign from "@expo/vector-icons/AntDesign";
// import { Video } from "expo-av";
// import moment from "moment";
// import { useUserInfo } from "@/providers/UserContext";
// import { useRecoilState } from "recoil";
// import { modalComment } from "@/atoms/modalAtom";

// const Posts = ({ post, id, openBottomSheet }) => {
//   const { userData, formatNumber } = useUserInfo();
//   const [likes, setLikes] = useState([]);
//   const [comments, setComments] = useState([]);
//   const [hasLiked, setHasLiked] = useState(false);
//   const [postID, setPostID] = useRecoilState(modalComment);
//   const mediaItems = post?.data()?.media || [];

//   const renderMediaItem = ({ item }) =>
//     item.endsWith(".mp4") ? (
//       <Video
//         source={{ uri: item }}
//         style={styles.media}
//         useNativeControls
//         resizeMode="contain"
//       />
//     ) : (
//       <FastImage
//         source={{ uri: item }}
//         style={styles.media}
//         resizeMode={FastImage.resizeMode.cover}
//       />
//     );

//   return (
//     <View className="mb-1 rounded-md border-gray-200 shadow-md bg-white p-2">
//       <View className="flex-row items-center gap-3">
//         <FastImage
//           source={{ uri: post?.data()?.userImg }}
//           className="h-10 w-10 rounded-md"
//         />
//         <FontAwesome name="check-circle" size={15} color="green" />
//         <View className="flex-row gap-2 items-center">
//           <Text className="text-sm">@{post?.data()?.nickname}</Text>
//           <Text className="text-sm">{post?.data()?.lastname}</Text>
//           <View className="flex-row items-center gap-2 bg-blue-200 rounded-full p-2">
//             <MaterialCommunityIcons
//               name="clock-check-outline"
//               size={14}
//               color="black"
//             />
//             <Text style={{ fontSize: 12, color: "gray" }}>
//               {moment(post?.data()?.timestamp?.toDate()).fromNow()}
//             </Text>
//           </View>
//         </View>
//       </View>

//       <View className="ml-12 mb-4">
//         <Text>{post?.data()?.text}</Text>
//       </View>

//       <View style={{ height: 220 }}>
//         <FlatList
//           data={mediaItems}
//           horizontal
//           showsHorizontalScrollIndicator={false}
//           renderItem={renderMediaItem}
//           keyExtractor={(item, index) => index.toString()}
//         />
//       </View>

//       <View className="items-center justify-between gap-3 flex-row m-5">
//         <TouchableOpacity>
//           <Pressable
//             onPress={() => {
//               setPostID(id);
//               openBottomSheet();
//             }}
//             className="flex-row items-center gap-2"
//           >
//             <Ionicons
//               name="chatbubble-ellipses-outline"
//               size={24}
//               color="black"
//             />
//             <Text>{formatNumber(comments.length)}</Text>
//           </Pressable>
//         </TouchableOpacity>

//         <TouchableOpacity className="flex-row gap-2">
//           <Pressable>
//             <AntDesign
//               name="hearto"
//               size={20}
//               color={hasLiked ? "red" : "gray"}
//             />
//           </Pressable>
//           {likes.length > 0 && <Text>{formatNumber(likes.length)}</Text>}
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// export default Posts;

// const styles = StyleSheet.create({
//   media: {
//     width: 500,
//     height: 400,
//     borderRadius: 10,
//     marginRight: 10,
//   },
// });
