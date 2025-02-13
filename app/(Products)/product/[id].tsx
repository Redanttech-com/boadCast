import {
  View,
  Text,
  Image,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { db } from "@/firebase";
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

  const onPress = async () => {
    router.replace(`/(drawer)/(chats)/users`);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-800">
      <StatusBar style="auto" />
      <View className="flex-row items-center justify-between px-4">
        <Pressable
          onPress={() => router.replace("/(drawer)/market")}
          className="m-2"
        >
          <Feather name="arrow-left" size={28} color="gray" />
        </Pressable>
        <Text className="text-2xl font-bold dark:text-white">
          {product?.productname}
        </Text>
        {/* <View className="flex-col h-16 items-center">
          <Pressable onPress={likePost} className="p-3">
            <AntDesign
              name="hearto"
              size={20}
              color={hasLiked ? "red" : "gray"}
            />
          </Pressable>
          {likes.length > 0 && <Text>{formatNumber(likes.length)}</Text>}
        </View> */}
        <View></View>
      </View>

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
              <Text className="dark:text-gray-400">@{product?.nickname}</Text>
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
    </SafeAreaView>
  );
}
