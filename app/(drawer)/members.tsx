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
import { useUserInfo } from "@/components/UserContext";
import { db } from "@/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Avatar } from "react-native-elements";

const Members = () => {
  const [activeTab, setActiveTab] = useState("national");
  const [countyMembers, setCountyMembers] = useState([]);
  const [constituencyMembers, setConstituencyMembers] = useState([]);
  const [wardMembers, setWardMembers] = useState([]);
  const [nationalMembers, setNationalMembers] = useState([]);
  const { userDetails, followLoading, hasFollowed, followMember } =
    useUserInfo();

  // Fetch members based on user location and all users for National
  useEffect(() => {
    if (!userDetails) return;

    // Fetch all users for national tab
    const fetchAllUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "userPosts"));
        const users = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNationalMembers(users);
      } catch (error) {
        console.error("Error fetching all users:", error);
      }
    };

    // Fetch users based on specific location fields (county, constituency, ward)
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

    fetchAllUsers(); // Fetch all users for National tab

    const unsubCounty = fetchMembers(
      "county",
      userDetails?.county,
      setCountyMembers
    );
    const unsubConstituency = fetchMembers(
      "constituency",
      userDetails?.constituency,
      setConstituencyMembers
    );
    const unsubWard = fetchMembers("ward", userDetails?.ward, setWardMembers);

    return () => {
      unsubCounty?.();
      unsubConstituency?.();
      unsubWard?.();
    };
  }, [userDetails]);

  const getColorFromName = (name) => {
    if (!name) return "#ccc"; // Default color if no name exists

    // Generate a hash number from the name
    let hash = 0;
    for (let i = 0; i < name?.length; i++) {
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

  // Render each member
  const renderMember = ({ item }) => (
    <View className="flex-row items-center justify-between m-2 gap-2">
      <View className="flex-row items-center gap-3">
        <Avatar
          size={40}
          source={item?.userImg && { uri: item?.userImg }}
          title={item?.name && item?.name[0].toUpperCase()}
          containerStyle={{
            backgroundColor: getColorFromName(item?.name),
            borderRadius: 5,
          }} // Consistent color per user
          avatarStyle={{
            borderRadius: 5, // This affects the actual image
          }}
        />
        <Text>
          <Text className="font-bold dark:text-white">{item.name}</Text>
          <Text className="font-bold dark:text-white"> {item.lastname}</Text>
          <Text className="text-gray-500"> @{item.nickname}</Text>
        </Text>
      </View>
      <Pressable
        onPress={() => followMember(item.uid)}
        disabled={followLoading[item.uid]}
        className="p-3 rounded-lg"
      >
        {userDetails?.uid === item.uid ? (
          <Text className="font-bold dark:text-white">You</Text>
        ) : followLoading[item.uid] ? (
          <ActivityIndicator size="small" color="#000" />
        ) : (
          <Text
            className={`font-bold ${
              hasFollowed[item.uid] ? "text-red-500" : "text-blue-500"
            }`}
          >
            {hasFollowed[item.uid] ? "Unfollow" : "Follow"}
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
          <Text className="dark:text-white">No Users</Text>
        </View>
      }
    />
  );

  return (
    <View className="flex-1 gap-5 dark:bg-gray-800">
      {/* Tab Selector */}
      <View className="flex-row justify-between p-3 px-5 bg-gray-200 dark:bg-gray-600 items-center">
        {["national", "county", "constituency", "ward"].map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}>
            <Text
              className={`${
                activeTab === tab
                  ? "underline font-bold text-2xl  text-blue-950 dark:text-white"
                  : "text-xl dark:text-gray-300"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Member List */}
      <View>
        {activeTab === "national" && renderTabContent(nationalMembers)}
        {activeTab === "county" && renderTabContent(countyMembers)}
        {activeTab === "constituency" && renderTabContent(constituencyMembers)}
        {activeTab === "ward" && renderTabContent(wardMembers)}
      </View>
    </View>
  );
};

export default Members;
