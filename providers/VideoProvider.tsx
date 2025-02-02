import {
  StreamVideo,
  StreamVideoClient,
} from "@stream-io/video-react-native-sdk";
import { PropsWithChildren, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { StreamChat } from "stream-chat";
import { useUserInfo } from "./UserContext";

const apiKey = process.env.EXPO_PUBLIC_STREAM_API_KEY;
if (!apiKey) {
  throw new Error(
    "EXPO_PUBLIC_STREAM_API_KEY is not set in environment variables."
  );
}

const chatClient = StreamChat.getInstance(apiKey);

const getDevToken = (userId: string | undefined) => {
  if (!userId) {
    console.error("User ID is undefined, cannot generate devToken.");
    return null;
  }
  return chatClient.devToken(userId);
};

export default function VideoProvider({ children }: PropsWithChildren) {
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(
    null
  );
  const { userData } = useUserInfo();

  useEffect(() => {
    if (!userData) return;

    const initVideoClient = async () => {
      const userDataInfo = {
        id: userData.id,
        name: userData.name,
        image: userData.userImg,
      };

      const token = getDevToken(userData.id);
      if (!token) {
        console.error("Failed to generate token for user.");
        return;
      }

      const client = new StreamVideoClient({
        apiKey,
        userDataInfo,
        token, // ✅ Pass the correct token here
      });

      await client.connectUser(userDataInfo, token); // ✅ Connect user before using the client
      setVideoClient(client);
    };

    initVideoClient();

    return () => {
      videoClient?.disconnectUser(); // Cleanup
    };
  }, [userData?.id]);

  if (!videoClient) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" color="red" />
      </View>
    );
  }

  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
}
