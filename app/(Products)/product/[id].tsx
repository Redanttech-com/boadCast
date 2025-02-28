import {
  View,
  Text,
  Image,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { db, storage } from "@/firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { SafeAreaView } from "react-native-safe-area-context";
import { AntDesign, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import moment from "moment";
import { useUserInfo } from "@/components/UserContext";
import { useUser } from "@clerk/clerk-expo";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { deleteObject, ref } from "firebase/storage";

export default function ProductDetail() {
  const { id } = useLocalSearchParams(); // ✅ Get the correct ID
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const { userDetails, formatNumber } = useUserInfo();
  const [likes, setLikes] = useState([]);
  const [hasLiked, setHasLiked] = useState(false);
  const { user } = useUser();
  const colorScheme = useColorScheme();

  // ✅ Fetch Product Data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) return; // Ensure ID is present

      try {
        const docRef = doc(db, "market", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProduct(docSnap.data());
        } else {
          console.warn("⚠️ No product found with this ID:", id);
        }
      } catch (error) {
        console.error("❌ Error fetching product:", error);
      }
    };
    setLoading(false);

    fetchUserData();
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator />
        <Text>Loading...</Text>
      </View>
    );
  }

  async function deletePost() {
    if (!id) {
      console.log("No post document reference available to delete.");
      return;
    }

    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete all likes associated with the post
              // const likesCollectionRef = collection(db, "status", id);
              // const likesSnapshot = await getDocs(likesCollectionRef);
              // const deleteLikesPromises = likesSnapshot.docs.map((likeDoc) =>
              //   deleteDoc(likeDoc.ref)
              // // );
              // await Promise.all(deleteLikesPromises);

              // Delete the post document
              await deleteDoc(doc(db, "market", id));

              // Delete the image associated with the post, if it exists
              const imageRef = ref(storage, `market/${id}/image`);
              try {
                await deleteObject(imageRef);
              } catch (imageError) {
                console.warn(
                  "Image could not be deleted (may not exist):",
                  imageError
                );
              }

              console.log(
                "Post and associated resources deleted successfully."
              );
            } catch (error) {
              console.error("An error occurred during deletion:", error);
            }
            router.replace("/(Products)/ProductFeed");
          },
        },
      ],
      { cancelable: true } // Allows the user to dismiss the alert by tapping outside
    );
  }

  const onPress = async () => {
    router.replace(`/(drawer)/(chats)/users`);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-800">
      <StatusBar style="auto" />
      <View className="flex-row items-center justify-between px-2 w-full">
        <Pressable onPress={() => router.back()} className="m-2">
          <Feather name="arrow-left" size={28} color="gray" />
        </Pressable>
        <Text className="text-2xl font-bold dark:text-white">
          {product?.productname}
        </Text>
        <View>
          {user?.id === product?.uid && (
            <Pressable onPress={deletePost}>
              <Feather
                name="trash-2"
                size={20}
                color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
              />
            </Pressable>
          )}
        </View>
        <View></View>
      </View>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <>
          <View className="mt-5">
            <Image
              source={{ uri: product?.image }}
              style={{ width: "100%", height: 250 }}
            />

            <View className="flex-row justify-between items-center p-5 w-full">
              <View>
                <Text className="text-gray-500">
                  <MaterialCommunityIcons
                    name="clock-check-outline"
                    size={14}
                    color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
                  />{" "}
                  {product?.timestamp
                    ? moment(product.timestamp.toDate()).fromNow()
                    : "Unknown time"}
                </Text>
                <Text className="text-2xl dark:text-white">
                  KES {Number(product?.cost).toLocaleString("en-KE")}
                </Text>
              </View>

              <View className="flex-row items-center gap-2 m-3">
                <Image
                  source={{ uri: product?.userImg }}
                  className="rounded-full h-20 w-20"
                />
                <View>
                  <Text className="font-bold dark:text-white">
                    {product?.name} {product?.lastname}
                  </Text>
                  <Text className="dark:text-gray-400">
                    @{product?.nickname}
                  </Text>
                </View>
              </View>
            </View>

            <View className="m-5">
              <Text className="dark:text-white">{product?.description}</Text>
            </View>
          </View>
          <View className="w-full mt-5 p-5">
            <Pressable
              onPress={onPress}
              className="p-3 rounded-md items-center bg-slate-800 dark:bg-slate-600"
            >
              <Text className="text-white">Chat</Text>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
