import {
  CallContent,
  RingingCallContent,
  StreamCall,
  useCalls,
  useStreamVideoClient,
} from "@stream-io/video-react-native-sdk";
import { Redirect, router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { View } from "react-native";

const callId = "default_1ebf021c-58b7-403e-856c-dcc120b8bca8";

export default function CallScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const calls = useCalls();
  const call = calls[0];
  // const [call, setCall] = useState<Call>();

  // const client = useStreamVideoClient();

  // useEffect(() => {
  //   const fetchCall = async () => {
  //     const call = client.call("default", id);
  //     await call.get();
  //     setCall(call);
  //   };

  //   fetchCall();
  //   return () => {
  //     if (call) {
  //       call.leave();
  //     }
  //   };
  // }, [id]);

  if (!call) {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push("/");
    }
    return null;
  }

  return (
    <><Stack.Screen
      options={{
        headerShown: true,
        title: "Video Call",
      }} /><StreamCall call={call}>
        <RingingCallContent />
      </StreamCall></>
  );
}
