import { useFonts } from "expo-font";
import { Slot, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import { useColorScheme } from "@/hooks/useColorScheme";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ClerkProvider, ClerkLoaded } from "@clerk/clerk-expo";
import UserContextData from "@/components/UserContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/global.css";
import { tokenCache } from "@/cache";
import { RecoilRoot } from "recoil";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// export const unstable_setting = {
//   initialRouteName: "(drawer)",
// };

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

  if (!publishableKey) {
    throw new Error("Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your .env file");
  }

  const InitialLayout = () => {
    return <Slot />;
  };

  const queryClient = new QueryClient();

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        <RecoilRoot>
          <GestureHandlerRootView>
            <UserContextData>
              <QueryClientProvider client={queryClient}>
                <InitialLayout />
              </QueryClientProvider>
            </UserContextData>
          </GestureHandlerRootView>
        </RecoilRoot>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
