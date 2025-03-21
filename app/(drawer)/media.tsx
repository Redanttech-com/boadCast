import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
} from "react-native";
import { useUserInfo } from "@/components/UserContext";
import { db } from "@/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { SafeAreaView } from "react-native-safe-area-context";
import { ResizeMode, Video } from "expo-av";
import { StatusBar } from "expo-status-bar";

// Screen width for dynamic item sizing
const screenWidth = Dimensions.get("window").width;
const itemSpacing = 6;
const numColumns = 3;
const itemWidth = (screenWidth - itemSpacing * (numColumns + 1)) / numColumns;

const Media = () => {
  const [activeTab, setActiveTab] = useState("national");
  const [countyPosts, setCountyPosts] = useState([]);
  const [constituencyPosts, setConstituencyPosts] = useState([]);
  const [wardPosts, setWardPosts] = useState([]);
  const [nationalPosts, setNationalPosts] = useState([]);

  const { userDetails } = useUserInfo();

  useEffect(() => {
    if (!userDetails) return;

    let unsubNational, unsubCounty, unsubConstituency, unsubWard;

    // 🔥 National
    const nationalQuery = query(
      collection(db, "national"),
      orderBy("timestamp", "desc")
    );
    unsubNational = onSnapshot(nationalQuery, (snapshot) => {
      setNationalPosts(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    });

    // 🔥 County
    if (userDetails?.county) {
      const countyQuery = query(
        collection(db, "county", userDetails.county, "posts"),
        orderBy("timestamp", "desc")
      );
      unsubCounty = onSnapshot(countyQuery, (snapshot) => {
        setCountyPosts(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      });
    }

    // 🔥 Constituency
    if (userDetails?.constituency) {
      const constituencyQuery = query(
        collection(db, "constituency", userDetails.constituency, "posts"),
        orderBy("timestamp", "desc")
      );
      unsubConstituency = onSnapshot(constituencyQuery, (snapshot) => {
        setConstituencyPosts(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      });
    }

    // 🔥 Ward
    if (userDetails?.ward) {
      const wardQuery = query(
        collection(db, "ward", userDetails.ward, "posts"),
        orderBy("timestamp", "desc")
      );
      unsubWard = onSnapshot(wardQuery, (snapshot) => {
        setWardPosts(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      });
    }

    return () => {
      unsubNational?.();
      unsubCounty?.();
      unsubConstituency?.();
      unsubWard?.();
    };
  }, [userDetails]);

  // ✅ Render each post
  const renderPost = ({ item }) => {
    if (!item.images && !item.videos) return null;

    return (
      <View
        style={{
          width: itemWidth,
          margin: itemSpacing / 2,
          backgroundColor: "#4B5563",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        {item.images ? (
          <Image
            source={{ uri: item.images }}
            style={{ height: 150, width: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <Video
            source={{ uri: item.videos }}
            style={{ height: 150, width: "100%" }}
            shouldPlay
            isMuted
            resizeMode={ResizeMode.COVER}
          />
        )}
        <Text
          style={{
            position: "absolute",
            bottom: 5,
            left: 5,
            color: "#fff",
            backgroundColor: "rgba(0,0,0,0.4)",
            paddingHorizontal: 6,
            borderRadius: 4,
            fontWeight: "bold",
            fontSize: 12,
          }}
        >
          {item.name}
        </Text>
      </View>
    );
  };

  // ✅ Render content by active tab
  const getActivePosts = () => {
    switch (activeTab) {
      case "national":
        return nationalPosts;
      case "county":
        return countyPosts;
      case "constituency":
        return constituencyPosts;
      case "ward":
        return wardPosts;
      default:
        return [];
    }
  };

  return (
    <SafeAreaView className="flex-1 dark:bg-gray-800" edges={["bottom"]}>
      <StatusBar style="auto" />

      {/* 🔥 Tab Selector */}
      <View className="flex-row justify-between px-5 py-3 bg-gray-200 dark:bg-gray-700">
        {["national", "county", "constituency", "ward"].map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}>
            <Text
              className={`text-base dark:text-white ${
                activeTab === tab ? "underline font-bold text-blue-950" : ""
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 🔥 Posts */}
      <FlatList
        data={getActivePosts()}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        numColumns={numColumns}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: itemSpacing,
        }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center mt-10">
            <Text className="dark:text-white">No Posts</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default Media;
