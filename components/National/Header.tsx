import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  ActivityIndicator,
  Pressable,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
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
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import { useUserInfo } from "@/providers/UserContext";

const Header = () => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState<{ uri: string; type: string }[]>([]); // Array for multiple images/videos
  const [activeTab, setActiveTab] = useState("county");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState("");

  const { userData } = useUserInfo();

  const confirmPost = (level: string) => {
    setSelectedLevel(level);
    setModalVisible(true);
  };

  const handleConfirm = () => {
    setActiveTab(selectedLevel);
    setModalVisible(false);
  };

  // 📌 Pick multiple images or videos
  const pickMedia = useCallback(async (type: "Images" | "Videos") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        type === "Images"
          ? ImagePicker.MediaTypeOptions.Images
          : ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: true, // ✅ Allow selecting multiple media
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      const selectedMedia = result.assets.map((asset) => ({
        uri: asset.uri,
        type,
      }));
      setMedia((prevMedia) => [...prevMedia, ...selectedMedia]); // ✅ Append new selections
    }
  }, []);

  // 📌 Upload multiple images/videos to Firebase Storage
  const uploadMedia = async (docRefId: string) => {
    if (media.length === 0) return;

    const uploadPromises = media.map(async (item, index) => {
      const blob = await (await fetch(item.uri)).blob();
      const mediaRef = ref(storage, `posts/${docRefId}/${item.type}_${index}`);
      await uploadBytes(mediaRef, blob);
      return getDownloadURL(mediaRef);
    });

    const mediaUrls = await Promise.all(uploadPromises);

    // ✅ Update Firestore with media URLs
    await updateDoc(doc(db, "posts", docRefId), { media: mediaUrls });
  };

  // 📌 Send post to Firebase
  const sendPost = async () => {
    if (!input.trim() || loading) {
      Alert.alert("Error", "Post content cannot be empty.");
      return;
    }

    if (!userData) {
      Alert.alert("Error", "User not authenticated. Please log in again.");
      return;
    }

    setLoading(true);

    try {
      // ✅ Create a new post document in Firestore
      const docRef = await addDoc(collection(db, "posts"), {
        id: userData?.id,
        text: input.trim(),
        userImg: userData.userImg || "",
        timestamp: serverTimestamp(),
        lastname: userData.lastname || "",
        name: userData.name || "",
        nickname: userData.nickname || "",
        county: userData.county || "",
        constituency: userData.constituency || "",
        ward: userData.ward || "",
      });

      // ✅ Upload multiple media files
      if (media.length > 0) {
        await uploadMedia(docRef.id);
      }

      setInput("");
      setMedia([]); // ✅ Reset media state
    } catch (error) {
      console.error("Error sending post:", error);
      Alert.alert("Error", "Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="shadow-md p-4">
      <StatusBar style="auto" />
      <View className="flex-row items-center justify-between">
        <Text className="font-extrabold text-3xl">National</Text>
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

      {/* ✅ Show selected media in a scrollable list */}
      {media.length > 0 && (
        <ScrollView horizontal className="mt-4 flex-row">
          {media.map((item, index) => (
            <Image
              key={index}
              source={{ uri: item.uri }}
              className="h-40 w-40 mr-2 rounded-lg"
            />
          ))}
        </ScrollView>
      )}

      <View className="flex-row mt-4 justify-between items-center">
        {/* ✅ Pick multiple images/videos */}
        <Pressable onPress={() => pickMedia("Images")}>
          <Ionicons name="image-outline" size={24} color="black" />
        </Pressable>
        <Pressable onPress={() => pickMedia("Videos")}>
          <Ionicons name="videocam-outline" size={24} color="black" />
        </Pressable>

        <View className="flex-row justify-between gap-2">
          <Pressable
            onPress={() => confirmPost("county")}
            className="px-4 py-1 rounded-full bg-gray-200"
          >
            <Text
              className={`font-bold ${
                activeTab === "county" ? "text-blue-500" : "text-black"
              }`}
            >
              County
            </Text>
          </Pressable>
          <Pressable
            onPress={() => confirmPost("constituency")}
            className="px-4 py-1 rounded-full bg-gray-200"
          >
            <Text
              className={`font-bold ${
                activeTab === "constituency" ? "text-blue-500" : "text-black"
              }`}
            >
              Constituency
            </Text>
          </Pressable>
          <Pressable
            onPress={() => confirmPost("ward")}
            className="px-4 py-1 rounded-full bg-gray-200"
          >
            <Text
              className={`font-bold ${
                activeTab === "ward" ? "text-blue-500" : "text-black"
              }`}
            >
              Ward
            </Text>
          </Pressable>
        </View>

        {/* Modal for confirming post level */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View className="flex-1 justify-center items-center bg-black/50">
            <View className="bg-white p-6 rounded-lg w-80 shadow-lg">
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
                  <Text className="text-center text-white font-semibold">
                    Confirm
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
};

export default Header;
