import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TextInput, Pressable } from "react-native";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { Entypo, Feather } from "@expo/vector-icons";
import UserList from "@/components/usersChat/UserList";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { router, Stack } from "expo-router";
import { useUser } from "@clerk/clerk-expo";

const UsersList = () => {
  const [users, setUsers] = useState([]); // State to hold user posts
  const [querySearch, setQuery] = useState("");
  const colorScheme = useColorScheme();
  const { user } = useUser();

  // Fetch posts based on search query
  useEffect(() => {
    const fetchData = async () => {
      if (!querySearch.trim()) {
        setUsers([]); // Clear results if no search query
        return;
      }

      try {
        // Firestore query for matching names or nicknames
        const userCollection = collection(db, "userPosts");

        const nameQuery = query(
          userCollection,
          where("name", ">=", querySearch),
          where("name", "<=", querySearch + "\uf8ff")
        );

        const nicknameQuery = query(
          userCollection,
          where("nickname", ">=", querySearch),
          where("nickname", "<=", querySearch + "\uf8ff")
        );

        // Fetch both queries
        const [nameSnapshot, nicknameSnapshot] = await Promise.all([
          getDocs(nameQuery),
          getDocs(nicknameQuery),
        ]);

        // Merge results, removing duplicates
        const usersMap = new Map();

        nameSnapshot.forEach((doc) => {
          usersMap.set(doc.id, { id: doc.id, ...doc.data() });
        });

        nicknameSnapshot.forEach((doc) => {
          usersMap.set(doc.id, { id: doc.id, ...doc.data() });
        });

        setUsers(Array.from(usersMap.values())); // Convert to array
      } catch (error) {
        console.error("Error searching Firestore:", error);
      }
    };

    fetchData();
  }, [querySearch]);

  // Clear search input
  const clearQuery = () => {
    setQuery("");
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="bg-white gap-3 flex-1 dark:bg-gray-800">
        <StatusBar style="auto" />
        <View className="flex-row justify-between px-4 items-center mt-5">
          <Entypo
            onPress={() => router.push("/")}
            name="chevron-with-circle-left"
            size={32}
            color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
          />
          <Text className="dark:text-white text-center font-bold text-2xl">
            Search Users
          </Text>
          <View />
        </View>

        {/* Search Input */}
        <View className="flex-row items-center justify-between px-4 m-3 border rounded-full border-gray-300 my-2">
          <TextInput
            placeholder="Search users"
            placeholderTextColor={
              colorScheme === "dark" ? "#FFFFFF" : "#808080"
            }
            value={querySearch}
            onChangeText={setQuery}
            className="flex-1 rounded-full p-3 dark:text-white"
          />
          <Pressable onPress={clearQuery}>
            <Feather
              name="x"
              size={24}
              color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
            />
          </Pressable>
        </View>

        {/* Users List */}
        <FlatList
          data={users}
          contentContainerStyle={{ gap: 5 }}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <UserList user={item} />}
        />
      </SafeAreaView>
    </>
  );
};

export default UsersList;
