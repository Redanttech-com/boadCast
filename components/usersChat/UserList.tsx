import { View, Text, Pressable, Image } from "react-native";
import React, { useEffect, useState } from "react";
import { useChatContext } from "stream-chat-expo";
import { useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "react-native-elements";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase";
import { useColorScheme } from "@/hooks/useColorScheme.web";

const UserList = () => {
  const { client } = useChatContext();

  const { user: me } = useUser();

    const { user } = useUser();
    const [userData, setUserData] = useState(null);
    const colorScheme = useColorScheme();

    useEffect(() => {
      const fetchUserData = async () => {
        if (!user?.id) return;
        const q = query(
          collection(db, "userPosts"),
          where("uid", "==", user.id)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setUserData(querySnapshot.docs[0].data());
        }
      };
      fetchUserData();
    }, [user]);

  const onPress = async () => {
    const channel = client.channel("messaging", {
      members: [ user?.id],
    });
    await channel.watch();
    router.replace(`/(drawer)/(chats)/channel/${channel.cid}`);
  };

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
    <View className="px-2">
      <Pressable
        onPress={onPress}
        className="p-5 bg-gray-100 rounded-md dark:bg-gray-600"
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Avatar
            size={40}
            rounded
            source={userData?.userImg ? { uri: userData?.userImg } : null}
            title={userData?.name && userData?.name[0].toUpperCase()}
            containerStyle={{
              backgroundColor: getColorFromName(userData?.name),
            }} // Consistent color per user
          />
          <View className="flex-row gap-2">
            <Text className="font-bold dark:text-white">{userData?.name}</Text>
            <Text className="font-bold dark:text-white">{userData?.lastname}</Text>

            <Text style={{ color: "gray" }}>@{userData?.nickname}</Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
};

export default UserList;
