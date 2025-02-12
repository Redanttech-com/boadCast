import React, { useState, useEffect } from "react";
import Feed from "@/components/National/Feed";
import Header from "@/components/National/Header";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "@/hooks/useColorScheme.web";

const HomeScreen = () => {
  const colorScheme = useColorScheme();
  return (
    <View className="flex-1 mt-10 dark:bg-gray-800 bg-white ">
      <Feed />
    </View>
  );
};

export default HomeScreen;
