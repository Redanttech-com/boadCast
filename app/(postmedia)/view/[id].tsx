import { View, Text, Pressable, ActivityIndicator } from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import Posts from "@/components/National/Posts";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { AntDesign } from "@expo/vector-icons";
import { goBack } from "expo-router/build/global-state/routing";
import { ScrollView } from "react-native-gesture-handler";

const MediaSize = ({openBottomSheet}) => {
  const { id } = useLocalSearchParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();

const fetchPostData = useCallback(async () => {
  if (!id ) return;

  try {
    const docRef = doc(db, "national", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      setPost(docSnap.data());
    } else {
      console.warn("⚠️ No post found with this ID:", id);
    }
  } catch (error) {
    console.error("❌ Error fetching post:", error);
  } finally {
    setLoading(false);
  }
}, [id]);


useEffect(() => {
  if (id) {
    fetchPostData();
  }
}, [id, fetchPostData]);

  return (
    <SafeAreaView className="dark:bg-gray-800 flex-1">
      <StatusBar style="auto" />
      <Pressable
        className="p-4"
        onPress={() => router.push("/(drawer)/(tabs)")}
      >
        <AntDesign
          name="arrowleft"
          size={24}
          color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
        />
      </Pressable>
      <ScrollView>
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator
              size="large"
              color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
            />
            <Text className="dark:text-white">Loading...</Text>
          </View>
        ) : (
          <Posts id={id} post={post} openBottomSheet={openBottomSheet} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default MediaSize;
