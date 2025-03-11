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
import List from "@/components/usersChat/List";

const UsersList = () => {
  const [users, setUsers] = useState([]); // State to hold user posts
  const [allUsers, setAllUsers] = useState([]); // State to hold all user posts
  const [querySearch, setQuery] = useState("");
  const colorScheme = useColorScheme();
  const { user } = useUser();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      const q = query(collection(db, "userPosts"));
      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllUsers(users);
    };
    fetchUserData();
  }, [user]);

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
      <View
        style={{
          backgroundColor: colorScheme === "dark" ? "#1E1E1E" : "#FFFFFF",
          flex: 1,
        }}
      >
        <StatusBar style="auto" />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 16,
            marginTop: 10,
          }}
        >
          
        
          <View />
        </View>

        {/* Search Input */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            borderWidth: 1,
            borderRadius: 25,
            borderColor: "#D3D3D3",
            backgroundColor: colorScheme === "dark" ? "#333" : "#F9F9F9",
            paddingVertical: 5,
          }}
        >
          <TextInput
            placeholder="Search users"
            placeholderTextColor={
              colorScheme === "dark" ? "#CCCCCC" : "#808080"
            }
            value={querySearch}
            onChangeText={setQuery}
            style={{
              flex: 1,
              paddingVertical: 10,
              paddingHorizontal: 15,
              color: colorScheme === "dark" ? "#FFFFFF" : "#000000",
            }}
          />
          {querySearch ? (
            <Pressable onPress={clearQuery} style={{ padding: 10 }}>
              <Feather
                name="x"
                size={24}
                color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
              />
            </Pressable>
          ) : null}
        </View>

        {/* Users List */}
        <FlatList
          data={querySearch ? users : allUsers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{  paddingBottom: 20 }}
          renderItem={({ item }) =>
            querySearch ? (
              <UserList userChat={item} />
            ) : (
              <List userChat={item} />
            )
          }
          ListEmptyComponent={() => (
            <Text
              style={{
                textAlign: "center",
                color: colorScheme === "dark" ? "#FFFFFF" : "#808080",
                fontSize: 16,
                marginTop: 20,
              }}
            >
              No users found.
            </Text>
          )}
        />
      </View>
    </>
  );
};

export default UsersList;
