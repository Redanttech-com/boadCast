import { View, Text, Image, Pressable, FlatList } from "react-native";
import React, { useEffect, useState } from "react";
import { useUserInfo } from "@/components/UserContext";
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/firebase";
import {
  EvilIcons,
  MaterialIcons,
  FontAwesome,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { router } from "expo-router";
import { Avatar } from "react-native-elements";
import { useUser } from "@clerk/clerk-expo";
import { StatusBar } from "expo-status-bar";

const Profile = () => {
  const { userDetails, formatNumber } = useUserInfo();
  const [followingCount, setFollowingCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const { user } = useUser();
  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [active, setActive] = useState("posts");

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      const q = query(collection(db, "userPosts"), where("uid", "==", user.id));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setUserData(querySnapshot.docs[0].data());
      }
    };
    fetchUserData();
  }, [user]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id && !userData) return;
      const q = query(collection(db, "national"), where("uid", "==", user.id));
      const q2 = query(
        collection(db, "county", userData?.county, "posts"),
        where("uid", "==", user.id)
      );
      const q3 = query(
        collection(db, "constituency", userData?.constituency, "posts"),
        where("uid", "==", user.id)
      );
      const q4 = query(
        collection(db, "ward", userData?.ward, "posts"),
        where("uid", "==", user.id)
      );

      const [snapshot1, snapshot2, snapshot3, snapshot4] = await Promise.all([
        getDocs(q),
        getDocs(q2),
        getDocs(q3),
        getDocs(q4),
      ]);
      const docsMap = new Map();

      // Process first query results
      snapshot1.forEach((doc) => {
        docsMap.set(doc.id, { id: doc.id, ...doc.data() }); // Prefix id to ensure unique key
      });

      // Process second query results (categories)
      snapshot2.forEach((doc) => {
        docsMap.set(doc.id, { id: doc.id, ...doc.data() }); // Prefix id to ensure unique key
      });

      snapshot3.forEach((doc) => {
        docsMap.set(doc.id, { id: doc.id, ...doc.data() }); // Prefix id to ensure unique key
      });

      snapshot4.forEach((doc) => {
        docsMap.set(doc.id, { id: doc.id, ...doc.data() }); // Prefix id to ensure unique key
      });

      setPosts(Array.from(docsMap.values())); // Convert map to array for state
    };
    fetchUserData();
  }, [user?.id, userData]);

  // Fetch followers & following in one useEffect
  useEffect(() => {
    if (!userDetails?.uid) return;

    const followingQuery = query(
      collection(db, "following"),
      where("followerId", "==", userDetails.uid)
    );
    const followerQuery = query(
      collection(db, "following"),
      where("followingId", "==", userDetails.uid)
    );

    const unsubscribeFollowing = onSnapshot(followingQuery, (snapshot) => {
      setFollowingCount(snapshot.size);
    });

    const unsubscribeFollowers = onSnapshot(followerQuery, (snapshot) => {
      setFollowerCount(snapshot.size);
    });

    return () => {
      unsubscribeFollowing();
      unsubscribeFollowers();
    };
  }, [userDetails?.uid]);

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

  const renderImage = ({ item }) => (
    <View className="flex-row items-center justify-between m-2 gap-2">
      <View className="flex-row items-center gap-3 bg-red-600">
        <Image
          source={{ uri: item.images }}
          className="h-14 w-14 rounded-full border border-red-500 p-[1.5px]"
        />
        <Text>{item?.text}ijdsiojd</Text>
      </View>
    </View>
  );

  const renderPost = (posts) => {
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      initialNumToRender={10}
      showsVerticalScrollIndicator={false}
      renderItem={renderImage}
      ListEmptyComponent={
        <View className="flex-1 items-center justify-center">
          <Text>No Users</Text>
        </View>
      }
    />;
  };

  return (
    <View className="flex-1 relative  dark:bg-gray-800 ">
      <StatusBar style="auto" />
      {/* Background Image */}
      {/* Edit Profile Icon */}
      <View className="absolute top-5 right-2 p-2 rounded-full h-12 w-12 items-center justify-center">
        <Pressable>
          <EvilIcons name="pencil" size={28} color="white" />
        </Pressable>
      </View>
      {/* Profile Image */}
      <View className="mt-20 justify-center items-center">
        <View className="h-28 w-28  rounded-full overflow-hidden">
          <Avatar
            size={128} // Match parent size
            rounded
            source={userData?.userImg ? { uri: userData?.userImg } : null}
            title={userData?.name && userData?.name[0].toUpperCase()}
            containerStyle={{
              backgroundColor: getColorFromName(userData?.name),
              width: "100%",
              height: "100%",
            }}
          />
        </View>
      </View>
      {/* Profile Info */}
      <View className="m-4 gap-2">
        <View className="flex-row justify-center items-center">
          <View className="bg-blue-700 w-32 p-2 items-center rounded-md mt-2">
            <Text className="font-bold text-white">Verify Account</Text>
          </View>
        </View>

        <View className="mt-4 flex-row justify-between items-center">
          <Text className="font-bold text-slate-900 dark:text-white">
            {userDetails?.name}
          </Text>
          <Pressable className="border p-2 rounded-md dark:border-white">
            <Text className="dark:text-white">Edit profile</Text>
          </Pressable>
          <Pressable className="border p-2 rounded-md dark:border-white">
            <Text className="dark:text-white">View Catalogue</Text>
          </Pressable>
        </View>

        {/* Followers & Following */}
        <View className="flex-row justify-between gap-3 items-center p-4">
          <Pressable>
            <Text className="dark:text-white">
              {formatNumber(posts?.length)} posts
            </Text>
          </Pressable>
          <Pressable onPress={() => router.push("/(follow)/follow")}>
            <Text className="dark:text-white">
              {formatNumber(followerCount)} followers
            </Text>
          </Pressable>
          <Pressable onPress={() => router.push("/(follow)/follow")}>
            <Text className="dark:text-white">
              {formatNumber(followingCount)} following
            </Text>
          </Pressable>
        </View>

        {/* Profile Menu */}
        <View className="border-t border-gray-200 flex-row justify-between items-center">
          <Pressable
            key={"posts"}
            onPress={() => setActive(active)}
            className="p-4 flex-row gap-2 items-center"
          >
            <MaterialIcons name="photo-library" size={24} color="gray" />
            <Text
              className={`${
                active === "posts"
                  ? "underline font-bold text-xl text-blue-950 dark:text-white"
                  : "text-xl"
              }`}
            >
              Posts
            </Text>
          </Pressable>
          <Pressable className="p-4 flex-row gap-2 items-center">
            <MaterialCommunityIcons
              name="message-badge"
              size={24}
              color="gray"
            />
            <Text className="dark:text-white">Replies</Text>
          </Pressable>
          <Pressable className="p-4 flex-row gap-2 items-center">
            <FontAwesome name="bookmark" size={24} color="gray" />
            <Text className="dark:text-white">Bookmark</Text>
          </Pressable>
        </View>
      </View>
      <View>
        {active === "posts" && renderPost(posts)}
        {/* {active === "replies" && renderPost(replies)}
        {active === "bookmark" && renderPost(bookmark)} */}
      </View>
    </View>
  );
};

export default Profile;
