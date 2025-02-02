import { View, Text, Pressable, Image } from "react-native";
import React from "react";
import { useChatContext } from "stream-chat-expo";
import { useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";

const UserList = ({ user }) => {
  const { client } = useChatContext();
  const { user: me } = useUser();

  const onPress = async () => {
    console.log("Pressable clicked"); // Debug log
    try {
      const channel = client.channel("messaging", {
        members: [me.id, user?.id],
      });
      console.log("Channel created:", channel);
      await channel.watch();
      router.replace(`/(drawer)/(chats)/channel/${channel.cid}`);
    } catch (error) {
      console.error("Error creating channel:", error);
    }
  };

  return (
    <Pressable onPress={onPress} className="p-5 bg-gray-200">
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Image
          source={{ uri: user?.userImg }}
          style={{ height: 40, width: 40, borderRadius: 20 }}
        />
        <View className="flex-row gap-2">
          <Text style={{ fontWeight: "bold" }}>{user?.name}</Text>
          <Text style={{ fontWeight: "bold" }}>{user?.lastname}</Text>

          <Text style={{ color: "gray" }}>@{user?.nickname}</Text>
        </View>
      </View>
    </Pressable>
  );
};

export default UserList;
