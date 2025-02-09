import React, { useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
} from "react-native";
import { db } from "@/firebase";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import useFollowData from "./useFollowData";

const FollowersScreen = () => {
  const { followers, following, loading, currentUserId } = useFollowData();
  const [activeTab, setActiveTab] = useState("followers");


  // Prevent operations if currentUserId is missing
  if (!currentUserId) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-lg font-bold text-red-500">
          Error: User not logged in
        </Text>
      </View>
    );
  }

  // Convert following list to a Set for quick lookup
  const followingSet = new Set(following.map((user) => user.id));

  // Handle Follow
  const handleFollow = async (userId) => {
    if (!currentUserId || !userId) return; // Prevent errors
    try {
      const docRef = doc(db, "following", `${currentUserId}_${userId}`);
      await setDoc(docRef, {
        followerId: currentUserId,
        followingId: userId,
      });
      console.log("Followed user:", userId);
    } catch (error) {
      console.error("Error following user:", error);
    }
  };

  // Handle Unfollow
  const handleUnfollow = async (userId) => {
    if (!currentUserId || !userId) return; // Prevent errors
    try {
      const docRef = doc(db, "following", `${currentUserId}_${userId}`);
      await deleteDoc(docRef);
     
    } catch (error) {
      console.error("Error unfollowing user:", error);
    }
  };

  // Render List Item
  const renderItem = ({ item }) => {
    const isFollowing = followingSet.has(item.uid); // Check if already following

    return (
      <View className="flex-row items-center gap-3 p-3">
        <Image
          source={{ uri: item.userImg || "https://via.placeholder.com/150" }} // Fallback image
          className="w-10 h-10 rounded-full"
        />
        <View className="flex-1">
          <Text className="font-bold">
            {item.name} @{item.nickname}
          </Text>
        </View>
        <Pressable
          onPress={() =>
            isFollowing ? handleUnfollow(item.uid) : handleFollow(item.uid)
          }
          className={`px-4 py-2 rounded-md ${
            isFollowing ? "bg-red-500" : "bg-blue-500"
          }`}
        >
          <Text className="text-white font-bold">
            {isFollowing ? "Unfollow" : "Follow"}
          </Text>
        </Pressable>
      </View>
    );
  };

  // Render Tab Content for Followers/Following
  const renderTabContent = (data) => (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View className="flex-1 items-center justify-center h-screen">
          <Text>empty</Text>
        </View>
      }
    />
  );

  return (
    <>
      <View className="flex-1 p-4">
        {/* Toggle Buttons */}
        <View className="flex-row justify-between w-4/4 mb-4">
          <Pressable
            onPress={() => setActiveTab("followers")}
            className={`p-2 px-4 rounded-md w-2/4 ${
              activeTab === "followers"
                ? "border-b border-blue-600 w-full items-center"
                : "w-full items-center opacity-20"
            }`}
          >
            <Text className="font-bold">Followers</Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("following")}
            className={`p-2 px-4 rounded-md w-2/4 ${
              activeTab === "following"
                ? "border-b border-blue-600 w-full items-center"
                : "w-full items-center opacity-20"
            }`}
          >
            <Text className="font-bold ">Following</Text>
          </Pressable>
        </View>

        {/* Render selected tab */}
        {loading ? (
          <ActivityIndicator />
        ) : activeTab === "followers" ? (
          renderTabContent(followers)
        ) : (
          renderTabContent(following)
        )}
      </View>
    </>
  );
};

export default FollowersScreen;
