import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  Image,
} from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { FetchKenyanNews } from "@/utils/cryptoapi";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import { router } from "expo-router";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { StatusBar } from "expo-status-bar";

const NewsScreen = () => {
    const colorScheme = useColorScheme();
  
  const { data: NewsData = [], isLoading: IsNewsLoading } = useQuery({
    queryKey: ["cryptonews"],
    queryFn: FetchKenyanNews,
  });

  console.log(NewsData)

  const renderItem = ({ item, index }) => {
    return (
      <Pressable
        className="mb-4 mx-4 space-y-1"
        key={index}
        onPress={() =>
          router.push(
            `/(news)/newsdetails?id=${item.id}&url=${encodeURIComponent(
              item.url
            )}`
          )
        }
      >
        <View className="flex-row justify-start w-[100%] shadow-sm">
          <View className="items-start justify-start w-[20%]">
            <Image
              source={{
                uri: item.imgUrl,
              }}
              style={{ width: hp(9), height: hp(10) }}
              resizeMode="cover"
              className="rounded-lg"
            />
          </View>
          <View className="w-[90%] pl-4 justify-center space-y-1">
            <Text className="text-xs font-bold text-gray-900 dark:text-white">
              {item.description?.length > 20
                ? item.description.slice(0, 20) + "..."
                : item.description}
            </Text>

            <Text className="text-neutral-800 capitalize max-w-[90%] dark:text-white">
              {item.title?.length > 50
                ? item.title.slice(0, 50) + "..."
                : item.title}
            </Text>

            <Text className="text-xs text-gray-700 dark:text-white">
              {item.publisedAt}
            </Text>
          </View>

          <View className="w-[10%] justify-center"></View>
        </View>
      </Pressable>
    );
  };

  // console.log({ NewsData });

  return (
    <SafeAreaView className="space-x-2 bg-white dark:bg-gray-800  flex-1">
      <StatusBar style="auto" />
      <View className="w-full flex-row justify-between items-center px-4 pb-4">
        <View className="w-3/4 flex-row space-x-2 items-center">
          <Text className="font-bold text-3xl dark:text-white">
            Trending News
          </Text>
        </View>
      </View>

      <View className="flex-1">
        {IsNewsLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator
              size="large"
              color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
            />
            <Text className="dark:text-white">Loading news</Text>
          </View>
        ) : (
          <FlatList
            data={NewsData}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderItem}
            initialNumToRender={10}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default NewsScreen;
