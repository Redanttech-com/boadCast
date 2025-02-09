import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import React from "react";
import { router } from "expo-router";

const SearchProduct = ({ id, item, product }) => {
     const handlePress = () => {
          console.log("Navigating to product:", id);
          router.push(`/(Products)/product/${id}`); // ✅ Navigate programmatically
        };

  return (
    <ScrollView>
      <TouchableOpacity
      onPress={handlePress}
        style={{
          backgroundColor: "#fff",
          marginVertical: 5,
          borderRadius: 10,
        }}
      >
        <View className="gap-1">
          <Image
            source={{ uri: item.image }}
            style={{
              width: "100%",
              height: 200,
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
            }}
          />

          <View className="m-3">
            <Text style={{ marginTop: 10, fontSize: 16 }}>
              {item.productname || "Unknown"}
            </Text>
            <Text style={{ fontSize: 14, color: "#555" }}>
              Price: KES {Number(item.cost).toLocaleString("en-KE")}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default SearchProduct;
