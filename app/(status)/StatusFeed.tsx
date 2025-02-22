import { View, Text, FlatList, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { useUser } from "@clerk/clerk-expo";
import { db } from "@/firebase";
import StatusPost from "./StatusPost";
import dayjs from "dayjs";
import { useColorScheme } from "@/hooks/useColorScheme.web";

const StatusFeed = () => {
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [posts, setPosts] = useState([]);
  const { user } = useUser();
  const colorScheme = useColorScheme();

  const deletePostAfter24Hours = async (id, timestamp) => {
    if (!timestamp) return;
    const postTime = dayjs(timestamp.toDate());
    const now = dayjs();

    if (now.diff(postTime, "hour") >= 24) {
      try {
        await deleteDoc(doc(db, "status", id));
        console.log(`Deleted status with ID: ${id}`);
      } catch (error) {
        console.error("Error deleting status:", error);
      }
    }
  };

  useEffect(() => {
    const q = query(collection(db, "status"), orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const latestStatuses = new Map();

      snapshot.docs.forEach((doc) => {
        const post = { id: doc.id, ...doc.data() };

        if (post.timestamp) {
          const postTime = dayjs(post.timestamp.toDate());
          const now = dayjs();

          // Delete posts older than 24 hours
          if (now.diff(postTime, "hour") >= 24) {
            deletePostAfter24Hours(post.id, post.timestamp);
            return; // Skip adding to the list
          }
        }

        // Store only the latest status per user
        if (!latestStatuses.has(post.uid)) {
          latestStatuses.set(post.uid, post);
        }
      });

      setPosts(Array.from(latestStatuses.values()));
      setLoadingStatus(false);
    });

    return () => unsubscribe();
  }, []);

  if (loadingStatus) {
    return (
      <View className="justify-center items-center dark:bg-gray-800 h-15 w-full mt-3">
        <ActivityIndicator
          size="large"
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
      horizontal={true}
      renderItem={({ item }) => <StatusPost post={item} id={item.id} />}
      ListEmptyComponent={
        <View className="flex-1 justify-center items-center">
          <Text className="dark:text-white">No Status</Text>
        </View>
      }
      initialNumToRender={10}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 10 }}
    />
  );
};

export default StatusFeed;
