import { View, Text } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Feed from "@/components/Ward/Feed";
import { StatusBar } from "expo-status-bar";

const Ward = () => {
  return (
    <SafeAreaView className="flex-1 dark:bg-gray-800" edges={["bottom"]}>
      <StatusBar style="auto" />
      <Feed className="flex-1" />
    </SafeAreaView>
  );
};

export default Ward;
