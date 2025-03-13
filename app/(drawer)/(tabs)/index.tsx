import React, { useState, useEffect } from "react";
import Feed from "@/components/National/Feed";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

const HomeScreen = () => {
  return (
    <SafeAreaView className="flex-1 dark:bg-gray-800" edges={["bottom"]}>
      <StatusBar style="auto" />
      <Feed className="flex-1" />
    </SafeAreaView>
  );
};

export default HomeScreen;
