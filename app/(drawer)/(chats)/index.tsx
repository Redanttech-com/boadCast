import { View, Text } from "react-native";
import React, { useState } from "react";
import {
  Channel,
  ChannelList,
  MessageInput,
  MessageList,
} from "stream-chat-expo";
import { Link, router, Stack } from "expo-router";
import { useUserInfo } from "@/providers/UserContext";
import { FontAwesome5 } from "@expo/vector-icons";

const index = () => {
  const { userData } = useUserInfo();

  return (
    
     
      <ChannelList
        filters={{ members: { $in: [userData?.id] } }}
        onSelect={(channel) => router.push(`/channel/${channel.cid}`)}
      />

  );
};

export default index;
