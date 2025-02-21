import { View, Text, Image, Pressable, Animated, Easing } from "react-native";
import React, { useEffect, useRef } from "react";
import { router } from "expo-router";
import { ResizeMode, Video } from "expo-av";

const StatusPost = ({ id, post }) => {
  const borderColorAnim = useRef(new Animated.Value(0)).current; // Create Animated Value
  useEffect(() => {
    // Animate border color between blue and purple
    Animated.loop(
      Animated.sequence([
        Animated.timing(borderColorAnim, {
          toValue: 1,
          duration: 1000, // 1 second to switch colors
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

  // Interpolating border color
  const borderColor = borderColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#3b82f6", "#bd124e"], // Blue to Purple
  });


  return (
    <Pressable
      onPress={() => router.push(`/(status)/status/${post?.uid}`)}
      className="items-center px-1 justify-center"
    >
      <Animated.View
        style={{
          borderWidth: 2,
          borderColor, // Animated border color
          borderRadius: 50,
          padding: 2,
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
      </Animated.View>
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
