import { View, Text, TextInput, Pressable } from "react-native";
import React from "react";
import { router } from "expo-router";
import { useSignUp } from "@clerk/clerk-expo";
import { useColorScheme } from "@/hooks/useColorScheme.web";

const verify = () => {
  const [code, setCode] = React.useState("");
  const { isLoaded, signUp, setActive } = useSignUp();
  const colorScheme = useColorScheme();

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return;

    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      // If verification was completed, set the session to active
      // and redirect the user
      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.push("/(user)");
      } else {
        // If the status is not complete, check why. User may need to
        // complete further steps.
        console.error(JSON.stringify(signUpAttempt, null, 2));
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
    }
  };

  return (
    <View className="flex-1  justify-center gap-3 m-3 dark:bg-gray-800">
      <Text className="font-extrabold flex-row  text-center text-2xl dark:text-white">
        Verify your email
      </Text>
      <View className="border p-3 rounded-full border-gray-200">
        <TextInput
          value={code}
          placeholder="Enter your verification code"
          placeholderTextColor={colorScheme === "dark" ? "#FFFFFF" : "#808080"} // Light gray for light mode, white for dark mode
          className="flex-1 text-base dark:text-white"
          onChangeText={(code) => setCode(code)}
        />
      </View>

      <Pressable
        onPress={onVerifyPress}
        className="w-full bg-slate-900 p-3 items-center rounded-md dark:bg-slate-700"
      >
        <Text className="text-white">Verify</Text>
      </Pressable>
    </View>
  );
};

export default verify;
