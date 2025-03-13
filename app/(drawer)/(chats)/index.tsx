import React from "react";
import { ChannelList, OverlayProvider } from "stream-chat-expo";
import { router, Stack } from "expo-router";
import { useUserInfo } from "@/components/UserContext";
import { View, useColorScheme } from "react-native";

const index = () => {
  const { userDetails } = useUserInfo();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  return (
    <OverlayProvider>
      <Stack.Screen options={{ headerShown: false }} />
      <View
        style={{
          flex: 1,
          backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF", // Dark mode background
        }}
      >
        <ChannelList
          filters={{ members: { $in: [String(userDetails?.id)] } }}
          onSelect={(channel) => router.push(`/channel/${channel.cid}`)}
          additionalFlatListProps={{
            contentContainerStyle: {
              flexGrow: 1,
              backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF", // ✅ Set ChannelList background color
            },
          }}
        />
      </View>
    </OverlayProvider>
  );
};

export default index;
