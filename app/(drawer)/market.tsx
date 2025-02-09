import { View, Text, Pressable, TextInput, FlatList } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { router } from "expo-router";
import ProductList from "../(Products)/ProductFeed";
import ProductFeed from "../(Products)/ProductFeed";

const market = () => {
  return (
    <SafeAreaView className="flex-1 gap-3 bg-gray-100">
      <View className=" flex-row m-2 justify-between items-center">
        <View>
          <Text className="font-bold text-2xl">Market</Text>
        </View>

        <View>
          <Pressable onPress={() => router.push("/(Products)/ProductForm")}>
            <Text className="border p-3 rounded-md font-bold">Sell</Text>
          </Pressable>
        </View>
      </View>
      <View className="bg-white m-3 flex-1">
        <ProductFeed />
      </View>
    </SafeAreaView>
  );
};

export default market;
