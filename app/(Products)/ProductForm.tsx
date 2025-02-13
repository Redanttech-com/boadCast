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
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { useUser } from "@clerk/clerk-expo";

const ProductForm = () => {
  const [selectData, setSelectData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cost, setCost] = useState("");
  const [productname, setProductName] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [userData, setUserData] = useState(null);
  const colorScheme = useColorScheme();
  const { user } = useUser();


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

  const data = [
    { label: "Electronics", value: "Electronics" },
    { label: "Vehicles & Trucks", value: "Vehicles" },
    { label: "Machineries", value: "Machineries" },
    { label: "Buildings & Land", value: "Buildings" },
    { label: "Fashion", value: "Fashion" },
    { label: "Phones & Tablets", value: "Phones" },
    { label: "Agricultural", value: "Agricultural" },
    { label: "Sports", value: "Sports" },
  ];

  const renderDropdownItem = (item) => (
    <View style={{ padding: 12, flexDirection: "row", alignItems: "center" }}>
      <Text>{item.label}</Text>
      <AntDesign
        color={item.value === selectData ? "blue" : "black"}
        name="Safety"
        size={20}
      />
    </View>
  );

  const submit = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const docRef = await addDoc(collection(db, "market"), {
        uid: user?.id,
        email: userData?.email,
        productname: productname,
        cost: cost,
        timestamp: serverTimestamp(),
        name: userData?.name,
        userImg: userData?.userImg || null,
        lastname: userData?.lastname,
        nickname: userData?.nickname,
        category: selectData,
        description: description,
      });

      const uploadImage = async (imageUri, docRef) => {
        try {
          if (!imageUri) return;

          const response = await fetch(imageUri);
          const blob = await response.blob();

          const imageRef = ref(storage, `market/${docRef?.id}/image`);
          await uploadBytes(imageRef, blob);

          const downloadUrl = await getDownloadURL(imageRef);
          await updateDoc(doc(db, "market", docRef.id), {
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
      setProductName("");
      setCost("");
      setSelectData(null);
      setDescription("");

      setLoading(false);
      router.push("/market");
    } catch (error) {
      console.log("Error submitting form:", error);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-800">
      <StatusBar style="auto" />
      <View className="flex-row items-center justify-between px-3">
        <Pressable onPress={() => router.replace("/(drawer)/market")}>
          <Feather name="arrow-left" size={28} color="gray" />
        </Pressable>

        <Text className="text-center font-bold text-2xl dark:text-white">
          ProductForm
        </Text>
        <View className="border p-1 rounded-full">
          {userData?.userImg && (
            <Image
              source={{ uri: userData?.userImg }}
              className="h-10 w-10 rounded-full"
            />
          )}
        </View>
      </View>
      <ScrollView>
        <View className="gap-5 m-3">
          <View>
            <Text className="text-gray-600 m-3 dark:text-white">
              Product Name
            </Text>
            <TextInput
              placeholder="Product Name"
              className="border border-gray-300 rounded-md p-3 outline-none dark:text-white"
              placeholderTextColor={
                colorScheme === "dark" ? "#FFFFFF" : "#808080"
              } // Light gray for light mode, white for dark mode
              value={productname}
              onChangeText={setProductName}
            />
          </View>
          <View>
            <Text className="text-gray-600 m-3 dark:text-white">Cost</Text>
            <TextInput
              placeholder="Cost"
              placeholderTextColor={
                colorScheme === "dark" ? "#FFFFFF" : "#808080"
              } // Light gray for light mode, white for dark mode
              className="border border-gray-300 rounded-md p-3 dark:text-white"
              keyboardType="numeric"
              inputMode="numeric"
              value={cost}
              onChangeText={setCost}
            />
          </View>
          <View>
            <Text className="text-gray-600 m-3 dark:text-white">
              Description
            </Text>
            <TextInput
              placeholder="Description"
              placeholderTextColor={
                colorScheme === "dark" ? "#FFFFFF" : "#808080"
              } // Light gray for light mode, white for dark mode
              className="border border-gray-300 rounded-md p-3 dark:text-white"
              multiline
              value={description}
              onChangeText={setDescription}
            />
          </View>
          <View>
            <Text className="text-gray-600 m-3 dark:text-white">Category</Text>
            <Dropdown
              style={{
                margin: 8,
                height: 50,
                backgroundColor: "white",
                borderRadius: 8,
                paddingHorizontal: 12,
                borderColor: "#ddd",
                borderWidth: 1,
              }}
              data={data}
              labelField="label"
              valueField="value"
              placeholder="Select Category"
              value={selectData}
              onChange={(item) => setSelectData(item.value)}
              renderItem={renderDropdownItem}
            />
          </View>
          <View>
            <Pressable
              onPress={pickImage}
              className=" bg-blue-950 rounded-full p-4 dark:bg-blue-600"
            >
              <Text className="text-white text-center">Choose Image</Text>
            </Pressable>
            {image && (
              <View className=" items-center">
                <Image
                  source={{ uri: image }}
                  style={{ width: 400, height: 400, borderRadius: 10 }}
                  resizeMode="contain"
                />
              </View>
            )}
          </View>
          <Pressable
            onPress={submit}
            className="bg-green-600 p-4 rounded-full mb-2"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-bold">Submit</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProductForm;
