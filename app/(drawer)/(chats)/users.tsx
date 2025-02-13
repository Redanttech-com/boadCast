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

const UsersList = () => {
  const [users, setUsers] = useState([]); // State to hold user posts
  const [querySearch, setQuery] = useState("");
  const colorScheme = useColorScheme();

  // Fetch posts, excluding current user's posts
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!querySearch) {
          setUsers([]); // Clear results if no search query
          return;
        }

        // Query for matching names
        const q1 = query(
          collection(db, "userPosts"),
          where("name", ">=", querySearch),
          where("name", "<=", querySearch + "\uf8ff")
        );

        // Query for matching nickname
        const q2 = query(
          collection(db, "userPosts"),
          where("nickname", ">=", querySearch),
          where("nickname", "<=", querySearch + "\uf8ff")
        );

        // Fetch both queries separately
        const [snapshot1, snapshot2] = await Promise.all([
          getDocs(q1),
          getDocs(q2),
        ]);

        // Using a Set to deduplicate based on user id
        const docsMap = new Map();

        // Process first query results
        snapshot1.forEach((doc) => {
          docsMap.set(doc.id, { id: `name-${doc.id}`, ...doc.data() }); // Prefix id to ensure unique key
        });

        // Process second query results (categories)
        snapshot2.forEach((doc) => {
          docsMap.set(doc.id, { id: `nickname-${doc.id}`, ...doc.data() }); // Prefix id to ensure unique key
        });

        setUsers(Array.from(docsMap.values())); // Convert map to array for state
      } catch (error) {
        console.error("Error searching Firestore:", error);
      }
    };

    fetchData();
  }, [querySearch]);

  const clearQuery = () => {
    setQuery("");
  };

  // Render the list of users
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
          <View></View>
        </View>

        <View className="flex-row items-center justify-between px-4 m-3 border rounded-full border-gray-300 my-2">
          <TextInput
            placeholder="Search users"
            placeholderTextColor={
              colorScheme === "dark" ? "#FFFFFF" : "#808080"
            } // Light gray for light mode, white for dark mode
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
        <FlatList
          data={users}
          contentContainerStyle={{ gap: 5 }}
          keyExtractor={(item) => item.id} // Now using unique id for each item
          renderItem={({ item }) => <UserList user={item} />} // Render each user in the list
        />
      </SafeAreaView>
    </>
  );
};

export default UsersList;
