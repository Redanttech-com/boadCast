import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  Image,
  Animated,
} from "react-native";
import { Video } from "expo-av";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Avatar } from "react-native-elements";
import { router, useLocalSearchParams } from "expo-router";
import { db, storage } from "@/firebase";

export default function StatusPage() {
  const { id } = useLocalSearchParams();
  const [statuses, setStatuses] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const progress = useRef(new Animated.Value(0)).current;
  const videoRef = useRef(null);
  const [userData, setUserData] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) return;
      const q = query(collection(db, "userPosts"), where("uid", "==", id));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setUserData(querySnapshot.docs[0].data());
      }
    };
    fetchUserData();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const q = query(collection(db, "status"), where("uid", "==", id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const statusList = snapshot.docs.map((doc) => ({
        docId: doc.id,
        ...doc.data(),
      }));
      setStatuses(statusList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (!statuses.length || loading) return;

    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 100,
      duration: statuses[currentIndex]?.videos ? 10000 : 5000, // 10 sec for video, 5 sec for image
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) handleNext();
    });
  }, [statuses, currentIndex, loading]);

  const handleNext = () => {
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      router.push("/(drawer)/(tabs)");
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const getColorFromName = (name) => {
    if (!name) return "#ccc"; // Default color if no name exists

    // Generate a hash number from the name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Predefined colors for better visuals
    const colors = [
      "#FF5733",
      "#33FF57",
      "#3357FF",
      "#F1C40F",
      "#8E44AD",
      "#E74C3C",
      "#2ECC71",
      "#1ABC9C",
      "#3498DB",
    ];

    // Pick a color consistently based on the hash value
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <SafeAreaView className="dark:bg-gray-800 flex-1">
      <StatusBar style="auto" />
      <View className="flex-row items-center gap-1 p-2 dark:bg-gray-800">
        <Avatar
          size={40}
          rounded
          source={userData?.userImg ? { uri: userData?.userImg } : null}
          title={userData?.name && userData?.name[0].toUpperCase()}
          containerStyle={{ backgroundColor: getColorFromName(userData?.name) }} // Consistent color per user
        />
        <View className="flex-row gap-2 items-center ">
          <Text
            className="text-md max-w-20 min-w-12 font-bold dark:text-white  "
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {userData?.name}
          </Text>

          <Text
            className="text-md max-w-20 min-w-12 font-bold text-gray-400 dark:text-white"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {userData?.lastname}
          </Text>

          <Text
            className="text-md max-w-20 min-w-12 text-gray-400 dark:text-white "
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            @{userData?.nickname}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={{ height: 2, backgroundColor: "#ccc", marginTop: 10 }}>
        <Animated.View
          style={{
            height: 2,
            backgroundColor: "#3498DB",
            width: progress.interpolate({
              inputRange: [0, 100],
              outputRange: ["0%", "100%"],
            }),
          }}
        />
      </View>

      <View>
        {statuses[currentIndex]?.videos && (
          <Video
            ref={videoRef}
            source={{ uri: statuses[currentIndex].videos }}
            style={{ width: "100%", height: 600 }}
            useNativeControls
            resizeMode="cover"
            onPlaybackStatusUpdate={(status) => {
              if (status.didJustFinish) handleNext();
            }}
          />
        )}

        {statuses[currentIndex]?.images && (
          <Image
            source={{ uri: statuses[currentIndex].images }}
            style={{ width: "100%", height: 700 }}
          />
        )}
      </View>

      <View>
        {statuses[currentIndex]?.input && (
          <Text className="h-12 bottom-0 sticky dark:text-white m-4">
            {statuses[currentIndex]?.input}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}
