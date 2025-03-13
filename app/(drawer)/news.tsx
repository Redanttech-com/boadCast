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
import { useInfiniteQuery } from "@tanstack/react-query";
import { FetchKenyanNews } from "@/utils/cryptoapi";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import { router } from "expo-router";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { StatusBar } from "expo-status-bar";

const NewsScreen = () => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  // Infinite Query with Pagination & Improved Fetching Logic
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["cryptonews"],
    queryFn: ({ pageParam = 1 }) => FetchKenyanNews(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextPage || null,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
    enabled: true, // Prevent unnecessary calls
  });

  const NewsData = data?.pages.flatMap((page) => page.articles) || [];

  // Handle API Errors
  if (isError) {
    return (
      <SafeAreaView
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF" }}
      >
        <Text className="text-red-500 dark:text-red-400">
          Failed to load news
        </Text>
      </SafeAreaView>
    );
  }

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
          {/* News Image */}
          <View className="items-start justify-start w-[20%]">
            <Image
              source={{
                uri: item?.imgUrl || "https://via.placeholder.com/150",
              }}
              defaultSource={require("@/assets/images/ky.gif")} // Placeholder Image
              style={{ width: hp(9), height: hp(10) }}
              resizeMode="cover"
              className="rounded-lg"
            />
          </View>

          {/* News Details */}
          <View className="w-[80%] pl-4 justify-center space-y-1">
            <Text className="text-xs font-bold text-gray-900 dark:text-white">
              {item?.description?.length > 50
                ? item?.description.slice(0, 50) + "..."
                : item?.description}
            </Text>

            <Text className="text-neutral-800 capitalize max-w-[90%] dark:text-white">
              {item?.title?.length > 50
                ? item?.title.slice(0, 50) + "..."
                : item?.title}
            </Text>

            <Text className="text-xs text-gray-700 dark:text-white">
              {item?.publishedAt}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF" }}
    >
      <StatusBar style="auto" />

      {isLoading ? (
        // Show Loading Indicator
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator
            size="large"
            color={isDarkMode ? "#FFFFFF" : "#000000"}
          />
          <Text className="dark:text-white">Loading news...</Text>
        </View>
      ) : NewsData.length === 0 ? (
        // Show No News Message
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-700 dark:text-white">
            No news available
          </Text>
        </View>
      ) : (
        // News List
        <FlatList
          data={NewsData}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          initialNumToRender={5}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews
          updateCellsBatchingPeriod={100}
          onEndReached={() => {
            if (hasNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() =>
            isFetchingNextPage ? (
              <ActivityIndicator
                size="small"
                color={isDarkMode ? "#FFFFFF" : "#000000"}
              />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

export default NewsScreen;
