import React from "react";
import {
  ChannelList,
  ChannelPreviewMessenger,
  OverlayProvider,
} from "stream-chat-expo";
import { router, Stack } from "expo-router";
import { useUserInfo } from "@/components/UserContext";
import { View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Text } from "react-native";
import { AntDesign, Ionicons } from "@expo/vector-icons";

const index = () => {
  const { userDetails } = useUserInfo();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 dark:bg-gray-800">
        <ChannelList
          filters={{ members: { $in: [String(userDetails?.id)] } }}
          onSelect={(channel) => router.push(`/channel/${channel.cid}`)}
        />
      </View>
    </>
  );
};

export default index;
