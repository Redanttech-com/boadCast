
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Feed from "@/components/Constituency/Feed";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";

const constituency = () => {
  return (
    <SafeAreaView className="flex-1 dark:bg-gray-800" edges={["bottom"]}>
      <StatusBar style="auto" />
      <Feed className="flex-1" />
    </SafeAreaView>
  );
};

export default constituency;
