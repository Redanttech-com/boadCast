import React, { useEffect, useRef } from "react";
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
  Animated,
} from "react-native";
import { Link, Redirect, router, useRouter } from "expo-router";
import { useAuth, useOAuth, useSignUp, useUser } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase";
import { StatusBar } from "expo-status-bar";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

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
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);

  const { user } = useUser();

  useWarmUpBrowser();

  const { startOAuthFlow: startGoogleOAuth } = useOAuth({
    strategy: "oauth_google",
  });
  const { startOAuthFlow: startFacebookOAuth } = useOAuth({
    strategy: "oauth_facebook",
  });
  const { startOAuthFlow: startAppleOAuth } = useOAuth({
    strategy: "oauth_apple",
  });

  const gooleLogin = React.useCallback(async () => {
    try {
      const { createdSessionId, signIn, signUp, setActive } =
        await startGoogleOAuth({
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

  const facebookLogin = React.useCallback(async () => {
    try {
      const { createdSessionId, signIn, signUp, setActive } =
        await startFacebookOAuth({
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

  const appleLogin = React.useCallback(async () => {
    try {
      const { createdSessionId, signIn, signUp, setActive } =
        await startAppleOAuth({
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

  const onSignUpPress = async () => {
    if (!isLoaded) return;

    // Start sign-up process using email and password provided
    try {
      await signUp.create({
        emailAddress,
        password,
      });

      // Send user an email with verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      // Set 'pendingVerification' to true to display second form
      // and capture OTP code
      setPendingVerification(true);
      router.push("/verify");
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
    }
  };

  useEffect(() => {
    if (user) {
      const checkUserPosts = async () => {
        const userEmail = user.primaryEmailAddress?.emailAddress;
        const emailAddress = user.emailAddresses;
        if (userEmail || emailAddress) {
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

  const scale1 = useRef(new Animated.Value(1)).current;
  const scale2 = useRef(new Animated.Value(1)).current;
  const scale3 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animateCircle = (scale: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 0.5, // Shrinking effect
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animateCircle(scale1, 0);
    animateCircle(scale2, 200);
    animateCircle(scale3, 400);
  }, []);

  const emojiMap = {
    fire: "🔥",
  };

  return (
    <View className="flex-1 m-2 ">
      <StatusBar style="auto" />

      <View className="flex-1 justify-center gap-3 items-center">
        <View className="w-full justify-center mt-16 flex-row items-center relative">
          <Animated.View
            style={{ transform: [{ scale: scale1 }] }}
            className="border-green-600 h-36 w-36 rounded-full border absolute"
          />
          <Animated.View
            style={{ transform: [{ scale: scale2 }] }}
            className="border-gray-900 h-32 w-32 rounded-full border absolute"
          />
          <Animated.View
            style={{ transform: [{ scale: scale3 }] }}
            className="border-red-600 h-28 w-28 rounded-full border absolute"
          />
          <View>
            <Text className="text-base">KENYA</Text>
          </View>
        </View>
        {/*  */}

        <View className="flex-row items-center mt-20">
          <Text className="font-bold text-2xl items-center">
            Sign Up to Broadcast
          </Text>
          <Image
            source={require("@/assets/images/brLogo.jpg")}
            className="h-10 w-10 rounded-full ml-3"
          />
        </View>
        <View className="w-full gap-3">
          <View className="border w-full p-3 rounded-full border-gray-200 flex-row items-center gap-3">
            <Ionicons name="person" size={24} color={"gray"} />
            <TextInput
              autoCapitalize="none"
              value={emailAddress}
              placeholder="Enter email"
              onChangeText={(email) => setEmailAddress(email)}
              className=" flex-1 h-full"
            />
          </View>

          <View className="border w-full p-3 rounded-full border-gray-200 flex-row items-center gap-3">
            <Ionicons name="person" size={24} color={"gray"} />
            <TextInput
              value={password}
              placeholder="Enter password"
              secureTextEntry={true}
              onChangeText={(password) => setPassword(password)}
              className=" flex-1 h-full"
            />
          </View>

          <Pressable
            onPress={onSignUpPress}
            className="bg-slate-900 items-center p-3 rounded-md w-full"
          >
            <Text className="text-white font-bold">Sign Up</Text>
          </Pressable>
        </View>
        <View className="mt-4">
          <Text className="text-gray-500">OR</Text>
        </View>

        <View className="flex-col mt-4 gap-6 w-full">
          <View className="w-full">
            <Pressable
              onPress={gooleLogin}
              className="flex-row items-center gap-2 border border-red-600 justify-center  rounded-full w-full py-4"
            >
              <Image
                source={require("@/assets/images/google.png")}
                className="rounded-full h-8 w-8"
              />
              <Text>Sign in with Google</Text>
            </Pressable>
          </View>
          <View>
            <Pressable
              onPress={facebookLogin}
              className="flex-row items-center gap-2 border border-blue-600 justify-center  rounded-full w-full py-4"
            >
              <Image
                source={require("@/assets/images/fbb.png")}
                className="rounded-full h-8 w-8"
              />
              <Text>Sign in with Facebook</Text>
            </Pressable>
          </View>
          <View>
            <Pressable
              onPress={appleLogin}
              className="flex-row items-center gap-2 border border-gray-500 justify-center  rounded-full w-full py-2"
            >
              <Image
                source={require("@/assets/images/apple.png")}
                className="rounded-full h-12 w-12"
              />
              <Text>Sign in with Apple</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
