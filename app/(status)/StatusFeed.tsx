import { View, Text, Image, FlatList, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { useUser } from "@clerk/clerk-expo";
import { db } from "@/firebase";
import StatusPost from "./StatusPost";
import dayjs from "dayjs"; // Install dayjs for time comparison
import { useColorScheme } from "@/hooks/useColorScheme.web";

const StatusFeed = () => {
  const [loadingStatus, setLoadingStatus] = useState(true); // Set to true initially
  const [posts, setPosts] = useState([]);
  const { user } = useUser();
  const colorScheme = useColorScheme();

  // Delete post if older than 24 hours
  const deletePostAfter24Hours = async (id, timestamp) => {
    const postTime = dayjs(timestamp); // Get post creation time
    const now = dayjs();
    if (now.diff(postTime, "hour") >= 24) {
      try {
        await deleteDoc(doc(db, "status", id)); // Delete post from Firebase
      } catch (error) {
        console.error("Error deleting post:", error);
      }
    }
  };

  // Fetch and filter posts
  useEffect(() => {
    let unsubscribe; // Declare unsubscribe outside

    const fetchStatus = async () => {
      try {
        const q = query(collection(db, "status"), orderBy("timestamp", "asc"));

        unsubscribe = onSnapshot(q, (snapshot) => {
          const newPosts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // Check and delete posts older than 24 hours
          newPosts.forEach((post) => {
            deletePostAfter24Hours(post.id, post.timestamp); // Call delete if 24 hours passed
          });

          // Ensure only unique posts are added
          const uniquePosts = Array.from(
            new Map(newPosts.map((post) => [post.uid, post])).values()
          );

          setPosts(uniquePosts); // Use uniquePosts instead of raw snapshot data
          setLoadingStatus(false);
        });
      } catch (error) {
        console.error("Error fetching Status:", error);
        setLoadingStatus(false);
      }
    };

    fetchStatus();

    return () => {
      if (unsubscribe) {
        unsubscribe(); // Unsubscribe on unmount
      }
    };
  }, []); // Run only once

  if (loadingStatus) {
    return (
      <View className="justify-center items-center dark:bg-gray-800 h-15 w-full mt-3">
        <ActivityIndicator
          color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
        />
        <Text className="dark:text-white">Loading status...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      horizontal={true} // ✅ Enables horizontal scrolling
      renderItem={({ item }) => <StatusPost post={item} id={item.id} />}
      initialNumToRender={10}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 10 }} // ✅ Optional: Adds spacing
    />
  );
};

export default StatusFeed;
