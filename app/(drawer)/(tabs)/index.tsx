import React, { useState, useEffect } from "react";
import Feed from "@/components/National/Feed";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "@/hooks/useColorScheme.web";

const HomeScreen = () => {
  const colorScheme = useColorScheme();
  return (
    <SafeAreaView className="flex-1  dark:bg-gray-800" edges={["top"]}>
      <StatusBar style="auto" />
      <Feed />
    </SafeAreaView>
  );
};

export default HomeScreen;
