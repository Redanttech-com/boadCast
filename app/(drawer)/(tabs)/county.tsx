import { View, Text } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Feed from "@/components/County/Feed";
import { StatusBar } from "expo-status-bar";

const County = () => {
  return (
    <View className="flex-1 dark:bg-gray-800 bg-white">
      <Feed />
    </View>
  );
};

export default County;
