import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  ActivityIndicator,
  Pressable,
  Alert,
  useWindowDimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  serverTimestamp,
  where,
  query,
  getDocs,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/firebase";
import { useUser } from "@clerk/clerk-expo";
import * as ImagePicker from "expo-image-picker";
import { Video } from "expo-av";
import { Avatar } from "react-native-elements";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";

const Header = () => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState(null);
  const [userData, setUserData] = useState(null);
  const { user } = useUser();
  const colorScheme = useColorScheme();
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const videoRef = useRef(null);
  const { width } = useWindowDimensions();

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

  const pickMedia = useCallback(async (type) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        type === "image"
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
    if (!media?.uri) return;
    const blob = await (await fetch(media.uri)).blob();
    const mediaRef = ref(storage, `ward/${docRefId}/${media.type}`);
    await uploadBytes(mediaRef, blob);
    const downloadUrl = await getDownloadURL(mediaRef);
    await updateDoc(doc(db, "ward", userData?.ward, "posts", docRefId), {
      [media.type]: downloadUrl,
    });
  };

  const sendPost = async () => {
    if (!input.trim()) {
      Alert.alert("Error", "Post content cannot be empty.");
      return;
    }

    if (!user || !userData) {
      Alert.alert("Error", "User not authenticated. Please log in again.");
      return;
    }

    setLoading(true);

    try {
      const docRef = await addDoc(
        collection(db, "ward", userData?.ward, "posts"),
        {
          uid: user?.id,
          text: input.trim(),
          userImg: userData?.userImg || null,
          timestamp: serverTimestamp(),
          lastname: userData?.lastname,
          name: userData?.name,
          nickname: userData?.nickname,
          ward: userData?.ward,
        }
      );

      if (media) await uploadMedia(docRef.id);

      setInput("");
      setMedia(null);
    } catch (error) {
      console.error("Error sending post:", error);
      Alert.alert("Error", "Failed to send post. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="shadow-md p-4 ">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <Text className="font-extrabold text-2xl dark:text-white">
          {userData?.ward} Ward
        </Text>
        <Avatar
          size={40}
          rounded
          source={userData?.userImg && { uri: userData?.userImg }}
          title={userData?.name && userData?.name[0].toUpperCase()}
        />
      </View>

      {/* Input & Post Button */}
      <View className="w-full flex-row items-center mt-4">
        <TextInput
          placeholder="What's on your mind?"
          placeholderTextColor={colorScheme === "dark" ? "#FFFFFF" : "#808080"}
          value={input}
          onChangeText={setInput}
          multiline
          style={{
            width: "88%",
            padding: 8,
            borderBottomWidth: 1,
            borderBottomColor: "gray",
            color: colorScheme === "dark" ? "#FFFFFF" : "#000000",
          }}
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

      {/* Media Preview */}
      {media?.uri && (
        <View className="relative mt-4 w-full items-center ">
          {media.type === "video" ? (
            <>
              <Pressable onPress={() => setIsPaused((prev) => !prev)}>
                <Video
                  source={{ uri: media.uri }}
                  style={{
                    width: width,
                    height: width * 0.56, // 16:9 aspect ratio
                    borderRadius: 10,
                  }}
                  useNativeControls={false}
                  isLooping
                  shouldPlay={!isPaused}
                  resizeMode="contain"
                  isMuted={isMuted}
                />

                <Pressable
                  onPress={() => setIsMuted(!isMuted)}
                  className="absolute bottom-2 right-2 bg-gray-700 p-2 rounded-full"
                >
                  <FontAwesome name="volume-down" size={24} color="white" />
                </Pressable>
              </Pressable>
            </>
          ) : (
            <Image
              source={{ uri: media.uri }}
              style={{
                width: width,
                height: width * 0.75, // 4:3 aspect ratio
                borderRadius: 10,
              }}
              resizeMode="cover"
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

      {/* Media Picker Buttons */}
      <View className="flex-row mt-4 justify-center gap-3">
        <Pressable onPress={() => pickMedia("image")}>
          <Ionicons
            name="image-outline"
            size={24}
            color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
          />
        </Pressable>
        <Pressable onPress={() => pickMedia("video")}>
          <Ionicons
            name="videocam-outline"
            size={24}
            color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
          />
        </Pressable>
      </View>
    </View>
  );
};

export default Header;
