import React, { useState, useEffect } from "react";
import Feed from "@/components/National/Feed";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { View } from "react-native";

const HomeScreen = () => {
  const colorScheme = useColorScheme();
  return (
    <View className="flex-1  dark:bg-gray-800">
      <Feed />
    </View>
  );
};

export default HomeScreen;
