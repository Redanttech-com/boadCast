import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Image, FlatList } from "react-native";
import { useUserInfo } from "@/components/UserContext";
import { db } from "@/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { SafeAreaView } from "react-native-safe-area-context";
import { Video } from "expo-av";

const Media = () => {
  const [activeTab, setActiveTab] = useState("national");
  const [countyPosts, setCountyPosts] = useState([]);
  const [constituencyPosts, setConstituencyPosts] = useState([]);
  const [wardPosts, setWardPosts] = useState([]);
  const [nationalPosts, setNationalPosts] = useState([]);

  const { userDetails } = useUserInfo();

  // Fetch posts when userDetails change

  useEffect(() => {
    if (!userDetails) return;

    let unsubNational, unsubCounty, unsubConstituency, unsubWard;

    if (userDetails?.county) {
      const countyQuery = query(
        collection(db, "national"),
        orderBy("timestamp", "desc")
      );
      unsubCounty = onSnapshot(countyQuery, (snapshot) => {
        setNationalPosts(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      });
    }

    // 🔥 Fetch County Posts
    if (userDetails?.county) {
      const countyQuery = query(
        collection(db, "county", userDetails?.county, "posts"),
        orderBy("timestamp", "desc")
      );
      unsubCounty = onSnapshot(countyQuery, (snapshot) => {
        setCountyPosts(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      });
    }

    // 🔥 Fetch Constituency Posts
    if (userDetails?.constituency) {
      const constituencyQuery = query(
        collection(db, "constituency", userDetails?.constituency, "posts"),
        orderBy("timestamp", "desc")
      );
      unsubConstituency = onSnapshot(constituencyQuery, (snapshot) => {
        setConstituencyPosts(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      });
    }

    // 🔥 Fetch Ward Posts
    if (userDetails?.ward) {
      const wardQuery = query(
        collection(db, "ward", userDetails?.ward, "posts"),
        orderBy("timestamp", "desc")
      );
      unsubWard = onSnapshot(wardQuery, (snapshot) => {
        setWardPosts(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      });
    }

    return () => {
      unsubNational?. ();
      unsubCounty?.();
      unsubConstituency?.();
      unsubWard?.();
    };
  }, [userDetails]);

  // ✅ Render each post
  const renderPost = ({ item }) => {
    // Only render items that contain images or videos
    if (!item.images && !item.videos) return null;

    return (
      <View className="flex-row items-center justify-between m-2 gap-2 dark:bg-gray-600">
        <View className="flex-row gap-3">
          {item.images && (
            <Image
              source={{ uri: item.images }}
              className="h-32 w-48 rounded-md border border-gray-500"
            />
          )}
          {item.videos && (
            <Video
              source={{ uri: item.videos }}
              className="h-32 w-48 rounded-md border border-gray-500"
            />
          )}
          <Text className="absolute bottom-1 ml-2 text-white font-bold">
            {item.name} {item.lastname} @{item.nickname}
          </Text>
        </View>
      </View>
    );
  };


  // ✅ Render the active tab's content
  const renderTabContent = (data) => (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={renderPost}
      numColumns={2}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View className="flex-1 items-center justify-center">
          <Text className="dark:text-white">No Posts</Text>
        </View>
      }
    />
  );

  return (
    <SafeAreaView className="flex-1 gap-5 dark:bg-gray-800">
      {/* 🔥 Tab Selector */}
      <View className="flex-row justify-between p-3 px-5 bg-gray-200 dark:bg-gray-700  items-center">
        {["national", "county", "constituency", "ward"].map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}>
            <Text
              className={`text-xl dark:text-white ${
                activeTab === tab ? "underline font-bold text-blue-950" : ""
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 🔥 Post List */}
      <View>
        {activeTab === "national" && renderTabContent(nationalPosts)}
        {activeTab === "county" && renderTabContent(countyPosts)}
        {activeTab === "constituency" && renderTabContent(constituencyPosts)}
        {activeTab === "ward" && renderTabContent(wardPosts)}
      </View>
    </SafeAreaView>
  );
};

export default Media;
