import { View, Text, Image, Pressable, Animated, Easing } from "react-native";
import React, { useEffect, useRef } from "react";
import { router } from "expo-router";
import { ResizeMode, Video } from "expo-av";
import { useColorScheme } from "@/hooks/useColorScheme.web";

const StatusPost = ({ id, post }) => {
  const colorScheme = useColorScheme(); // Detect theme
  const borderColorAnim = useRef(new Animated.Value(0)).current; // Animated Value for border

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(borderColorAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
        Animated.timing(borderColorAnim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const borderColor = borderColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#3b82f6", "#bd124e"], // Blue to Purple
  });

  // Check if post contains media
  const hasImageOrVideo = post?.videos || post?.images;
  const showInput = !hasImageOrVideo && post?.input;

  return (
    <Pressable
      onPress={() => router.push(`/(status)/status/${post?.id}`)}
      className="items-center px-1 justify-center"
    >
      <Animated.View
        style={{
          borderWidth: 2,
          borderColor, // Animated border color
          borderRadius: 50,
          padding: 2,
          width: 54, // Ensure consistent size
          height: 54,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {post?.videos && (
          <Video
            source={{ uri: post?.videos }}
            style={{ width: 50, height: 50, borderRadius: 100 }}
            useNativeControls
            resizeMode={ResizeMode.COVER}
          />
        )}
        {post?.images && (
          <Image
            source={{ uri: post?.images }}
            style={{ width: 50, height: 50, borderRadius: 100 }}
            resizeMode={ResizeMode.COVER}
          />
        )}
        {showInput && (
          <Text
            style={{
              textAlign: "center",
              color: colorScheme === "dark" ? "white" : "black",
              fontSize: 12,
              fontWeight: "bold",
            }}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {post?.input}
          </Text>
        )}
      </Animated.View>

      {/* Username */}
      <Text
        className="min-w-14 max-w-14 text-sm text-center font-bold dark:text-white"
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {post?.name}
      </Text>
    </Pressable>
  );
};

export default StatusPost;
