import { View, Text } from "react-native";
import React, { useState } from "react";
import {
  Channel,
  ChannelList,
  MessageInput,
  MessageList,
} from "stream-chat-expo";
import { Link, router, Stack } from "expo-router";
import { useUserInfo } from "@/components/UserContext";
import { FontAwesome5 } from "@expo/vector-icons";

const index = () => {
  const { userDetails } = useUserInfo();

  return (
    <ChannelList
      filters={{ members: { $in: [userDetails?.id] } }}
      onSelect={(channel) => router.push(`/channel/${channel.cid}`)}
    />
  );
};

export default index;
