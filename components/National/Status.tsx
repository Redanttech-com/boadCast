import { View, Text, Image } from "react-native";
import React from "react";
import EvilIcons from "@expo/vector-icons/EvilIcons";

const Status = () => {
  return (
    <View className="m-5 flex-row items-center justify-between">
      <View>
        <EvilIcons name="arrow-left" size={30} color="black" />
      </View>

      <View className="">
        <Image
          source={require("@/assets/images/accnt.jpg")}
          className="h-20 w-20 rounded-full border-2 border-blue-800"
        />
      </View>

      <View>
        <EvilIcons name="arrow-right" size={30} color="black" />
      </View>
    </View>
  );
};

export default Status;
