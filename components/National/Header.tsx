import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  ActivityIndicator,
  Pressable,
  Alert,
  Dimensions,
  Modal,
  Platform,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  addDoc,
  collection,
  updateDoc,
  serverTimestamp,
  query,
  getDocs,
  where,
  doc,
} from "firebase/firestore";
import { useColorScheme } from "@/hooks/useColorScheme";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/firebase";
import { useUser } from "@clerk/clerk-expo";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { Video } from "expo-av";
import StatusPost from "@/app/(status)/StatusPost";
import StatusFeed from "@/app/(status)/StatusFeed";
import { Avatar } from "react-native-elements";

const Header = () => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState({ uri: null, type: null });
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState("");
  const { user } = useUser();
  const [userData, setUserData] = useState(null);
  const colorScheme = useColorScheme();
  const [isModalVisible, setISModalVisible] = useState(true);

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
          userImg: userData?.userImg,
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
  };
  const sendNational = async () => {
    if (!input.trim()) {
      Alert.alert("Error", "Post content cannot be empty.");
      return;
    }
    if (!userData) {
      Alert.alert("Error", "User data is still loading. Please try again.");
      return;
    }
    setLoading(true);
    try {
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
    } catch (error) {
      Alert.alert("Error", "Failed to send post. Try again.");
      console.error(error);
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
    <View className="shadow-md p-2  dark:bg-gray-800">
      <View className="flex-row items-center justify-between">
        <Text className="font-extrabold text-3xl dark:text-white">
          National
        </Text>
        <Avatar
          size={40}
          rounded
          source={userData?.userImg && { uri: userData?.userImg }}
          title={userData?.name && userData?.name[0].toUpperCase()}
          containerStyle={{ backgroundColor: getColorFromName(userData?.name) }} // Consistent color per user
        />
      </View>
      <View className="mt-3 mb-3 h-15">
        <StatusFeed />
      </View>

      <View className="w-full flex-row items-center mt-2">
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
        {loading ? (
          <ActivityIndicator size="small" color="#0000ff" />
        ) : (
          <Pressable
            onPress={sendNational}
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
            style={{ width: "100%", height: 400, borderRadius: 10 }}
            resizeMode="contain"
          />
        ))}

      <View className="flex-row mt-4 gap-2 justify-between w-full items-center">
        <View className="flex-row  justify-center gap-3">
          <Pressable onPress={() => pickMedia("Images")}>
            <Ionicons
              name="image-outline"
              size={24}
              color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
            />
          </Pressable>

          <Pressable onPress={() => pickMedia("Videos")}>
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
            className="px-4 py-1 rounded-full bg-gray-200"
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
    </View>
  );
};

export default Header;
