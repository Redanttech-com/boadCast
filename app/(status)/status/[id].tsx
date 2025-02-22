import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Animated,
  TouchableWithoutFeedback,
  Image,
  Alert,
  Pressable,
} from "react-native";
import { ResizeMode, Video } from "expo-av";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Avatar } from "react-native-elements";
import { router, useLocalSearchParams } from "expo-router";
import { db, storage } from "@/firebase";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { deleteObject, ref } from "firebase/storage";
import { useUser } from "@clerk/clerk-expo";

export default function StatusPage() {
  const { id } = useLocalSearchParams();
  const [statuses, setStatuses] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const progress = useRef(new Animated.Value(0)).current;
  const videoRef = useRef(null);
  const [userData, setUserData] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const animationRef = useRef(null);
  const colorScheme = useColorScheme();
  const { user } = useUser();


  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      const q = query(collection(db, "userPosts"), where("uid", "==", user?.id));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setUserData(querySnapshot.docs[0].data());
      }
    };
    fetchUserData();
  }, [id]);

 useEffect(() => {
   const fetchUserData = async () => {
     if (!id) return; // Ensure ID is present

     try {
       const docRef = doc(db, "status", id);
       const docSnap = await getDoc(docRef);

       if (docSnap.exists()) {
         setStatuses([docSnap.data()]); // Ensure it's always an array
       } else {
         console.warn("⚠️ No status found with this ID:", id);
         setStatuses([]); // Set empty array to prevent errors
       }
     } catch (error) {
       console.error("❌ Error fetching status:", error);
       setStatuses([]); // Prevent null issues on failure
     } finally {
       setLoading(false);
     }
   };

   fetchUserData();
 }, [id]);


  useEffect(() => {
    if (!statuses?.length || loading) return;

    progress.setValue(0);
    startAnimation();
  }, [statuses, currentIndex, loading]);

  const startAnimation = () => {
    animationRef.current = Animated.timing(progress, {
      toValue: 100,
      duration: statuses[currentIndex]?.videos ? 10000 : 5000, // 10 sec for video, 5 sec for image
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) handleNext();
    });
  };

  const pauseEverything = () => {
    setIsPaused(true);
    progress.stopAnimation();
    videoRef.current?.pauseAsync();
  };

  const resumeEverything = () => {
    setIsPaused(false);
    startAnimation();
    videoRef.current?.playAsync();
  };

  const handleNext = () => {
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      router.push("/(drawer)/(tabs)");
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center dark:bg-gray-800">
        <ActivityIndicator
          size="large"
          color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
        />
      </View>
    );
  }

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
              // const likesCollectionRef = collection(db, "status", id);
              // const likesSnapshot = await getDocs(likesCollectionRef);
              // const deleteLikesPromises = likesSnapshot.docs.map((likeDoc) =>
              //   deleteDoc(likeDoc.ref)
              // // );
              // await Promise.all(deleteLikesPromises);

              // Delete the post document
              await deleteDoc(doc(db, "status", id));

              // Delete the video associated with the post, if it exists
              const vidRef = ref(storage, `status/${id}/video`);
              try {
                await deleteObject(vidRef);
              } catch (videoError) {
                console.warn(
                  "Video could not be deleted (may not exist):",
                  videoError
                );
              }

              // Delete the image associated with the post, if it exists
              const imageRef = ref(storage, `status/${id}/image`);
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

  return (
    <TouchableWithoutFeedback
      onPressIn={pauseEverything} // Pause when touch starts
      onPressOut={resumeEverything} // Resume when touch ends
    >
      <SafeAreaView className="dark:bg-gray-800 flex-1">
        <StatusBar style="auto" />
        <View className="flex-row items-center gap-1 justify-between p-2 dark:bg-gray-800">
          <View className="flex-row gap-2 items-center">
            <Avatar
              size={40}
              rounded
              source={userData?.userImg ? { uri: userData?.userImg } : null}
              title={userData?.name && userData?.name[0].toUpperCase()}
              containerStyle={{ backgroundColor: "#3498DB" }} // Consistent color per user
            />

            <Text className="text-md max-w-20 min-w-12 font-bold dark:text-white">
              {userData?.name}
            </Text>
          </View>
          <View>
            {user?.id === statuses[currentIndex]?.uid && (
              <Pressable onPress={deletePost}>
                <Feather
                  name="trash-2"
                  size={20}
                  color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
                />
              </Pressable>
            )}
          </View>
        </View>

        {/* Progress Bar */}
        <View style={{ height: 2, backgroundColor: "#ccc", marginTop: 10 }}>
          <Animated.View
            style={{
              height: 2,
              backgroundColor: "#3498DB",
              width: progress.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
            }}
          />
        </View>

        <View>
          {statuses[currentIndex]?.videos && (
            <Video
              ref={videoRef}
              source={{ uri: statuses[currentIndex].videos }}
              style={{ width: "100%", height: 600 }}
              shouldPlay
              resizeMode={ResizeMode.CONTAIN}
              onPlaybackStatusUpdate={(status) => {
                if (status.didJustFinish) handleNext();
              }}
            />
          )}

          {statuses[currentIndex]?.images && (
            <Image
              source={{ uri: statuses[currentIndex].images }}
              style={{ width: "100%", height: 700 }}
            />
          )}
        </View>

        <View
          className={`flex-1 ${
            !statuses[currentIndex]?.videos && !statuses[currentIndex]?.images
              ? "justify-center items-center"
              : ""
          }`}
        >
          {statuses[currentIndex]?.input && (
            <Text className="text-lg dark:text-white m-4 text-center">
              {statuses[currentIndex]?.input}
            </Text>
          )}
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
