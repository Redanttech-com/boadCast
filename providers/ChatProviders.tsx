import { PropsWithChildren, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { StreamChat } from "stream-chat";
import { Chat, OverlayProvider } from "stream-chat-expo";
import { useUser } from "@clerk/clerk-expo";
import { useUserInfo } from "@/components/UserContext";

const client = StreamChat.getInstance(process.env.EXPO_PUBLIC_STREAM_API_KEY!);

// Function to get devToken
export const getDevToken = (userId: string | undefined) => {
  if (!userId) {
    console.error("User ID is undefined, cannot generate devToken.");
    return null;
  }
  return client.devToken(userId);
};

export default function ChatProvider({ children }: PropsWithChildren) {
  const [isReady, setIsReady] = useState(false);
  const { user } = useUser();
  const { userDetails } = useUserInfo();

  useEffect(() => {
    const connectUser = async () => {
      if (!userDetails?.uid) return;

      try {
        const devToken = getDevToken(userDetails?.uid); // Get token from function
        // console.log("Dev Token:", devToken); // Log token

        if (!devToken) throw new Error("Failed to generate devToken");

        await client.connectUser(
          {
            id: userDetails?.uid,
            name: userDetails?.name,
            image: userDetails?.userImg,
          },
          devToken
        );

        setIsReady(true);
      } catch (error) {
        console.error("Error connecting user:", error);
      }
    };

    connectUser();

    return () => {
      client.disconnectUser();
      setIsReady(false);
    };
  }, [userDetails]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" color="red" />
      </View>
    );
  }

  return (
    <OverlayProvider>
      <Chat client={client}>{children}</Chat>
    </OverlayProvider>
  );
}
