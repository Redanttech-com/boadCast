import {
  View,
  Text,
  Image,
  Pressable,
  FlatList,
  Dimensions,
  ScrollView,
} from "react-native";
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
  MaterialIcons,
  FontAwesome,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Avatar } from "react-native-elements";
import { useUser } from "@clerk/clerk-expo";
import { StatusBar } from "expo-status-bar";
import { Video } from "expo-av";
import { useColorScheme } from "@/hooks/useColorScheme.web";

// Constants for grid
const SCREEN_WIDTH = Dimensions.get("window").width;
const NUM_COLUMNS = 3;
const ITEM_MARGIN = 2;
const ITEM_SIZE =
  (SCREEN_WIDTH - ITEM_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

const Profile = () => {
  const { formatNumber } = useUserInfo();
  const [followingCount, setFollowingCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const { user } = useUser();
  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [replies, setReplies] = useState([]);
  const [active, setActive] = useState("posts");
  const [userBookMark, setUserBookMark] = useState([]);
  const { uid } = useLocalSearchParams();
  const colorScheme = useColorScheme();

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

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      const q = query(collection(db, "userPosts"), where("uid", "==", uid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setUserData(querySnapshot.docs[0].data());
      }
    };
    fetchUserData();
  }, [user]);

  useEffect(() => {
    if (!userData?.uid) return;
    const fetchPosts = async () => {
      const q = query(collection(db, "national"), where("uid", "==", uid));
      const q2 = query(
        collection(db, "county", userData?.county, "posts"),
        where("uid", "==", uid)
      );
      const q3 = query(
        collection(db, "constituency", userData?.constituency, "posts"),
        where("uid", "==", uid)
      );
      const q4 = query(
        collection(db, "ward", userData?.ward, "posts"),
        where("uid", "==", uid)
      );
      const [s1, s2, s3, s4] = await Promise.all([
        getDocs(q),
        getDocs(q2),
        getDocs(q3),
        getDocs(q4),
      ]);
      const allDocs = [...s1.docs, ...s2.docs, ...s3.docs, ...s4.docs];
      const postList = allDocs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(postList.filter((post) => post.images || post.videos));
    };
    fetchPosts();
  }, [userData?.uid]);

  useEffect(() => {
    if (!userData?.uid) return;
    const followingQuery = query(
      collection(db, "following"),
      where("followerId", "==", userData.uid)
    );
    const followerQuery = query(
      collection(db, "following"),
      where("followingId", "==", userData.uid)
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
  }, [userData?.uid]);

  const renderPostItem = ({ item, index }) => {
    const isFirstColumn = index % NUM_COLUMNS === 0;
    return (
      <View
        style={{
          width: ITEM_SIZE,
          height: ITEM_SIZE,
          marginBottom: ITEM_MARGIN,
          marginRight: ITEM_MARGIN,
          marginLeft: isFirstColumn ? ITEM_MARGIN : 0,
          backgroundColor: "#ddd",
        }}
      >
        {item.images ? (
          <Image
            source={{ uri: item.images }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <Video
            source={{ uri: item.videos }}
            style={{ width: "100%", height: "100%" }}
            shouldPlay
            isMuted
            resizeMode="cover"
          />
        )}
      </View>
    );
  };

  const renderBookMark = ({ item }) => (
    <View className="flex-row items-center justify-between m-2 gap-2">
      <View className="flex-row items-center gap-3">
        <Image
          source={{ uri: item.images }}
          className="h-14 w-14 rounded-full border border-red-500 p-[1.5px]"
        />
        <Text className="dark:text-white">{item?.text}</Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 pt-20 dark:bg-gray-800">
      <StatusBar style="auto" />

      <Pressable
        onPress={() => router.back()}
        className="p-3 rounded-full"
      >
        <Ionicons
          name="arrow-back"
          size={24}
          color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
        />
      </Pressable>
      {/* Static Header */}
      <View>
        {/* Avatar, Stats, Tabs, etc. */}
        <View className="mt-2 justify-center items-center">
          <Avatar
            size={100}
            source={userData?.userImg && { uri: userData?.userImg }}
            title={userData?.name && userData?.name[0].toUpperCase()}
            containerStyle={{
              backgroundColor: getColorFromName(userData?.name),
              borderRadius: 50,
            }}
            avatarStyle={{ borderRadius: 50 }}
          />
        </View>

        {/* Stats */}
        <View className="m-4 gap-2">
          <View className="mt-4 flex-row gap-2 items-center">
            <Text className="font-bold text-slate-900 dark:text-white">
              {userData?.name}
            </Text>
            <Text className="font-bold text-slate-900 dark:text-white">
              {userData?.lastname}
            </Text>
            <Text className=" text-slate-900 dark:text-white">
              @{userData?.nickname}
            </Text>
          </View>

          <View className="flex-row justify-evenly mt-2">
            <View className="items-center flex-row gap-2">
              <Text className="font-extrabold text-lg dark:text-white">
                {posts.length}
              </Text>
              <Text className="dark:text-white">Posts</Text>
            </View>
            <Pressable className="items-center flex-row gap-2">
              <Text className="font-extrabold text-lg dark:text-white">
                {formatNumber(followerCount)}
              </Text>
              <Text className="dark:text-white">Followers</Text>
            </Pressable>
            <Pressable className="items-center flex-row gap-2">
              <Text className="font-extrabold text-lg dark:text-white">
                {formatNumber(followingCount)}
              </Text>
              <Text className="dark:text-white">Following</Text>
            </Pressable>
          </View>

          {/* Tabs */}
          <View className="border-t border-gray-200 dark:border-gray-600 flex-row justify-around mt-2">
            <Pressable onPress={() => setActive("posts")} className="p-3">
              <MaterialIcons
                name="grid-on"
                size={24}
                color={active === "posts" ? "#3182CE" : "#718096"}
              />
            </Pressable>
            <Pressable onPress={() => setActive("replies")} className="p-3">
              <MaterialCommunityIcons
                name="message-reply-text"
                size={24}
                color={active === "replies" ? "#3182CE" : "#718096"}
              />
            </Pressable>
            <Pressable onPress={() => setActive("bookmark")} className="p-3">
              <FontAwesome
                name="bookmark"
                size={24}
                color={active === "bookmark" ? "#3182CE" : "#718096"}
              />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Scrollable Content Section Only */}
      {active === "bookmark" ? (
        <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
          {userBookMark.map((item) => (
            <View key={item.id} className="flex-row items-center m-2 gap-2">
              <Image
                source={{ uri: item.images }}
                className="h-14 w-14 rounded-full border border-red-500 p-[1.5px]"
              />
              <Text className="dark:text-white">{item?.text}</Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <FlatList
          key={active} // Important for dynamic column switch
          data={active === "posts" ? posts : replies}
          keyExtractor={(item) => item.id}
          renderItem={renderPostItem}
          numColumns={NUM_COLUMNS}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 80,
            alignItems: "center",
          }}
          ListEmptyComponent={
            <View className="items-center mt-10">
              <Text className="dark:text-white">No content available</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default Profile;
