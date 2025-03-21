import { View, Text, TouchableOpacity, Image, ScrollView, Pressable } from "react-native";
import React from "react";
import { router } from "expo-router";

const SearchProduct = ({ id, item, product }) => {
  const handlePress = () => {
    console.log("Navigating to product:", id);
    router.push(`/(Products)/product/${id}`); // ✅ Navigate programmatically
  };

  return (
    <View className="mb-2 m-1">
      <Pressable
        onPress={handlePress}
        className="dark:bg-gray-600 rounded-md"
      >
        <View className="gap-1">
          <Image
            source={{ uri: item.image }}
            style={{
              width: "100%",
              height: 100,
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
            }}
          />

          <View className="m-3">
            <Text className="dark:text-white font-bold">
              {item.productname || "Unknown"}
            </Text>
            <Text className="dark:text-white text-sm">
              Price: KES {Number(item.cost).toLocaleString("en-KE")}
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
};

export default SearchProduct;
