import { Tabs, useRouter } from "expo-router";
import React, { useState } from "react";
import { Platform, View, StyleSheet, Pressable } from "react-native";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  AntDesign,
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { FloatingAction } from "react-native-floating-action";
import Draggable from "react-native-draggable";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Manage Floating Button visibility
  const insets = useSafeAreaInsets();

  // Floating action buttons
  const actions = [
    {
      text: "County",
      name: "../(countydrawer)/(tabs)",
      position: 1,
      icon: <Feather name="map" size={24} color={"#fff"} />,
      color: "#2563EB", // Tailwind blue-600
      textStyle: { color: "#fff" }, // Label text color
      textBackground: "#1E40AF", // Label background color
    },
    {
      text: "Constituency",
      name: "../(constituencydrawer)/(tabs)",
      position: 2,
      icon: <FontAwesome5 name="flag" size={24} color={"#fff"} />,
      color: "#10B981", // Tailwind emerald-500
      textStyle: { color: "#fff" },
      textBackground: "#065F46",
    },
    {
      text: "Ward",
      name: "../(warddrawer)/(tabs)",
      position: 3,
      icon: <FontAwesome5 name="map-pin" size={24} color={"#fff"} />,
      color: "#F59E0B", // Tailwind amber-500
      textStyle: { color: "#fff" },
      textBackground: "#B45309",
    },
  ];


  return (
    <View style={styles.container}>
      {/* Tabs */}
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colorScheme === "dark" ? "#fff" : "#1F2937",
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colorScheme === "dark" ? "#1F2937" : "#fff",
            ...Platform.select({
              ios: { position: "absolute" },
              default: {},
            }),
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <Ionicons name="globe-sharp" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="market"
          options={{
            title: "Market", // Ensure header is visible
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="bar-chart" size={24} color={color} />
            ),
            // headerRight: () => (
            //   <Pressable
            //     onPress={() => router.push("/(Products)/ProductForm")}
            //     className="mr-5"
            //   >
            //     <Text className="border dark:border-gray-500 p-3 rounded-md font-bold dark:text-white">
            //       Sell
            //     </Text>
            //   </Pressable>
            // ),
          }}
        />

        <Tabs.Screen
          name="input"
          options={{
            title: "",
            tabBarIcon: ({ color }) => (
              <View className="bg-gray-400 dark:bg-gray-700 h-14 w-14  items-center justify-center rounded-full">
                <AntDesign name="plus" size={24} color="white" className="" />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="news"
          options={{
            title: "News",
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="newspaper" size={24} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="person" size={24} color={color} />
            ),
          }}
        />
      </Tabs>
      {/* Floating Action Button (FAB) */}

        <View className="bottom-20 fixed">
          <FloatingAction
            actions={actions}
            onPressItem={(name) => {
              router.push(`/${name}`);
            }}
            color="#1F2937"
            overlayColor="rgba(0,0,0,0.7)"
            floatingIcon={
              <Feather name="more-vertical" size={24} color="#fff" />
            }
          />
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
});
