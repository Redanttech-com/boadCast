import { View, Text, Pressable, TextInput, FlatList } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { router } from "expo-router";
import ProductList from "../(Products)/ProductFeed";
import ProductFeed from "../(Products)/ProductFeed";
import { StatusBar } from "expo-status-bar";

const market = () => {
  return (
    <View className="flex-1 gap-3 bg-gray-100 dark:bg-gray-800">
      <View className=" flex-row  px-4 justify-between items-center">
      </View>
      <View className="bg-white flex-1 dark:bg-gray-800">
        <ProductFeed />
      </View>
    </View>
  );
};

export default market;
