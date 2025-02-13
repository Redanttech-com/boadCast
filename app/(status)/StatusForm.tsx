import {
  View,
  Text,
  Pressable,
  Image,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { AntDesign, Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useUserInfo } from "@/components/UserContext";
import { Dropdown } from "react-native-element-dropdown";
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

const Status = () => {

  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [input, setInput] = useState("");

  const [userData, setUserData] = useState(null);
  const { user } = useUser();
   const colorScheme = useColorScheme();
    
  

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      console.log("Selected Image URI:", result.assets[0].uri); // Debugging
      setImage(result.assets[0].uri);
    }
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

      const uploadImage = async (imageUri, docRef) => {
        try {
          if (!imageUri) return;

          const response = await fetch(imageUri);
          const blob = await response.blob();

          const imageRef = ref(storage, `status/${docRef?.id}/image`);
          await uploadBytes(imageRef, blob);

          const downloadUrl = await getDownloadURL(imageRef);
          await updateDoc(doc(db, "status", docRef.id), {
            image: downloadUrl,
          });

          console.log("Image uploaded successfully!");
        } catch (error) {
          console.error("Error uploading image:", error);
        }
      };

      if (image) {
        await uploadImage(image, docRef);
      }

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
        <View className="border h-10 w-10 p-1 rounded-full">
          {userData?.userImg && (
            <Avatar
              size={40}
              rounded
              source={userData?.userImg && { uri: userData?.userImg }}
              title={userData?.name && userData?.name[0].toUpperCase()}
              containerStyle={{
                backgroundColor: getColorFromName(userData?.name),
              }} // Consistent color per user
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

        <View>
          <Pressable
            onPress={pickImage}
            className=" bg-blue-950 rounded-full p-4 dark:bg-blue-700"
          >
            <Text className="text-white text-center">Choose Image</Text>
          </Pressable>
          {image && (
            <View className="mt-2 items-center">
              <Image
                source={{ uri: image }}
                style={{width: '100%', height: 300}}
                resizeMode="contain"
              />
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
