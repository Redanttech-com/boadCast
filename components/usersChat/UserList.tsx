import { View, Text, Pressable, Image } from "react-native";
import React, { useEffect, useState } from "react";
import { useChatContext } from "stream-chat-expo";
import { useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { Avatar } from "react-native-elements";
import { useColorScheme } from "@/hooks/useColorScheme.web";

const UserList = ({ userChat }: { userChat: string }) => {
  const { client } = useChatContext();

  const { user: me } = useUser();

  const colorScheme = useColorScheme();

  const onPress = async () => {
    const channel = client.channel("messaging", {
      members: [me?.id, userChat?.uid],
    });
    await channel.watch();
    router.push(`/(drawer)/(chats)/channel/${channel.cid}`);
    console.log("create channel", channel);
  };

  console.log("userchgt", userChat.uid);
  const getColorFromName = (name) => {
    if (!name) return "#ccc"; // Default color if no name exists

    // Generate a hash number from the name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Predefined colors for better visuals
    const colors = [
      "#FF5733",
      "#33FF57",
      "#3357FF",
      "#F1C40F",
      "#8E44AD",
      "#E74C3C",
      "#2ECC71",
      "#1ABC9C",
      "#3498DB",
    ];

    // Pick a color consistently based on the hash value
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Pressable
      onPress={onPress}
      className="p-5 bg-gray-100 rounded-md dark:bg-gray-600"
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Avatar
          size={40}
          source={userChat?.userImg && { uri: userChat?.userImg }}
          title={userChat?.name && userChat?.name[0].toUpperCase()}
          containerStyle={{
            backgroundColor: getColorFromName(userChat?.name),
            borderRadius: 5,
          }} // Consistent color per user
          avatarStyle={{
            borderRadius: 5, // This affects the actual image
          }}
        />
        <View className="flex-row gap-2">
          <Text className="font-bold dark:text-white">{userChat?.name}</Text>
          <Text className="font-bold dark:text-white">
            {userChat?.lastname}
          </Text>
          <Text style={{ color: "gray" }}>@{userChat?.nickname}</Text>
        </View>
      </View>
    </Pressable>
  );
};

export default UserList;
