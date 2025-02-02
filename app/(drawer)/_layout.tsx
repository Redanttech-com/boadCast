import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { router, withLayoutContext } from "expo-router";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { Image, Pressable, Text, TouchableOpacity, View } from "react-native";
import {
  Feather,
  FontAwesome5,
  Fontisto,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import "@/global.css";
import { useUser } from "@clerk/clerk-expo";
import { useUserInfo } from "@/providers/UserContext";

// Create Drawer Navigator
const DrawerNavigator = createDrawerNavigator().Navigator;
const Drawer = withLayoutContext(DrawerNavigator);

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Custom Drawer Content
function CustomDrawerContent(props) {
  const { user } = useUser();
  const { userData, loading } = useUserInfo();

  if (loading) {
    return (
      <DrawerContentScrollView {...props}>
        <Text>Loading user data...</Text>
      </DrawerContentScrollView>
    );
  }

  return (
    <DrawerContentScrollView {...props}>
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Image
            source={{
              uri: userData?.userImg || "https://via.placeholder.com/150",
            }}
            className="h-20 w-20 rounded-full"
          />
          <View>
            <Text className="font-extrabold ml-4 text-2xl">
              {userData?.name || "Guest"}
            </Text>
            <Text className="font-extrabold ml-4 text-sm text-gray-400">
              @{userData?.nickname || "Guest"}
            </Text>
          </View>
        </View>
        <Pressable className="flex-row gap-2 items-center rounded-full p-2 bg-blue-300">
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
  return (
    <Drawer drawerContent={(props) => <CustomDrawerContent {...props} />}>
      <Drawer.Screen
        name="(tabs)"
        options={{
          headerShown: true,
          title: "Broadcast",
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
        }}
      />

      <Drawer.Screen
        name="(chats)"
        options={{
          title: "Chats",
          drawerIcon: ({ size, color }) => (
            <MaterialIcons name="message" size={size} color={color} />
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
