import { View, Text, Pressable, ActivityIndicator } from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/firebase";
import { useUser } from "@clerk/clerk-expo";
import Posts from "@/components/County/Posts";

const MediaSize = () => {
  const { id } = useLocalSearchParams();
  const { user } = useUser();

  const [post, setPost] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true); // One loading state for both user and post

  // Fetch user data
  const fetchUserData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const q = query(collection(db, "userPosts"), where("uid", "==", user.id));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setUserData(querySnapshot.docs[0].data());
      }
    } catch (error) {
      console.error("❌ Error fetching user data:", error);
    }
  }, [user]);

  // Fetch post data once userData is available
  const fetchPostData = useCallback(async () => {
    if (!id || !userData?.county) return;

    try {
      const docRef = doc(db, "county", userData.county, "posts", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setPost(docSnap.data());
      } else {
        console.warn("⚠️ No post found with this ID:", id);
      }
    } catch (error) {
      console.error("❌ Error fetching post:", error);
    } finally {
      setLoading(false);
    }
  }, [id, userData]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    if (userData) {
      fetchPostData();
    }
  }, [userData, fetchPostData]);

  return (
    <SafeAreaView className="dark:bg-gray-800 flex-1">
      <StatusBar style="auto" />
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="blue" />
          <Text>Loading...</Text>
        </View>
      ) : (
        <Posts id={id} post={post} />
      )}
    </SafeAreaView>
  );
};

export default MediaSize;
