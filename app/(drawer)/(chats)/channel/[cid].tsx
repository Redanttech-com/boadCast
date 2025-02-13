import { Ionicons } from "@expo/vector-icons";
import { useStreamVideoClient } from "@stream-io/video-react-native-sdk";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Channel as ChannelType } from "stream-chat";
import {
  Channel,
  MessageInput,
  MessageList,
  useChatContext,
} from "stream-chat-expo";
import * as Crypto from "expo-crypto";

export default function ChannelScreen() {
  const [channel, setChannel] = useState<ChannelType | null>(null);
  const { cid } = useLocalSearchParams<{ cid: string }>();
  const { client } = useChatContext();
  const videoClient = useStreamVideoClient();

  useEffect(() => {
    if (!cid) return;

    const fetchChannel = async () => {
      try {
        const channels = await client.queryChannels({ cid });
        setChannel(channels[0]);
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

    // Uncomment to navigate to the call screen after joining
    router.push(`/(drawer)/(chats)/call/${call.id}`);
  };

  if (!channel) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View
        className="flex-1 justify-center items-center dark:bg-gray-800"
        >
          <ActivityIndicator size="large" color="blue" />
        </View>
      </>
    );
  }

  return (
    <Channel channel={channel} audioRecordingEnabled>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Chat",
          headerRight: () => (
            <Ionicons name="call" size={20} color="gray" onPress={joinCall} />
          ),
        }}
      />
      <MessageList />
      <SafeAreaView edges={["bottom"]}>
        <MessageInput />
      </SafeAreaView>
    </Channel>
  );
}
