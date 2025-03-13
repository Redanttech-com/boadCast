import { Ionicons } from "@expo/vector-icons";
import { useStreamVideoClient } from "@stream-io/video-react-native-sdk";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Channel as ChannelType } from "stream-chat";
import {
  Channel,
  MessageInput,
  MessageList,
  useChatContext,
  useMessageContext,
} from "stream-chat-expo";
import * as Crypto from "expo-crypto";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function ChannelScreen() {
  const [channel, setChannel] = useState<ChannelType | null>(null);
  const { cid } = useLocalSearchParams<{ cid: string }>();
  const { client } = useChatContext();
  const videoClient = useStreamVideoClient();
  const colorScheme = useColorScheme();
  const [chatUserName, setChatUserName] = useState("Chat");

  // Define background colors
  const backgroundColor = colorScheme === "dark" ? "#1F2937" : "#FFFFFF"; // Dark mode: gray-800, Light mode: white
  const textColor = colorScheme === "dark" ? "#FFFFFF" : "#000000"; // Adjust text color

  useEffect(() => {
    if (!cid) return;

    const fetchChannel = async () => {
      try {
        const channels = await client.queryChannels({ cid });
        const channel = channels[0];
        setChannel(channel);

        if (channel) {
          const members = Object.values(channel.state.members);
          const currentUserId = client.user.id;
          const otherUser = members.find(
            (member) => member.user_id !== currentUserId
          );

          setChatUserName(otherUser?.user?.name || "Chat");
        }
      } catch (error) {
        console.error("Error fetching channel:", error);
      }
    };

    fetchChannel();
  }, [cid]);

  const joinCall = async () => {
    if (!channel) return;

    const members = Object.values(channel.state.members).map((member) => ({
      user_id: member.user_id,
    }));

    const call = videoClient.call("default", Crypto.randomUUID());
    await call.getOrCreate({
      ring: true,
      data: { members },
    });

    router.push(`/(drawer)/(chats)/call/${call.id}`);
  };

  if (!channel) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View
          className="flex-1 justify-center items-center"
          style={{ backgroundColor }}
        >
          <ActivityIndicator color={textColor} />
        </View>
      </>
    );
  }

  const CustomAvatar = () => {
    const { message } = useMessageContext();
    return <Image source={{ uri: message.user?.image }} />;
  };

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <Channel
        channel={channel}
        MessageAvatar={CustomAvatar}
        audioRecordingEnabled
      >
        <Stack.Screen
          options={{
            headerShown: true,
            title: chatUserName,
            headerStyle: { backgroundColor }, // Header background color
            headerTintColor: textColor, // Header text color
            headerRight: () => (
              <Ionicons
                name="call"
                size={20}
                color={textColor}
                onPress={joinCall}
              />
            ),
          }}
        />

        {/* MessageList with background color */}
        <MessageList style={{ flex: 1, backgroundColor }} />


        <SafeAreaView edges={["bottom"]} style={{ backgroundColor }}>
          <StatusBar style="auto" />
          <MessageInput />
        </SafeAreaView>
      </Channel>
    </View>
  );
}
