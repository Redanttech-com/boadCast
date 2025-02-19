import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Pressable,
  Image,
  useColorScheme,
} from "react-native";
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/firebase";
import { useUserInfo } from "@/components/UserContext";
import {
  Feather,
  FontAwesome,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import moment from "moment";
import { ResizeMode, Video } from "expo-av";
import { Avatar } from "react-native-elements";
import { useUser } from "@clerk/clerk-expo";

const Ward = () => {
  const [posts, setPosts] = useState([]);
  const [trends, setTrendPosts] = useState([]);
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [status, setStatus] = useState({});
  const { user } = useUser();
  const [userData, setUserData] = useState(null);

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

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

  useEffect(() => {
    if (!userData?.ward) return;
    const unsubscribe = onSnapshot(
      collection(db, "ward", userData?.ward, "posts"),
      (snapshot) => {
        const fetchedPosts = snapshot.docs.map((doc) => doc.data());
        setTrendPosts(fetchedPosts);
        setPosts(fetchedPosts);
      }
    );

    return () => unsubscribe();
  }, [userData?.ward]);

  useEffect(() => {
    const findTrendingTopics = () => {
      if (!trends.length) return;
      const commonWords = new Set([
        "what",
        "how",
        "why",
        "my",
        "when",
        "who",
        "from",
        "where",
        "is",
        "are",
        "that",
        "a",
        "in",
        "and",
      ]);

      const allWords = trends.flatMap((post) =>
        typeof post.text === "string"
          ? post.text
              .toLowerCase()
              .split(/\b/)
              .filter((word) => {
                const trimmedWord = word.trim();
                return trimmedWord.length > 0 && !commonWords.has(trimmedWord);
              })
          : []
      );

      const wordFrequency = allWords.reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {});

      const trendingTopics = Object.entries(wordFrequency)
        .map(([topic, postCount]) => ({ topic, postCount }))
        .sort((a, b) => b.postCount - a.postCount)
        .slice(0, 5);

      setTrendingTopics(trendingTopics);
      setLoading(false);
    };

    setLoading(true);
    findTrendingTopics();
  }, [trends]);

  const filteredPosts = selectedTopic
    ? posts.filter((post) =>
        post.text.toLowerCase().includes(selectedTopic.toLowerCase())
      )
    : [];

    return (
      <View className="flex-1 dark:bg-gray-800">
        <View className={`flex ${isDarkMode ? "bg-gray-900" : "bg-white"} p-2`}>
          {loading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator
                size="large"
                color={isDarkMode ? "white" : "blue"}
              />
              <Text className="font-bold text-lg dark:text-white mt-2">
                Loading National Trends...
              </Text>
            </View>
          ) : (
            <>
              <Text className="text-xl font-bold dark:text-white mb-4 mt-10">
                Trending Topics
              </Text>

              <FlatList
                data={trendingTopics}
                keyExtractor={(item) => item.topic}
                horizontal
                showsHorizontalScrollIndicator={false}
                ListEmptyComponent={
                  <View className="flex-1 justify-center items-center">
                    <Text className="dark:text-white">No posts available</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => setSelectedTopic(item.topic)}
                    className={`px-4 p-2 rounded-full mr-2 ${
                      isDarkMode ? "bg-gray-700" : "bg-gray-200"
                    }`}
                  >
                    <Text className="font-semibold dark:text-white">
                      #{item.topic}
                    </Text>
                    <Text className="text-xs dark:text-gray-300 ">
                      {item.postCount} mentions
                    </Text>
                  </TouchableOpacity>
                )}
              />

              {selectedTopic && (
                <>
                  <Text className="text-xl font-bold mt-4 dark:text-white">
                    Posts about #{selectedTopic}
                  </Text>

                  <FlatList
                    data={filteredPosts}
                    keyExtractor={(item, index) => index.toString()}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                      <View className="flex-1 justify-center items-center">
                        <Text className="dark:text-white">
                          No posts available
                        </Text>
                      </View>
                    }
                    renderItem={({ item }) => (
                      <View
                        className={`p-4 my-2 rounded-lg mb-2 ${
                          isDarkMode ? "bg-gray-800" : "bg-gray-100"
                        }`}
                      >
                        <View className="flex-row items-center gap-3">
                          <Avatar
                            size={40}
                            rounded
                            source={
                              userData?.userImg
                                ? { uri: userData?.userImg }
                                : undefined
                            }
                            title={userData?.name?.[0]?.toUpperCase()}
                            containerStyle={{
                              backgroundColor: userData?.name
                                ? "#3498DB"
                                : "#ccc",
                            }}
                          />
                          <Text className="text-sm dark:text-white font-semibold">
                            @{item.nickname}
                          </Text>
                          <Text className="text-sm dark:text-white">
                            {moment(item.timestamp?.toDate()).fromNow()}
                          </Text>
                        </View>

                        <Text className="text-base dark:text-white mt-2">
                          {item.text}
                        </Text>

                        {item.images && (
                          <Image
                            source={{ uri: item.images }}
                            className="w-full h-56 rounded-md mt-2"
                          />
                        )}

                        {item.videos && (
                          <Video
                            source={{ uri: item.videos }}
                            style={{
                              width: "100%",
                              height: 300,
                              borderRadius: 10,
                              marginTop: 10,
                            }}
                            useNativeControls
                            resizeMode={ResizeMode.CONTAIN}
                            onPlaybackStatusUpdate={(status) =>
                              setStatus(() => status)
                            }
                          />
                        )}
                      </View>
                    )}
                  />
                </>
              )}
            </>
          )}
        </View>
      </View>
    );
};

export default Ward;
