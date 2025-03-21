import { View } from "react-native";
import React, { useEffect, useState } from "react";
import ProductFeed from "../(Products)/ProductFeed";

const market = () => {
  return (
    <View className="flex-1 gap-3 bg-gray-100 dark:bg-gray-800">
      <View className=" flex-row  px-4 justify-between items-center"></View>
      <View className="bg-white flex-1 dark:bg-gray-800">
        <ProductFeed />
      </View>
    </View>
  );
};

export default market;
