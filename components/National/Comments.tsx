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
  ScrollView,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
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
import { modalComment } from "@/atoms/modalAtom";
import Moment from "react-moment";
import moment from "moment";
import { useUser } from "@clerk/clerk-expo";
import { Avatar } from "react-native-elements";

const Comments = ({ id, comment }) => {
  const { userDetails, formatNumber } = useUserInfo();
  const [hasLiked, setHasLiked] = useState(false);
  const [likes, setLikes] = useState([]);
  const { user } = useUser();
  const [postID, setPostID] = useRecoilState(modalComment);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      if (!db || !id || !postID) {
        return;
      }
      const unsubscribe = onSnapshot(
        collection(db, "national", postID, "comments", id, "likes"),
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
      if (userDetails && userDetails?.uid && id && postID) {
        if (hasLiked) {
          // Unlike the post
          await deleteDoc(
            doc(db, "national", postID, "comments", id, "likes", userDetails.uid)
          );
        } else {
          // Like the post
          await setDoc(
            doc(db, "national", postID, "comments", id, "likes", userDetails.uid),
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

 async function deleteComment() {
   if (!id) {
     console.log("No post document reference available to delete.");
     return;
   }

   Alert.alert(
     "Delete Comment",
     "Are you sure you want to delete this comment? This action cannot be undone.",
     [
       {
         text: "Cancel",
         style: "cancel",
       },
       {
         text: "Delete",
         style: "destructive",
         onPress: async () => {
           setLoading(true); // Set loading *inside* onPress to avoid early state change

           try {
             // Delete all likes associated with the comment
             const likesCollectionRef = collection(
               db,
               "national",
               postID,
               "comments",
               id,
               "likes"
             );
             const likesSnapshot = await getDocs(likesCollectionRef);
             const deleteLikesPromises = likesSnapshot.docs.map((likeDoc) =>
               deleteDoc(likeDoc.ref)
             );
             await Promise.all(deleteLikesPromises);

             // Delete the comment document
             await deleteDoc(doc(db, "national", postID, "comments", id));
           } catch (error) {
             console.error("Error deleting comment:", error);
           } finally {
             setLoading(false); // Ensure loading is disabled after deletion (or error)
           }
         },
       },
     ],
     { cancelable: true }
   );
 }

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
    <View key={id} className="p-3 gap-3">
      <View className="flex-row items-center gap-3">
        <Avatar
          size={40}
          rounded
          source={comment?.data()?.userImg ? { uri: comment?.data()?.userImg } : null}
          title={comment?.data()?.name ? comment?.data()?.name[0].toUpperCase() : "?"}
          containerStyle={{ backgroundColor: getColorFromName(comment?.data()?.name) }} // Consistent color per user
        />

        <View className="flex-row gap-2 items-center ">
          <Text
            className="text-md max-w-20 min-w-16 font-bold"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {comment?.data()?.name}
          </Text>
          {/* 
          <Text
            className="text-sm max-w-20 font-bold"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {comment?.data()?.lastname}
          </Text> */}

          <Text
            className="text-sm max-w-20 min-w-16 text-gray-400"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            @{comment?.data()?.nickname}
          </Text>

          <View className="flex-row items-center gap-1 rounded-full p-2">
            <MaterialCommunityIcons
              name="clock-check-outline"
              size={12}
              color="gray"
            />
            <Text
              className="text-gray-400 min-w-16 max-w-16"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {moment(comment?.data()?.timestamp?.toDate()).fromNow(true)}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center ml-auto gap-1">
          {user?.id === comment?.data()?.uid && (
            <Pressable onPress={deleteComment} className="p-3">
              <Feather name="trash-2" size={20} color="black" />
            </Pressable>
          )}
          <View className="flex-col h-14 items-center">
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
          </View>
        </View>
      </View>

      <View className="ml-12">
        <Text>{comment?.data()?.comment}</Text>
      </View>
      <View>
        <Image source={{ uri: comment?.data()?.image }} />
      </View>
    </View>
  );
};

export default Comments;

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
