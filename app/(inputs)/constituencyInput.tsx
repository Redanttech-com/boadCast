import { FontAwesome, Ionicons } from "@expo/vector-icons";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Alert,
  Image,
  useWindowDimensions,
} from "react-native";
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
import { useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { ResizeMode, Video } from "expo-av";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/firebase";
import * as ImagePicker from "expo-image-picker";
import { Avatar } from "react-native-elements";
import { TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

const constituencyInput = () => {
  const [input, setInput] = useState("");
  const { user } = useUser();
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const { width } = useWindowDimensions();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState({ uri: null, type: null });
  const colorScheme = useColorScheme();

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
    await updateDoc(doc(db, "constituency", userData?.constituency, "posts", docRefId), {
      [media.type.toLowerCase()]: downloadUrl,
    });
  };

  const sendPost = async () => {
    setLoading(true);
    if (!input.trim()) {
      Alert.alert("Error", "Post content cannot be empty.");
      return;
    }

    // Ensure user and userData exist
    if (!user || !userData) {
      Alert.alert("Error", "User not authenticated. Please log in again.");
      return;
    }

    const docRef = await addDoc(
      collection(db, "constituency", userData?.constituency, "posts"),
      {
        uid: user?.id,
        text: input.trim(),
        userImg: userData?.userImg || null,
        timestamp: serverTimestamp(),
        lastname: userData?.lastname,
        name: userData?.name,
        nickname: userData?.nickname,
        constituency: userData?.constituency,
        mediaUrl: null,
      }
    );
    if (media.uri) {
      const mediaUrl = await uploadMedia(docRef.id);
      if (mediaUrl) {
        await updateDoc(
          doc(db, "constituency", userData?.constituency, "posts", docRef.id),
          {
            mediaUrl: mediaUrl,
          }
        );
      }
    }

    setInput("");
    setMedia({ uri: null, type: null });
    setLoading(false);
  };

  const getColorFromName = (name) => {
    // Generate a hash number from the name
    let hash = 0;
    for (let i = 0; i < name?.length; i++) {
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
      <View className="w-full  items-center mt-4">
        <View className="flex-row items-center justify-between w-full px-4">
          <Pressable onPress={() => router.push("/(drawer)/(tabs)/constituency")}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
            />
          </Pressable>
          <Text className="font-extrabold text-2xl dark:text-white">
            {userData?.constituency} constituency
          </Text>
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
        </View>
        <View className="w-full items-center mt-4 mb-6">
          <TextInput
            placeholder="What's on your mind?"
            placeholderTextColor={
              colorScheme === "dark" ? "#FFFFFF" : "#808080"
            } // Light gray for light mode, white for dark mode
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
        <View className="flex-row mt-4 justify-center gap-3">
          <Pressable
            onPress={() => pickMedia("Images")}
            className="p-4 rounded-full border-gray-400 border-2"
          >
            <Ionicons
              name="image-outline"
              size={24}
              color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
            />
          </Pressable>
          <Pressable
            onPress={() => pickMedia("Videos")}
            className="p-4 rounded-full border-gray-400 border-2"
          >
            <Ionicons
              name="videocam-outline"
              size={24}
              color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
            />
          </Pressable>

          {loading ? (
            <ActivityIndicator
              size="small"
              color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
            />
          ) : (
            <Pressable
              onPress={sendPost}
              className="w-1/2  ml-auto mr-5 bg-blue-500 p-4 rounded-md"
            >
              <Text className="text-white text-center font-bold">Cast</Text>
            </Pressable>
          )}
        </View>
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
                shouldPlay={!isPaused}
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
                height: width * 0.75, // 4:3 aspect ratio
                borderRadius: 10,
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
    </SafeAreaView>
  );
};

export default constituencyInput;
