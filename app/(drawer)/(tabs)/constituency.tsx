
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Feed from "@/components/Constituency/Feed";
import { StatusBar } from "expo-status-bar";

const constituency = () => {
  return (
    <SafeAreaView className="flex-1 dark:bg-gray-800 bg-white">
      <StatusBar style="auto" />
      <Feed />
    </SafeAreaView>
  );
};

export default constituency;
