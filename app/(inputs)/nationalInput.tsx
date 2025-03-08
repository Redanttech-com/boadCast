import {
  View,
  Text,
  Pressable,
  TextInput,
  Alert,
  useWindowDimensions,
  Modal,
  Image,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db, storage } from "@/firebase";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { useUser } from "@clerk/clerk-expo";
import { ResizeMode, Video } from "expo-av";
import { ActivityIndicator } from "react-native";
import Status from "../(status)/StatusForm";
import { StatusBar } from "expo-status-bar";
import { Avatar } from "react-native-elements";
import { router } from "expo-router";

export default function nationalInput() {
  const [media, setMedia] = useState({ uri: null, type: null });
  const colorScheme = useColorScheme();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [userData, setUserData] = useState(null);
  const [isModalVisible, setISModalVisible] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const { width } = useWindowDimensions();
  const { user } = useUser();

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

  const uploadMedia = async (docRefId) => {
    if (!media.uri) return;
    const blob = await (await fetch(media.uri)).blob();
    const mediaRef = ref(storage, `national/${docRefId}/${media.type}`);
    await uploadBytes(mediaRef, blob);
    const downloadUrl = await getDownloadURL(mediaRef);
    await updateDoc(doc(db, "national", docRefId), {
      [media.type.toLowerCase()]: downloadUrl,
    });
  };

  const handleConfirm = () => {
    if (selectedLevel === "county") sendPost("county");
    else if (selectedLevel === "constituency") sendPost("constituency");
    else if (selectedLevel === "ward") sendPost("ward");
    setModalVisible(false);
  };

  const sendPost = async (level) => {
    if (!input.trim() || loading) {
      Alert.alert("Error", "Post content cannot be empty.");
      return;
    }
    if (!userData) {
      Alert.alert("Error", "User data is still loading. Please try again.");
      return;
    }
    setLoading(true);
    try {
      const docRef = await addDoc(
        collection(db, level, userData[level], "posts"),
        {
          uid: userData?.uid,
          text: input.trim(),
          userImg: userData?.userImg || null,
          timestamp: serverTimestamp(),
          lastname: userData?.lastname,
          name: userData?.name,
          nickname: userData?.nickname,
        }
      );
      if (media.uri) await uploadMedia(docRef.id);
      setInput("");
      setMedia({ uri: null, type: null });
    } catch (error) {
      Alert.alert("Error", "Failed to send post. Try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
      router.push("/(drawer)/(tabs)");

  };
  const sendNational = async () => {
    setLoading(true);
    if (!input.trim()) {
      Alert.alert("Error", "Post content cannot be empty.");
      return;
    }
    if (!userData) {
      Alert.alert("Error", "User data is still loading. Please try again.");
      return;
    }

    const docRef = await addDoc(collection(db, "national"), {
      uid: userData?.uid,
      text: input.trim(),
      userImg: userData?.userImg || null,
      timestamp: serverTimestamp(),
      lastname: userData?.lastname,
      name: userData?.name,
      nickname: userData?.nickname,
    });
    if (media.uri) await uploadMedia(docRef.id);
    setInput("");
    setMedia({ uri: null, type: null });

    setLoading(false);
      router.push("/(drawer)/(tabs)");

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
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-800">
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <View className="flex-row items-center p-4 gap-5">
        <Avatar
          size={40}
          source={userData?.userImg && { uri: userData?.userImg }}
          title={userData?.name && userData?.name[0].toUpperCase()}
          containerStyle={{
            backgroundColor: getColorFromName(userData?.name),
            borderRadius: 5,
          }} // Consistent color per user
          avatarStyle={{
            borderRadius: 5, // This affects the actual image
          }}
        />
        <View className="gap-2  flex-row items-start">
          <Text className="font-bold dark:text-white">{userData?.name}</Text>
          <Text className="font-bold dark:text-white">
            {userData?.lastname}
          </Text>
          <Text className="font-bold text-gray-400">@{userData?.nickname}</Text>
        </View>
      </View>

      <View className="w-full items-center mt-4 mb-6">
        <TextInput
          placeholder="What's on your mind?"
          placeholderTextColor={colorScheme === "dark" ? "#FFFFFF" : "#808080"} // Light gray for light mode, white for dark mode
          value={input}
          onChangeText={setInput}
          multiline
          numberOfLines={3}
          style={{
            width: "88%",
            padding: 8,
            borderBottomWidth: 1,
            borderBottomColor: "gray",
            color: colorScheme === "dark" ? "#FFFFFF" : "#000000", // Text color
          }}
        />
      </View>
      {loading ? (
        <ActivityIndicator size="small" color="blue" />
      ) : (
        <Pressable
          onPress={sendNational}
          className="w-1/2  ml-auto mr-5 bg-blue-500 p-4 rounded-md"
        >
          <Text className="text-white text-center font-bold">Cast</Text>
        </Pressable>
      )}

      <View className="flex-row mt-4 gap-1  justify-between w-full items-center">
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

        {["county", "constituency", "ward"].map((level) => (
          <Pressable
            key={level}
            onPress={() => {
              setSelectedLevel(level);
              setModalVisible(true);
            }}
            className="px-2 py-4 rounded-full bg-gray-200"
          >
            <Text
              className={`font-bold ${
                selectedLevel === level ? "text-blue-500" : "text-black"
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>
      {media?.uri && (
        <View className="relative mt-4 w-full items-center ">
          {media.type === "video" ? (
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
                shouldPlay={true}
                resizeMode={ResizeMode.CONTAIN}
                isMuted={isMuted}
              />

              <Pressable
                onPress={() => setIsMuted(!isMuted)}
                className="absolute bottom-2 right-2 bg-gray-700 p-2 rounded-full"
              >
                <FontAwesome name="volume-down" size={24} color="white" />
              </Pressable>
            </Pressable>
          ) : (
            <Image
              source={{ uri: media.uri }}
              style={{
                width: width,
                height: 400, // 4:3 aspect ratio
              }}
              resizeMode={ResizeMode.COVER}
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
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-4">
          <View className="bg-white p-6 rounded-lg w-11/12 max-w-sm shadow-lg">
            <Text className="text-xl font-bold text-gray-800 text-center">
              Confirm Post
            </Text>
            <Text className="text-gray-600 text-center mt-2">
              Are you sure you want to post in your {selectedLevel}?
            </Text>
            <View className="flex-row justify-between mt-6">
              <Pressable
                onPress={() => setModalVisible(false)}
                className="flex-1 bg-gray-300 py-2 rounded-lg mr-2"
              >
                <Text className="text-center text-gray-800 font-semibold">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleConfirm}
                className="flex-1 bg-blue-500 py-2 rounded-lg ml-2"
              >
                <Text className="text-center text-white font-semibold ">
                  Confirm
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
