import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  Pressable,
  useColorScheme,
} from "react-native";
import { db } from "@/firebase";
import {
  doc,
  setDoc,
  deleteDoc,
  query,
  collection,
  getDocs,
  where,
  onSnapshot,
} from "firebase/firestore";
import useFollowData from "./useFollowData";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AntDesign } from "@expo/vector-icons";
import { Avatar } from "react-native-elements";
import { useUser } from "@clerk/clerk-expo";
import { useUserInfo } from "@/components/UserContext";
import { router } from "expo-router";

const FollowersScreen = () => {
  const { followers, following, loading, currentUserId } = useFollowData();
  const [activeTab, setActiveTab] = useState("followers");
  const colorScheme = useColorScheme();
  const { user } = useUser();
  const [usersFollowing, setUsersFollowing] = useState([]);
  const [usersFollowers, setUsersFollowers] = useState([]);
  const [usersFollowingId, setUsersFollowingId] = useState([]);

  const { userDetails, followLoading, hasFollowed, followMember } =
    useUserInfo();

  // Fetch all following/follower IDs
  useEffect(() => {
    if (!userDetails) return;

    const fetchAllUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "following"));
        const usersData = querySnapshot.docs.map((doc) => doc.data());
        setUsersFollowingId(usersData);
      } catch (error) {
        console.error("Error fetching all users:", error);
      }
    };

    fetchAllUsers();
  }, [userDetails]);

  // Fetch members when following/followers update
  useEffect(() => {
    if (!usersFollowingId.length) return;

    const fetchMembers = (values, setter) => {
      if (!values || !values.length) return;

      const q = query(collection(db, "userPosts"), where("uid", "in", values));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const membersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setter(membersData);
      });

      return unsubscribe;
    };

    const unsubFollowing = fetchMembers(
      usersFollowingId.map((u) => u.followingId),
      setUsersFollowing
    );
    const unsubFollowers = fetchMembers(
      usersFollowingId.map((u) => u.followerId),
      setUsersFollowers
    );

    return () => {
      unsubFollowing?.();
      unsubFollowers?.();
    };
  }, [usersFollowingId]);

  // Ensure currentUserId exists before proceeding
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
  const followingSet = new Set(following.map((user) => user.uid));

  // Handle Follow
  const handleFollow = async (userId) => {
    if (!currentUserId || !userId || !userDetails?.userImg) return;
    try {
      const docRef = doc(db, "following", `${currentUserId}_${userId}`);
      await setDoc(
        docRef,
        {
          followerId: currentUserId,
          followingId: userId,
        },
        { merge: true }
      );
      console.log("Followed user:", userId);
    } catch (error) {
      console.error("Error following user:", error);
    }
  };

  // Handle Unfollow
  const handleUnfollow = async (userId) => {
    if (!currentUserId || !userId) return;
    try {
      const docRef = doc(db, "following", `${currentUserId}_${userId}`);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error unfollowing user:", error);
    }
  };

  // Generate color from username
  const getColorFromName = (name) => {
    if (!name) return "#ccc";

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

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

    return colors[Math.abs(hash) % colors.length];
  };

  // Render List Item
  const renderItem = ({ item }) => {
    const isFollowing = followingSet.has(item.uid);

    return (
      <View className="flex-row items-center gap-3 p-3">
        <Avatar
          size={40}
          source={item?.userImg && { uri: item?.userImg }}
          title={item?.name && item?.name[0].toUpperCase()}
          containerStyle={{
            backgroundColor: getColorFromName(item?.name),
            borderRadius: 5,
          }}
          avatarStyle={{ borderRadius: 5 }}
        />
        <View className="flex-1">
          <Text className="font-bold dark:text-white">
            {item.name} @{item.nickname}
          </Text>
        </View>
        <Pressable
          onPress={() => followMember(item.uid)}
          disabled={followLoading[item.uid]}
          className={`p-3 rounded-lg ${
            userDetails?.uid === item.uid
              ? "bg-gray-300"
              : hasFollowed[item.uid]
              ? "bg-red-500 text-white"
              : "bg-blue-500 text-white"
          }`}
        >
          {userDetails?.uid === item.uid ? (
            <Text className="font-bold">You</Text>
          ) : followLoading[item.uid] ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text className="font-bold text-white">
              {hasFollowed[item.uid] ? "Unfollow" : "Follow"}
            </Text>
          )}
        </Pressable>
      </View>
    );
  };

  // Render Tab Content
  const renderTabContent = (data) => (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View className="flex-1 justify-center items-center">
          <Text className="dark:text-white">No users found</Text>
        </View>
      }
    />
  );

  return (
    <SafeAreaView className="flex-1 p-4 dark:bg-gray-800">
      <StatusBar style="auto" />
      <View className="flex-row justify-between mb-4">
        <AntDesign
          name="left"
          size={24}
          color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
          onPress={() => router.push("/(drawer)/profile")}
        />
        <Pressable
          onPress={() => setActiveTab("followers")}
          className={`flex-1 p-2 items-center ${
            activeTab === "followers" ? "border-b-2 border-blue-600" : ""
          }`}
        >
          <Text
            className={`font-bold ${
              activeTab === "followers" ? "text-blue-600" : "dark:text-white"
            }`}
          >
            Followers
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("following")}
          className={`flex-1 p-2 items-center ${
            activeTab === "following" ? "border-b-2 border-blue-600" : ""
          }`}
        >
          <Text
            className={`font-bold ${
              activeTab === "following" ? "text-blue-600" : "dark:text-white"
            }`}
          >
            Following
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size={"large"} color={"blue"} />
      ) : activeTab === "followers" ? (
        renderTabContent(usersFollowers)
      ) : (
        renderTabContent(usersFollowing)
      )}
    </SafeAreaView>
  );
};

export default FollowersScreen;
