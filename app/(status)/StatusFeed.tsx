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
     const fetchStatus = async () => {
       try {
         const q = query(
           collection(db, "status"),
           orderBy("timestamp", "desc")
         );
         const unsubscribe = onSnapshot(q, (snapshot) => {
           const postsData = snapshot.docs;
           setPosts(postsData);
           setLoadingStatus(false);
         });
         return () => unsubscribe(); // Unsubscribe on unmount
       } catch (error) {
         console.error("Error fetching Status:", error);
         setLoadingStatus(false);
       }
     };
 
     fetchStatus();
   }, []);

   if(loadingStatus) {
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="black" />
    </View>;
   }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      horizontal={true} // ✅ Enables horizontal scrolling
      renderItem={({ item }) => <StatusPost post={item} id={item.id} />}
      estimatedItemSize={10}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 10 }} // ✅ Optional: Adds spacing
      
    />
  );
};

export default StatusFeed;
