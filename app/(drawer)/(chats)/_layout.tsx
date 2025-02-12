import ChatProvider from "@/providers/ChatProviders";
import VideoProvider from "@/providers/VideoProvider";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import React from "react";
import { Pressable, useColorScheme } from "react-native";

const Message = () => {
  const colorScheme = useColorScheme(); // Detect dark or light mode
  const isDarkMode = colorScheme === "dark";

  return (
    <ChatProvider>
      <VideoProvider>
        <Stack>
          <Stack.Screen
            name="index"
            options={{
              headerShown: true,
              title: "Messages",
              headerStyle: {
                backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF", // Dark: gray-800, Light: white
              },
              headerTintColor: isDarkMode ? "#FFFFFF" : "#000000", // Dark: White text, Light: Black text
              headerLeft: () => (
                <Pressable
                  onPress={() => {
                    router.push("/(drawer)/(tabs)");
                  }}
                >
                  <AntDesign
                    name="left"
                    size={24}
                    color={isDarkMode ? "white" : "black"}
                  />
                </Pressable>
              ),
              headerRight: () => (
                <Pressable
                  onPress={() => {
                    router.push("/(drawer)/(chats)/users");
                  }}
                >
                  <Ionicons
                    name="people"
                    size={24}
                    color={isDarkMode ? "white" : "gray"}
                  />
                </Pressable>
              ),
            }}
          />
        </Stack>
      </VideoProvider>
    </ChatProvider>
  );
};

export default Message;
