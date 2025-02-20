import { View, Text, Pressable } from "react-native";
import React, { useEffect, useState } from "react";
import { useChatContext } from "stream-chat-expo";
import { useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "react-native-elements";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/firebase";
import { useColorScheme } from "@/hooks/useColorScheme.web";

const UserList = () => {
  const { client } = useChatContext();
  const { user } = useUser(); // Removed duplicate `me`
  const colorScheme = useColorScheme();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;

      try {
        const q = query(collection(db, "userPosts")); // Ensure correct collection
        const querySnapshot = await getDocs(q);

        const userData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setUsers(userData);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [user]);

  const onPress = async () => {
    const channel = client.channel("messaging", {
      members: [user?.id],
    });
    await channel.watch();
    router.replace(`/(drawer)/(chats)/channel/${channel.cid}`);
  };

  const getColorFromName = (name) => {
    if (!name) return "#ccc"; // Default color if no name exists

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

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

    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <View className="px-2">
      {users.map((user) => (
        <Pressable
          key={user?.id}
          onPress={() => onPress(user?.id)}
          className="p-5 bg-gray-100 rounded-md dark:bg-gray-600 mb-2"
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Avatar
              size={40}
              rounded
              source={user?.userImg ? { uri: user.userImg } : null}
              title={user?.name ? user.name[0].toUpperCase() : "?"}
              containerStyle={{
                backgroundColor: getColorFromName(user?.name),
              }}
            />
            <View className="flex-row gap-2">
              <Text className="font-bold dark:text-white">{user?.name}</Text>
              <Text className="font-bold dark:text-white">
                {user?.lastname}
              </Text>
              <Text style={{ color: "gray" }}>@{user?.nickname}</Text>
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );
};

export default UserList;
