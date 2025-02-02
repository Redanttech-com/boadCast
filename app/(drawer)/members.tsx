import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useUserInfo } from "@/providers/UserContext";
import { db } from "@/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { SafeAreaView } from "react-native-safe-area-context";

const Members = () => {
  const [activeTab, setActiveTab] = useState("county");
  const [countyMembers, setCountyMembers] = useState([]);
  const [constituencyMembers, setConstituencyMembers] = useState([]);
  const [wardMembers, setWardMembers] = useState([]);
  const { userData, followLoading, hasFollowed, followMember } = useUserInfo();

  // Fetch members based on user location
  useEffect(() => {
    if (!userData) return;

    const fetchMembers = (field, value, setter) => {
      if (!value) return;

      const q = query(collection(db, "userPosts"), where(field, "==", value));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const membersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setter(membersData);
      });

      return unsubscribe;
    };

    const unsubCounty = fetchMembers(
      "county",
      userData.county,
      setCountyMembers
    );
    const unsubConstituency = fetchMembers(
      "constituency",
      userData.constituency,
      setConstituencyMembers
    );
    const unsubWard = fetchMembers("ward", userData.ward, setWardMembers);

    return () => {
      unsubCounty?.();
      unsubConstituency?.();
      unsubWard?.();
    };
  }, [userData]);

  // Render each member
  const renderMember = ({ item }) => (
    <View className="flex-row items-center justify-between m-2 gap-2">
      <View className="flex-row items-center gap-3">
        <Image
          source={{ uri: item.userImg }}
          className="h-14 w-14 rounded-full border border-red-500 p-[1.5px]"
        />
        <Text>
          <Text className="font-bold">{item.name}</Text>
          <Text className="font-bold"> {item.lastname}</Text>
          <Text className="text-gray-500"> @{item.nickname}</Text>
        </Text>
      </View>
      <Pressable
        onPress={() => followMember(item.id)}
        disabled={followLoading[item.id]}
        className={`p-3 rounded-lg ${
          userData.id === item.id
            ? "bg-gray-300"
            : hasFollowed[item.id]
            ? "bg-red-500 text-white"
            : "bg-blue-500 text-white"
        }`}
      >
        {userData.id === item.id ? (
          <Text className="font-bold">You</Text>
        ) : followLoading[item.id] ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text className="font-bold text-white">
            {hasFollowed[item.id] ? "Unfollow" : "Follow"}
          </Text>
        )}
      </Pressable>
    </View>
  );

  // Render tab content
  const renderTabContent = (data) => (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={renderMember}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View className="flex-1 items-center justify-center">
          <Text>No Users</Text>
        </View>
      }
    />
  );

  return (
    <SafeAreaView className="flex-1 gap-5">
      {/* Tab Selector */}
      <View className="flex-row justify-between p-3 px-5 bg-gray-200 items-center">
        {["county", "constituency", "ward"].map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}>
            <Text
              className={`${
                activeTab === tab
                  ? "underline font-bold text-2xl text-blue-950"
                  : "text-xl"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Member List */}
      <View>
        {activeTab === "county" && renderTabContent(countyMembers)}
        {activeTab === "constituency" && renderTabContent(constituencyMembers)}
        {activeTab === "ward" && renderTabContent(wardMembers)}
      </View>
    </SafeAreaView>
  );
};

export default Members;
