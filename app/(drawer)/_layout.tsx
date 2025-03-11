import React, { useEffect, useState } from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { router, useRouter, withLayoutContext } from "expo-router";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import {
  Image,
  Pressable,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { Avatar } from "react-native-elements";
import {
  Feather,
  FontAwesome5,
  Fontisto,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import "@/global.css";
import { useUser } from "@clerk/clerk-expo";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase";

// Create Drawer Navigator
const DrawerNavigator = createDrawerNavigator().Navigator;
const Drawer = withLayoutContext(DrawerNavigator);

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Custom Drawer Content
function CustomDrawerContent(props) {
  const [userData, setUserData] = useState(null);
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  // Detect system theme
  const colorScheme = useColorScheme();
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
    setLoading(false);
  }, [user]);

  if (loading) {
    return (
      <DrawerContentScrollView {...props}>
        <Text>Loading user data...</Text>
      </DrawerContentScrollView>
    );
  }

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

  return (
    <DrawerContentScrollView
      {...props}
      style={{
        backgroundColor: colorScheme === "dark" ? "#1F2937" : "#FFFFFF",
      }}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Avatar
            size={40}
            source={userData?.userImg && { uri: userData?.userImg }}
            title={userData?.name && userData?.name[0].toUpperCase()}
            containerStyle={{
              backgroundColor: getColorFromName(userData?.name),
              borderRadius: 5, // Adjust this value for more or less roundness
            }}
            avatarStyle={{
              borderRadius: 5, // This affects the actual image
            }}
          />
          <View>
            <Text
              className="font-extrabold ml-4 text-xl  max-w-28 min-w-28 dark:text-white"
              numberOfLines={1}
            >
              {userData?.name || user?.firstName}
            </Text>
            <Text
              className="font-extrabold ml-4 text-sm text-gray-400 max-w-28 min-w-28"
              numberOfLines={1}
            >
              @{userData?.nickname || "Guest"}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push("/(status)/StatusForm")}
          className="flex-row gap-2 items-center rounded-full p-2 bg-blue-300"
        >
          <Ionicons name="add" size={24} color="white" />
          <Text className="font-bold text-white">Add Status</Text>
        </Pressable>
      </View>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

// Drawer Layout
export default function DrawerLayout() {
  const colorScheme = useColorScheme();
  return (
    <Drawer
      screenOptions={{
        headerShown: true,
        headerTransparent: false,
        drawerStyle: {
          backgroundColor: colorScheme === "dark" ? "#1F2937" : "#FFFFFF", // Dark mode background
        },
        drawerActiveTintColor: colorScheme === "dark" ? "#FFFFFF" : "#000000", // Active item text
        drawerInactiveTintColor: colorScheme === "dark" ? "#D1D5DB" : "#4B5563", // Inactive item text
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          title: "BroadCast",
          drawerIcon: ({ size, color }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="market"
        options={{
          title: "Market",
          drawerIcon: ({ size, color }) => (
            <MaterialIcons name="bar-chart" size={size} color={color} />
          ),
          headerRight: () => (
            <Pressable
              onPress={() => router.push("/(Products)/ProductForm")}
              className="mr-5"
            >
              <Text className="border dark:border-gray-500 p-3 rounded-md font-bold ">
                Sell
              </Text>
            </Pressable>
          ),
        }}
      />
      <Drawer.Screen
        name="(chats)"
        options={{
            title: "Chats",
            drawerIcon: ({ size, color }) => (
              <MaterialIcons name="message" size={size} color={color} />
            ),
            headerRight: () => (
              <Pressable
                onPress={() => 
                  router.push("/(drawer)/(chats)/users")
                }
                className="mr-5"
              >
                <Ionicons name="people" size={24} color="black" />
              </Pressable>
            ),
        }}
      />
      <Drawer.Screen
        name="media"
        options={{
          title: "Media",
          drawerIcon: ({ size, color }) => (
            <Ionicons name="camera" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="news"
        options={{
          title: "News",
          drawerIcon: ({ size, color }) => (
            <MaterialIcons name="newspaper" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="members"
        options={{
          title: "Members",
          drawerIcon: ({ size, color }) => (
            <Fontisto name="persons" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="national"
        options={{
          title: "National Trends",
          drawerIcon: ({ size, color }) => (
            <Ionicons name="globe-sharp" size={24} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="county"
        options={{
          title: "County Trends",
          drawerIcon: ({ size, color }) => (
            <Feather name="map" size={24} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="constituency"
        options={{
          title: "Constituency Trends",
          drawerIcon: ({ size, color }) => (
            <FontAwesome5 name="flag" size={24} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="ward"
        options={{
          title: "Ward Trends",
          drawerIcon: ({ size, color }) => (
            <FontAwesome5 name="map-pin" size={24} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          title: "My Profile",
          drawerIcon: ({ size, color }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}
