import { View, Text, Image, FlatList, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import { collection, getDocs, onSnapshot, orderBy, query } from "firebase/firestore";
import { useUser } from "@clerk/clerk-expo";
import { db } from "@/firebase";
import Status from "./StatusForm";
import StatusPost from "./StatusPost";

const StatusFeed = () => {
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [posts, setPosts] = useState([]);
  const { user } = useUser();

  //status
  useEffect(() => {
    let unsubscribe; // Declare unsubscribe outside

    const fetchStatus = async () => {
      try {
        const q = query(collection(db, "status"), orderBy("timestamp", "desc"));

        unsubscribe = onSnapshot(q, (snapshot) => {
          const newPosts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

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

  // if (loadingStatus) {
  //   <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
  //     <ActivityIndicator size="large" color="black" />
  //   </View>;
  // }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      horizontal={true} // ✅ Enables horizontal scrolling
      renderItem={({ item }) => <StatusPost post={item} id={item.uid} />}
      initialNumToRender={10}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 10 }} // ✅ Optional: Adds spacing
    />
  );
};

export default StatusFeed;
