import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";

const { height, width } = Dimensions.get("window");

const NewsDetails = () => {
  const router = useRouter();
  const { id, url } = useLocalSearchParams(); // Get the news ID and URL

  const [visible, setVisible] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="w-full flex-row justify-between items-center px-4 bg-white dark:bg-gray-800">
        <Pressable
          onPress={() => router.push("/news")}
          className="bg-gray-100 p-2 rounded-full dark:bg-gray-500"
        >
          <Text className="dark:text-white">⬅ Back</Text>
        </Pressable>
      </View>

      {/* WebView to display news content */}
      {url ? (
        <WebView
          source={{ uri: url }}
          onLoadStart={() => setVisible(true)}
          onLoadEnd={() => setVisible(false)}
        />
      ) : (
        <Text className="text-center mt-4 text-red-500">
          No article URL provided.
        </Text>
      )}

      {/* Loading Indicator */}
      {visible && (
        <ActivityIndicator
          size="large"
          color="green"
          style={{
            position: "absolute",
            top: height / 2,
            left: width / 2,
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default NewsDetails;
