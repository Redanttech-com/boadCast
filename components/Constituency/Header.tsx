import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import EvilIcons from "@expo/vector-icons/EvilIcons";
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/firebase";
import { useUser } from "@clerk/clerk-expo";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useUserInfo } from "@/providers/UserContext";
import * as ImagePicker from "expo-image-picker";

const Header = () => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState({ uri: null, type: null });

  const { user } = useUser();
  const { userData } = useUserInfo();

  const pickMedia = useCallback(async (type: "Images" | "Videos") => {
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

  const uploadMedia = async (docRefId: string) => {
    if (!media.uri) return;

    const blob = await (await fetch(media.uri)).blob();
    const mediaRef = ref(storage, `constituency/${docRefId}/${media.type}`);
    await uploadBytes(mediaRef, blob);

    const downloadUrl = await getDownloadURL(mediaRef);
    await updateDoc(doc(db, "constituency", userData.constituency, docRefId), {
      [media.type.toLowerCase()]: downloadUrl,
    });
  };

  const sendPost = async () => {
    if (!input.trim() || loading) {
      Alert.alert("Error", "Post content cannot be empty.");
      return;
    }

    // Ensure user and userData exist
    if (!user || !userData) {
      Alert.alert("Error", "User not authenticated. Please log in again.");
      return;
    }

    setLoading(true);

    try {
      const docRef = await addDoc(collection(db, "constituency", userData.constituency), {
        id: user.id,
        text: input.trim(),
        userImg: userData.userImg,
        timestamp: serverTimestamp(),
        lastname: userData.lastname,
        name: userData.name,
        nickname: userData.nickname,
        constituency: userData.constituency,
      });

      if (media.uri) await uploadMedia(docRef.id);

      setInput("");
      setMedia({ uri: null, type: null });
    } catch (error) {
      console.error("Error sending post:", error);
      Alert.alert("Error", "Failed to send post. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="shadow-md p-4">
      <View className="flex-row items-center justify-between">
        <Text className="font-extrabold text-2xl">
          {userData?.constituency} 
        </Text>
        <Image
          source={{ uri: userData?.userImg }}
          className="h-12 w-12 rounded-full"
        />
      </View>

      <View className="flex-row items-center mt-4">
        <TextInput
          placeholder="What's on your mind?"
          value={input}
          onChangeText={setInput}
          className="flex-1 border-b border-gray-300 p-2"
        />
        {loading ? (
          <ActivityIndicator size="small" color="blue" />
        ) : (
          <Pressable
            onPress={sendPost}
            className="ml-2 bg-blue-500 p-2 rounded-full"
          >
            <Text className="text-white">Cast</Text>
          </Pressable>
        )}
      </View>

      {media.uri && (
        <Image
          source={{ uri: media.uri }}
          className="h-40 w-full mt-4 rounded-lg"
        />
      )}

      <View className="flex-row mt-4 justify-center gap-3">
        <Pressable onPress={() => pickMedia("Images")}>
          <Ionicons name="image-outline" size={24} color="black" />
        </Pressable>
        <Pressable onPress={() => pickMedia("Videos")}>
          <Ionicons name="videocam-outline" size={24} color="black" />
        </Pressable>
      </View>
    </View>
  );
};

export default Header;
