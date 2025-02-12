import React from "react";
import { ChannelList } from "stream-chat-expo";
import { router } from "expo-router";
import { useUserInfo } from "@/components/UserContext";
import { View, useColorScheme } from "react-native";

const index = () => {
  const { userDetails } = useUserInfo();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF", // Dark: gray-800, Light: white
      }}
    >
      <ChannelList
        filters={{ members: { $in: [String(userDetails?.id)] } }}
        onSelect={(channel) => router.push(`/channel/${channel.cid}`)}
        additionalFlatListProps={{
          style: {
            backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF",
          },
        }}
      />
    </View>
  );
};

export default index;
