import { View, Text, Image, Pressable, FlatList } from "react-native";
import React, { useEffect, useState } from "react";
import { useUserInfo } from "@/providers/UserContext";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/firebase";
import {
  EvilIcons,
  MaterialIcons,
  FontAwesome,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { router } from "expo-router";

const Profile = () => {
  const { userData, formatNumber } = useUserInfo();
  const [followingCount, setFollowingCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  // Fetch followers & following in one useEffect
  useEffect(() => {
    if (!userData?.id) return;

    const followingQuery = query(
      collection(db, "following"),
      where("followerId", "==", userData.id)
    );
    const followerQuery = query(
      collection(db, "following"),
      where("followingId", "==", userData.id)
    );

    const unsubscribeFollowing = onSnapshot(followingQuery, (snapshot) => {
      setFollowingCount(snapshot.size);
      setFollowing(snapshot.docs.map((doc) => doc.data()));
    });

    const unsubscribeFollowers = onSnapshot(followerQuery, (snapshot) => {
      setFollowerCount(snapshot.size);
      setFollowers(snapshot.docs.map((doc) => doc.data()));
    });

    return () => {
      unsubscribeFollowing();
      unsubscribeFollowers();
    };
  }, [userData?.id]);

  // Render each member in the list
  const renderMember = ({ item }) => (
    <View className="flex-row items-center justify-between m-2 gap-2">
      <View className="flex-row items-center gap-3">
        <Image
          source={{ uri: item.userImg || "https://via.placeholder.com/150" }} // Fallback image
          className="h-14 w-14 rounded-full border border-red-500 p-[1.5px]"
        />
        <Text>
          <Text className="font-bold">{item.name}</Text>
          <Text className="font-bold"> {item.lastname}</Text>
          <Text className="text-gray-500"> @{item.nickname}</Text>
        </Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 relative bg-white">
      {/* Background Image */}
      <Image
        source={require("@/assets/images/broad.jpg")}
        className="h-1/3 w-full"
        resizeMode="cover"
      />

      {/* Edit Profile Icon */}
      <View className="absolute top-5 right-2 p-2 rounded-full h-12 w-12 items-center justify-center">
        <Pressable>
          <EvilIcons name="pencil" size={28} color="white" />
        </Pressable>
      </View>

      {/* Profile Image */}
      <View className="-mt-20 justify-center items-center">
        <View className="h-32 w-32 border-white border-2 rounded-full">
          <Image
            source={{
              uri: userData?.userImg || "https://via.placeholder.com/150",
            }} // Fallback image
            className="h-full w-full rounded-full"
          />
        </View>
      </View>

      {/* Profile Info */}
      <View className="m-4 gap-2">
        <View className="flex-row justify-between items-center">
          <View className="bg-gray-700 w-20 p-2 items-center rounded-md">
            <Text className="font-bold text-white">Light</Text>
          </View>
          <View className="bg-blue-700 w-32 p-2 items-center rounded-md mt-2">
            <Text className="font-bold text-white">Verify Account</Text>
          </View>
        </View>

        <View className="mt-4 flex-row justify-between items-center">
          <Text className="font-bold text-slate-900">{userData?.name}</Text>
          <Pressable className="border p-2 rounded-md">
            <Text>Edit profile</Text>
          </Pressable>
          <Pressable className="border p-2 rounded-md">
            <Text>View Catalogue</Text>
          </Pressable>
        </View>

        {/* Followers & Following */}
        <View className="flex-row justify-between gap-3 items-center p-4">
          <Text>7 Posts</Text>
          <Pressable onPress={() => router.push("/(follow)/follow")}>
            <Text>{formatNumber(followerCount)} followers</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/(follow)/follow")}>
            <Text>{formatNumber(followingCount)} following</Text>
          </Pressable>
        </View>

        {/* Profile Menu */}
        <View className="border-t border-gray-200 flex-row justify-between items-center">
          <Pressable className="p-4 flex-row gap-2 items-center">
            <MaterialIcons name="photo-library" size={24} color="gray" />
            <Text>Posts</Text>
          </Pressable>
          <Pressable className="p-4 flex-row gap-2 items-center">
            <MaterialCommunityIcons
              name="message-badge"
              size={24}
              color="gray"
            />
            <Text>Replies</Text>
          </Pressable>
          <Pressable className="p-4 flex-row gap-2 items-center">
            <FontAwesome name="bookmark" size={24} color="gray" />
            <Text>Bookmark</Text>
          </Pressable>
        </View>
      </View>      
    </View>
  );
};

export default Profile;
