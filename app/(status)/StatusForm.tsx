import {
  View,
  Text,
  Pressable,
  Image,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { AntDesign, Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db, storage } from "@/firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import { useUser } from "@clerk/clerk-expo";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { Avatar } from "react-native-elements";
import { ResizeMode, Video } from "expo-av";

const Status = () => {
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [userData, setUserData] = useState(null);
  const { user } = useUser();
  const colorScheme = useColorScheme();
  const [media, setMedia] = useState({ uri: null, type: null });

  const pickMedia = useCallback(async (type) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        type === "Images"
          ? ImagePicker.MediaTypeOptions.Images
          : ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setMedia({ uri: result.assets[0].uri, type });
    }
  }, []);

  const uploadMedia = async (docRefId) => {
    if (!media.uri) return;
    const blob = await (await fetch(media.uri)).blob();
    const mediaRef = ref(storage, `status/${docRefId}/${media.type}`);
    await uploadBytes(mediaRef, blob);
    const downloadUrl = await getDownloadURL(mediaRef);
    await updateDoc(doc(db, "status", docRefId), {
      [media.type.toLowerCase()]: downloadUrl,
    });
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      const q = query(collection(db, "userPosts"), where("uid", "==", user.id));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setUserData(querySnapshot.docs[0].data());
      }
    };
    fetchUserData();
  }, [user]);

  const submit = async () => {
    if (loading || !userData || !user) return;
    setLoading(true);

    try {
      const docRef = await addDoc(collection(db, "status"), {
        uid: user?.id,
        input: input,
        timestamp: serverTimestamp(),
        name: userData?.name,
        userImg: userData?.userImg || null,
        lastname: userData?.lastname,
        nickname: userData?.nickname,
      });

      if (media.uri) await uploadMedia(docRef.id);

      // Reset form
      setImage(null);
      setInput("");

      setLoading(false);
      // router.push("/status");
    } catch (error) {
      console.log("Error submitting form:", error);
      setLoading(false);
    }
  };

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
    <SafeAreaView className="flex-1  w-full bg-white dark:bg-gray-800">
      <StatusBar style="auto" />
      <View className="flex-row items-center justify-between px-3">
        <Pressable onPress={() => router.replace("/(drawer)/(tabs)")}>
          <Feather name="arrow-left" size={28} color="gray" />
        </Pressable>

        <Text className="text-center font-bold text-2xl dark:text-white">
          Add Status
        </Text>
        <View className="border dark:border-gray-300 h-50 w-50 p-1 rounded-full items-center justify-center">
          {userData?.userImg && (
            <Avatar
              size={40}
              rounded
              source={userData?.userImg && { uri: userData?.userImg }}
              title={userData?.name && userData?.name[0].toUpperCase()}
              containerStyle={{
                backgroundColor: getColorFromName(userData?.name),
              }} // Consistent color per user
              avatarStyle={{
                borderRadius: 5, // This affects the actual image
              }}
            />
          )}
        </View>
      </View>

      <View className="gap-5 mt-40 m-6 justify-center">
        <View>
          <Text className="text-gray-600 m-3 dark:text-white">Add status</Text>
          <TextInput
            placeholder="Status...."
            placeholderTextColor={
              colorScheme === "dark" ? "#FFFFFF" : "#808080"
            }
            className="border border-gray-300 rounded-md p-3 dark:text-white"
            value={input}
            onChangeText={setInput}
            multiline
            numberOfLines={3}
          />
        </View>

        <View className="flex-row  justify-center gap-1">
          <Pressable
            onPress={() => pickMedia("Images")}
            className="p-4 rounded-full border-gray-400 border-2 items-center"
          >
            <Ionicons
              name="image-outline"
              size={24}
              color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
            />
          </Pressable>
          <Pressable
            onPress={() => pickMedia("Videos")}
            className="p-4 rounded-full border-gray-400 border-2 items-center"
          >
            <Ionicons
              name="videocam-outline"
              size={24}
              color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
            />
          </Pressable>
        </View>
        <View>
          {media?.uri && (
            <View className="relative mt-4 w-full items-center ">
              {media.type === "video" ? (
                <Video
                  source={{ uri: media.uri }}
                  style={{ width: "100%", height: 300 }}
                  useNativeControls={true}
                  isLooping
                  shouldPlay
                  resizeMode={ResizeMode.CONTAIN}
                />
              ) : (
                <Image
                  source={{ uri: media.uri }}
                  style={{ width: "100%", height: 300 }}
                  resizeMode={ResizeMode.CONTAIN}
                />
              )}

              {/* Remove Media Button */}
              <Pressable
                onPress={() => setMedia(null)}
                className="absolute top-2 right-2 bg-gray-700 p-2 rounded-full"
              >
                <FontAwesome name="times" size={16} color="white" />
              </Pressable>
            </View>
          )}
        </View>
        <Pressable
          onPress={submit}
          className="bg-green-600 p-4 rounded-full mt-2"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-bold">Add</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default Status;
