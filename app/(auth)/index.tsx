import React, { useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import {
  Text,
  View,
  Button,
  Pressable,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
} from "react-native";
import { Link, Redirect, router } from "expo-router";
import { useAuth, useOAuth, useUser } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";

export const useWarmUpBrowser = () => {
  React.useEffect(() => {
    // Warm up the android browser to improve UX
    // https://docs.expo.dev/guides/authentication/#improving-user-experience
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

export default function GooglePage() {
  const { isSignedIn } = useAuth();
  useWarmUpBrowser();

  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const gooleLogin = React.useCallback(async () => {
    try {
      const { createdSessionId, signIn, signUp, setActive } =
        await startOAuthFlow({
          redirectUrl: Linking.createURL("/(user)", { scheme: "myapp" }),
        });

      // If sign in was successful, set the active session
      if (createdSessionId) {
        setActive!({ session: createdSessionId });
      } else {
        // Use signIn or signUp returned from startOAuthFlow
        // for next steps, such as MFA
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
    }
  }, []);

  const { user } = useUser();

  useEffect(() => {
    if (user) {
      const checkUserPosts = async () => {
        const userEmail = user.primaryEmailAddress?.emailAddress;
        if (userEmail) {
          const userQuery = query(
            collection(db, "userPosts"),
            where("email", "==", userEmail)
          );

          const querySnapshot = await getDocs(userQuery);

          if (!querySnapshot.empty) {
            // If email exists, redirect to /home
            router.push("/(drawer)/(tabs)");
          } else {
            // If email does not exist, redirect to /form
            router.push("/(user)");
          }
        }
      };

      checkUserPosts();
    }
  }, [user, db, router]);

  const screenWidth = Math.round(Dimensions.get("window").width);

  return (
    <View className="flex-1 items-center justify-start">
      <StatusBar style="auto" />
      <Image
        source={require("@/assets/images/broad.jpg")}
        resizeMode="cover"
        className="h-96"
        style={{ width: screenWidth }}
      />

      <View className="w-full h-full bg-gray-200 rounded-tl-[90px]  -mt-40 flex items-center justify-start py-4 px-6 space-y-4">
        <Image
          source={require("@/assets/images/broad.jpg")}
          className="w-16 h-16 rounded-full"
          resizeMode="contain"
        />
        <View className="flex-row border border-gray-300 items-center rounded-full px-4 gap-3 py-3 mt-10 ">
          <MaterialIcons name="person" size={24} color="gray" />
          <TextInput
            className="flex-1 text-base text-gray-600 font-semibold -mt-1"
            placeholder="Enter email"
            placeholderTextColor={"gray"}
          />
        </View>
        <View className="flex-row border border-gray-300 items-center rounded-full px-4 gap-3 py-3 mt-10 ">
          <MaterialIcons name="person" size={24} color="gray" />
          <TextInput
            className="flex-1 text-base text-gray-600 font-semibold -mt-1"
            placeholder="Enter firstName"
            placeholderTextColor={"gray"}
          />
        </View>
        <View className="flex-row border border-gray-300 items-center rounded-full px-4 gap-3 py-3 mt-10 ">
          <MaterialIcons name="person" size={24} color="gray" />
          <TextInput
            className="flex-1 text-base text-gray-600 font-semibold -mt-1"
            placeholder="Enter lastName"
            placeholderTextColor={"gray"}
          />
        </View>
        <View className="mt-5 bg-blue-950 p-4 w-full items-center rounded-full">
          <Pressable>
            <Text className="text-white font-bold">Sign In</Text>
          </Pressable>
        </View>

        <View className="mt-10">
          <Text className="text-gray-500">OR</Text>
        </View>

        <View className="flex-row mt-10 gap-6">
          <View>
            <Pressable onPress={gooleLogin}>
              <Image
                source={require("@/assets/images/google.png")}
                className="rounded-full h-20 w-20"
              />
            </Pressable>
          </View>
          <View>
            <Pressable>
              <Image
                source={require("@/assets/images/facebook.png")}
                className="rounded-full h-20 w-20"
              />
            </Pressable>
          </View>
          <View>
            <Pressable>
              <Image
                source={require("@/assets/images/google.png")}
                className="rounded-full h-20 w-20"
              />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
