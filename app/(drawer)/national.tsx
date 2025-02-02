import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";

const National = () => {
  const [posts, setPosts] = useState([]); // All posts from Firestore
  const [trends, setTrendPosts] = useState([]); // Stores posts for trending topic analysis
  const [trendingTopics, setTrendingTopics] = useState([]); // Top trending topics
  const [loading, setLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null); // Track clicked topic

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "posts"), (snapshot) => {
      const fetchedPosts = snapshot.docs.map((doc) => doc.data());
      setTrendPosts(fetchedPosts);
      setPosts(fetchedPosts);
    });

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
                renderItem={({ item }) => (
                  <View
                    style={{
                      padding: 10,
                      marginVertical: 5,
                      borderRadius: 5,
                    }}
                  >
                    <Text>{item.name}</Text>
                    <Text style={{ fontSize: 14 }}>{item.text}</Text>
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

export default National;
