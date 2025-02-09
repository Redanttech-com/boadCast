import ChatProvider from "@/providers/ChatProviders";
import VideoProvider from "@/providers/VideoProvider";
import { Ionicons } from "@expo/vector-icons";
import { router, Slot, Stack } from "expo-router";
import React from "react";
import { Pressable } from "react-native";

const Message = () => {
  return (
    <ChatProvider>
      <VideoProvider>
        <Stack>
          <Stack.Screen
            name="index"
            options={{
              headerShown: true,
              title: "Messages",
              headerRight: () => (
                <Pressable
                  onPress={() => {
                    router.push("/(drawer)/(chats)/users");
                  }}
                >
                  <Ionicons name="people" size={24} color={"gray"} />
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
