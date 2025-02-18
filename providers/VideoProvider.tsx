import {
  StreamVideo,
  StreamVideoClient,
} from "@stream-io/video-react-native-sdk";
import { PropsWithChildren, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { StreamChat } from "stream-chat";
import { useUserInfo } from "../components/UserContext";
import { useColorScheme } from "@/hooks/useColorScheme.web";
 


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
  const { userDetails } = useUserInfo();
 const colorScheme = useColorScheme();

  useEffect(() => {
    if (!userDetails) return;

    const initVideoClient = async () => {
      const userDetailsInfo = {
        id: userDetails?.uid,
        name: userDetails?.name,
        image: userDetails?.userImg,
      };

      const token = getDevToken(userDetails?.uid);
      if (!token) {
        console.error("Failed to generate token for user.");
        return;
      }

      const client = new StreamVideoClient({
        apiKey,
        userDetailsInfo,
        token, // ✅ Pass the correct token here
      });

      await client.connectUser(userDetailsInfo, token); // ✅ Connect user before using the client
      setVideoClient(client);
    };

    initVideoClient();

    return () => {
      videoClient?.disconnectUser(); // Cleanup
    };
  }, [userDetails?.uid]);

  if (!videoClient) {
    return (
      <View className="flex-1 justify-center items-center dark:bg-gray-800">
        <ActivityIndicator
          size="large"
          color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
        />
      </View>
    );
  }

  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
}
