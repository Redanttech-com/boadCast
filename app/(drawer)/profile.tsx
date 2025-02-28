import {
  View,
  Text,
  Image,
  Pressable,
  FlatList,
  Dimensions,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { useUserInfo } from "@/components/UserContext";
import {
  collection,
  doc,
  getDoc,
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
import * as ImagePicker from "expo-image-picker";
import { Video } from "expo-av";

const Profile = ({ bookmarks }) => {
  const { formatNumber } = useUserInfo();
  const [followingCount, setFollowingCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const { user } = useUser();
  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [replies, setReplies] = useState([]);
  const [active, setActive] = useState("posts");
  const [userBookMark, setUserBookMark] = useState([]);
  const [loading, setLoading] = useState(false);
  const [post, setPost] = useState([]);
  const numColumns = 3; // Change to 2 or 3 as needed
  const screenWidth = Dimensions.get("window").width;
  const imageSize = (screenWidth - 40) / numColumns; // Adjust width dynamically
  const [backImg, setBackImg] = useState(null);
  const [userImg, setUserImg] = useState(null);

  const pickMedia = useCallback(async (type) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        type === "Images"
          ? ImagePicker.MediaTypeOptions.Images
          : ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setUserImg({ uri: result.assets[0].uri, type });
    }
  }, []);

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
    const fetchPost = async () => {
      if (userData?.uid) {
        const q = query(collection(db, userData?.uid, "bookmarks"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const posts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setPost(posts);
          setLoading(false);
        });
        return () => unsubscribe();
      }
    };

    fetchPost();
  }, [userData?.uid]);

  useEffect(() => {
    const fetchPost = async () => {
      if (!post) return;
      post.map((pst) => {
        if (pst?.uid) {
          const q = query(
            collection(db, "national"),
            where("id", "==", pst?.id)
          );
          const unsubscribe = onSnapshot(q, (snapshot) => {
            const posts = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setUserBookMark(posts);
            setLoading(false);
          });
          return () => unsubscribe();
        }
      });
    };
    fetchPost();
  }, [post]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id && !userData) return;
      const q = query(collection(db, "national"), where("uid", "==", user?.id));
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

  // user image and back image
  useEffect(() => {
    const fetchUserData = async () => {
      if (userData) {
        const q = query(
          collection(db, "userPosts"),
          where("uid", "==", userData?.uid)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data(); // Store the document data
          setPost(userData); // Set the post data to state
          // setBackImg(userData.backImg || null);
          setUserImg(userData.userImg || null);
        }
      }
    };

    fetchUserData();
  }, [userData]);

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

  const renderPostItem = ({ item }) => (
    <View style={{ margin: 2 }}>
      {item.images ? (
        <Image
          source={{ uri: item.images }}
          style={{ height: 120, width: 120 }}
        />
      ) : (
        <Video
          source={{ uri: item.videos }}
          style={{ height: 120, width: 120 }}
          shouldPlay
          isMuted
        />
      )}
    </View>
  );

  const renderList = (data, renderItem) => (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      renderItem={renderItem}
      contentContainerStyle={{ paddingBottom: 20, alignSelf: "center" }}
      numColumns={3}
      ListEmptyComponent={
        <View className="flex-1 items-center justify-center">
          <Text className="dark:text-white">No Posts Found</Text>
        </View>
      }
    />
  );

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
      {/* <View className="justify-center items-center w-full">
        <Avatar
          size={200}
          source={userData?.userImg && { uri: userData?.userImg }}
          title={userData?.name && userData?.name[0].toUpperCase()}
          containerStyle={{
            backgroundColor: getColorFromName(userData?.name),
            borderRadius: 5,
          }} // Consistent color per user
          avatarStyle={{
            borderRadius: 5, // This affects the actual image
          }}
        />
      </View> */}
      <View className="mt-20 justify-center items-center">
        <Avatar
          size={100}
          source={userData?.userImg && { uri: userData?.userImg }}
          title={userData?.name && userData?.name[0].toUpperCase()}
          containerStyle={{
            backgroundColor: getColorFromName(userData?.name),
            borderRadius: 5,
          }} // Consistent color per user
          avatarStyle={{
            borderRadius: 5, // This affects the actual image
          }}
        />
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
            {userData?.name}
          </Text>
          <Pressable
            onPress={() => pickMedia("Images")}
            className="border p-2 rounded-md dark:border-white"
          >
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
        <View className="border-t-hairline border-gray-200 flex-row justify-between items-center">
          <Pressable
            onPress={() => setActive("posts")}
            className="p-4 flex-row gap-2 items-center"
          >
            <MaterialIcons name="photo-library" size={24} color="gray" />
            <Text
              className={`${
                active === "posts" ? "underline font-bold" : ""
              } text-xl dark:text-white`}
            >
              Posts
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActive("replies")}
            className="p-4 flex-row gap-2 items-center"
          >
            <MaterialCommunityIcons
              name="message-badge"
              size={24}
              color="gray"
            />
            <Text
              className={`${
                active === "replies" ? "underline font-bold" : ""
              } text-xl dark:text-white`}
            >
              Replies
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActive("bookmark")}
            className="p-4 flex-row gap-2 items-center"
          >
            <FontAwesome name="bookmark" size={24} color="gray" />
            <Text
              className={`${
                active === "bookmark" ? "underline font-bold" : ""
              } text-xl dark:text-white`}
            >
              Bookmarked
            </Text>
          </Pressable>
        </View>
        {active === "posts" && renderList(posts, renderPostItem)}
        {active === "replies" && renderList(replies, renderPostItem)}
        {active === "bookmark" && renderList(userBookMark, renderBookMark)}
      </View>
    </View>
  );
};

export default Profile;
