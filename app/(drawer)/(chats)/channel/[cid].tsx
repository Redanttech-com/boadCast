import { View, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Channel as ChannelType } from "stream-chat";
import {
  Channel,
  MessageInput,
  MessageList,
  useChatContext,
} from "stream-chat-expo";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useUserInfo } from "@/providers/UserContext";
import { useStreamVideoClient } from "@stream-io/video-react-native-sdk";
import * as Crypto from "expo-crypto";

const ChannelScreen = () => {
  const { cid } = useLocalSearchParams<{ cid: string }>();
  const [channel, setChannel] = useState<ChannelType | null>(null);
  const { userData } = useUserInfo();
  const { client } = useChatContext();
  const videoClient = useStreamVideoClient();

  useEffect(() => {
    const fetchChannel = async () => {
      if (!cid || !client) return;

      const channels = await client.queryChannels({ id: cid });
      if (channels.length > 0) {
        setChannel(channels[0]);
      }
    };

    fetchChannel();
  }, [cid, client]);

  const joinCall = async () => {
    if (!channel) return;

    const members = Object.values(channel.data?.members || {}).map((member) => ({
      user_id: member.user_id,
    }));

    const call = videoClient.call("default", Crypto.randomUUID());
    await call.getOrCreate({
      ring: true,
      data: { members },
    });
    await call.join();

    router.push(`/(drawer)/(chats)/call/${call.id}`);
  };

  if (!channel || !userData) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size={"large"} />
        </View>
      </>
    );
  }

  return (
    <Channel channel={channel} audioRecordingEnabled>
      <Stack.Screen
        options={{
          headerShown: true,
          title: userData.name,
          headerRight: () => (
            <Ionicons
              name="call"
              color="gray"
              size={24}
              onPress={joinCall}
              style={{ padding: 10 }}
            />
          ),
        }}
      />
      <MessageList />
      <SafeAreaView edges={["bottom"]}>
        <MessageInput />
      </SafeAreaView>
    </Channel>
  );
};

export default ChannelScreen;
