import {
  CallContent,
  RingingCallContent,
  StreamCall,
  useCalls,
} from "@stream-io/video-react-native-sdk";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function CallScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const calls = useCalls();
  const call = calls[0];

  // ✅ Move navigation logic into useEffect
  useEffect(() => {
    if (!call) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/"); // ✅ Use `replace()` to avoid adding to history
      }
    }
  }, [call]); // Runs only when `call` changes

  if (!call) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" /> 
      <Stack.Screen
        options={{
          headerShown: false,
          title: "Video Call",
        }}
      />
      <StreamCall call={call}>
        <RingingCallContent />
      </StreamCall>
    </SafeAreaProvider>
  );
}
