import {
  View,
  Text,
  ActivityIndicator,
  Image,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import moment from "moment";
import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window"); // ✅ Get screen size

const MyStatus = () => {
  const { id } = useLocalSearchParams(); // ✅ Get status ID
  const router = useRouter(); // ✅ Handle navigation
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false); // ✅ Track pause state
  const progress = useRef(new Animated.Value(0)).current; // ✅ Progress bar animation
  const animationRef = useRef(null); // ✅ Store animation instance
  const timeoutRef = useRef(null); // ✅ Store timeout instance

  useEffect(() => {
    const fetchUserStatus = async () => {
      if (!id) return; // Ensure ID is present

      try {
        const docRef = doc(db, "status", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setStatus(docSnap.data());
        } else {
          console.warn("⚠️ No status found with this ID:", id);
        }
      } catch (error) {
        console.error("❌ Error fetching status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStatus();
  }, [id]);

  // ✅ Function to start progress animation and timer
  const startAnimation = () => {
    animationRef.current = Animated.timing(progress, {
      toValue: 1,
      duration: 5000, // 5 seconds duration
      useNativeDriver: false,
    });

    animationRef.current.start(() => {
      router.push('/(drawer)/(tabs)'); // Close status when animation completes
    });

    timeoutRef.current = setTimeout(() => {
      router.push('/(drawer)/(tabs)');
    }, 5000); // Auto-close after 5 seconds
  };

  // ✅ Function to pause progress & timer
  const pauseAnimation = () => {
    if (!paused) {
      animationRef.current?.stop();
      clearTimeout(timeoutRef.current);
      setPaused(true);
    }
  };

  // ✅ Function to resume progress & timer
  const resumeAnimation = () => {
    if (paused) {
      setPaused(false);
      const remainingTime = (1 - progress._value) * 5000;

      animationRef.current = Animated.timing(progress, {
        toValue: 1,
        duration: remainingTime,
        useNativeDriver: false,
      });

      animationRef.current.start(() => {
        router.push('/(drawer)/(tabs)');
      });

      timeoutRef.current = setTimeout(() => {
        router.push('/(drawer)/(tabs)');
      }, remainingTime);
    }
  };

  useEffect(() => {
    if (status) {
      startAnimation();
    }
  }, [status]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <ActivityIndicator color="white" />
        <Text className="text-white">Loading...</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback
       onPressIn={pauseAnimation} // ✅ Pause when user touches
       onPressOut={resumeAnimation} // ✅ Resume when user lifts finger
    >
      <SafeAreaView className="flex-1 bg-black">
        <StatusBar style="light" />

        {/* ✅ Progress Bar */}
         <View style={{ height: 5, width: "100%", backgroundColor: "gray" }}>
          <Animated.View
            style={{
              height: "100%",
              backgroundColor: "white",
              width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            }}
          />
        </View> 

        {/* ✅ User Info Bar */}
        <View className="flex-row items-center p-3">
          <MaterialIcons
            name="arrow-back"
            size={28}
            color="white"
            onPress={() => router.push('/(drawer)/(tabs)')}
          />
          <View className="flex-row items-center ml-3">
            <Image
              source={{ uri: status?.userImg }}
              className="h-12 w-12 rounded-full"
            />
            <View className="ml-3">
              <Text className="text-white font-bold">
                {status?.name} {status?.lastname} @{status?.nickname}
              </Text>
              <Text className="text-gray-300 text-sm">
                {status?.timestamp
                  ? moment(status.timestamp.toDate()).fromNow()
                  : "Unknown time"}
              </Text>
            </View>
          </View>
         
        </View>

        {/* ✅ Fullscreen Image */}
        <Image
          source={{ uri: status?.image }}
          style={{ width, height: height * 0.9, resizeMode: "contain" }}
        />

        {/* ✅ Show "Paused" text when paused */}
        {paused && (
          <View className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
            <Text className="text-white text-lg font-bold">Paused</Text>
          </View>
        )}
       {status?.input && (
          <View
            className="absolute bottom-5 w-full px-5 py-3"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.5)", // ✅ Semi-transparent background
              alignItems: "center",
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
            }}
          >
            <Text className="text-white text-lg text-center">
              {status?.input}
            </Text>
          </View>
        )}
        </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default MyStatus;
