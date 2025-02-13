import React from "react";
import { ChannelList, ChannelPreviewMessenger } from "stream-chat-expo";
import { router, Stack } from "expo-router";
import { useUserInfo } from "@/components/UserContext";
import { View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Text } from "react-native";
import { AntDesign } from "@expo/vector-icons";

const index = () => {
  const { userDetails } = useUserInfo();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView className="flex-1 dark:bg-gray-800">
        <StatusBar style="auto" />
        <View className="flex-row justify-between p-4">
          <AntDesign
            onPress={() => router.push("/(drawer)/(tabs)")}
            name="left"
            size={24}
            color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
          />
          <Text className="dark:text-white font-bold text-2xl">Chat</Text>
          <AntDesign
            onPress={() => router.push("/(drawer)/(chats)/users")}
            name="right"
            size={24}
            color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
          />
        </View>
        <ChannelList
          filters={{ members: { $in: [String(userDetails?.id)] } }}
          onSelect={(channel) => router.push(`/channel/${channel.cid}`)}
        />
      </SafeAreaView>
    </>
  );
};

export default index;
