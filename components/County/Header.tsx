import React, { useState, useCallback, useEffect } from "react";
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
  where,
  query,
  getDocs,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/firebase";
import { useUser } from "@clerk/clerk-expo";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useUserInfo } from "@/components/UserContext";
import * as ImagePicker from "expo-image-picker";
import { Video } from "expo-av";
import { Avatar } from "react-native-elements";

const Header = () => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState({ uri: null, type: null });
  const [userData, setUserData] = useState(null);
  const { user } = useUser();

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
    const mediaRef = ref(storage, `county/${docRefId}/${media.type}`);
    await uploadBytes(mediaRef, blob);

    const downloadUrl = await getDownloadURL(mediaRef);
    await updateDoc(
      doc(db, "county", userData.county, "posts", docRefId),
      {
        [media.type.toLowerCase()]: downloadUrl,
      }
    );
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
      const docRef = await addDoc(
        collection(db, "county", userData?.county, "posts"),
        {
          uid: user?.id,
          text: input.trim(),
          userImg: userData?.userImg,
          timestamp: serverTimestamp(),
          lastname: userData?.lastname,
          name: userData?.name,
          nickname: userData?.nickname,
          county: userData?.county,
        }
      );

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
    <View className="shadow-md p-4">
      <View className="flex-row items-center justify-between">
        <Text className="font-extrabold text-2xl">
          {userData?.county} County
        </Text>
        <Avatar
          size={40}
          rounded
          source={userData?.userImg ? { uri: userData?.userImg } : null}
          title={userData?.name ? userData?.name[0].toUpperCase() : "?"}
          containerStyle={{ backgroundColor: getColorFromName(userData?.name) }} // Consistent color per user
        />
      </View>

      <View className="flex-row items-center mt-4">
        <TextInput
          placeholder="What's on your mind?"
          value={input}
          onChangeText={setInput}
          multiline
          numberOfLines={3}
          style={{
            width: "88%",
            padding: 8,
            borderBottomWidth: 1,
            borderBottomColor: "gray",
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
      {media?.uri &&
        (media.type === "video" ? (
          <Video
            source={{ uri: media.uri }}
            style={{ width: "100%", height: 200, borderRadius: 10 }}
            useNativeControls
            shouldPlay
            isLooping
            resizeMode="contain"
          />
        ) : (
          <Image
            source={{ uri: media.uri }}
            className="w-full h-96 rounded-md"
            resizeMode="cover"
          />
        ))}

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
