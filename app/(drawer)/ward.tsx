import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Pressable,
} from "react-native";
import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { useUserInfo } from "@/providers/UserContext";
import { Image } from "react-native";
import {
  Feather,
  FontAwesome,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import moment from "moment";
import { ResizeMode, Video } from "expo-av";

const Ward = () => {
  const [posts, setPosts] = useState([]); // All posts from Firestore
  const [trends, setTrendPosts] = useState([]); // Stores posts for trending topic analysis
  const [trendingTopics, setTrendingTopics] = useState([]); // Top trending topics
  const [loading, setLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null); // Track clicked topic
  const { userData } = useUserInfo();
  const [status, setStatus] = useState({});

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "ward", userData.ward),
      (snapshot) => {
        const fetchedPosts = snapshot.docs.map((doc) => doc.data());
        setTrendPosts(fetchedPosts);
        setPosts(fetchedPosts);
      }
    );

    return () => unsubscribe();
  }, []);

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
        "okay",
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
        .slice(0, 5); // Get top 5 trending topics

      setTrendingTopics(trendingTopics);
      setLoading(false);
    };

    setLoading(true);
    findTrendingTopics();
  }, [trends]);

  // Filter posts that contain the selected topic
  const filteredPosts = selectedTopic
    ? posts.filter((post) =>
        post.text.toLowerCase().includes(selectedTopic.toLowerCase())
      )
    : [];

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {loading ? (
        <ActivityIndicator size="large" color="blue" />
      ) : (
        <>
          {/* Trending Topics List */}
          <FlatList
            data={trendingTopics}
            keyExtractor={(item) => item.topic}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedTopic(item.topic)}
                style={{
                  padding: 10,
                  marginVertical: 5,
                  backgroundColor: "#f0f0f0",
                  borderRadius: 5,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                  #{item.topic}
                </Text>
                <Text style={{ fontSize: 14, color: "gray" }}>
                  {item.postCount} mentions
                </Text>
              </TouchableOpacity>
            )}
          />

          {/* Display Posts Related to Selected Topic */}
          {selectedTopic && (
            <>
              <Text style={{ fontSize: 18, fontWeight: "bold", marginTop: 20 }}>
                Posts about #{selectedTopic}
              </Text>
              <FlatList
                data={filteredPosts}
                keyExtractor={(item, index) => index.toString()}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View className="gap-3 mt-2">
                    <View className="flex-row items-center gap-3">
                      <Image
                        source={{
                          uri: item.userImg,
                        }}
                        className="h-10 w-10 rounded-md"
                      />
                      <FontAwesome
                        name="check-circle"
                        size={15}
                        color="green"
                      />
                      <View className="flex-row gap-2 items-center">
                        <Text className="text-sm">@{item.nickname}</Text>
                        <Text className="text-sm">{item.lastname}</Text>

                        <View className="flex-row items-center gap-2 bg-blue-200 rounded-full p-2">
                          <MaterialCommunityIcons
                            name="clock-check-outline"
                            size={14}
                            color="black"
                          />
                          <Text style={{ fontSize: 12, color: "gray" }}>
                            {moment(item.timestamp?.toDate()).fromNow()}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View>
                      {item.images && (
                        <Image
                          source={{ uri: item.images }}
                          className="w-full h-56 rounded-md"
                        />
                      )}
                      {item.videos && (
                        <Video
                          source={{ uri: item.videos }}
                          style={{
                            width: "100%",
                            height: 300,
                            borderRadius: 10,
                          }}
                          useNativeControls
                          resizeMode={ResizeMode.CONTAIN}
                          // isLooping
                          onPlaybackStatusUpdate={(status) =>
                            setStatus(() => status)
                          }
                        />
                      )}
                    </View>
                  </View>
                )}
              />
            </>
          )}
        </>
      )}
    </View>
  );
};

export default Ward;
