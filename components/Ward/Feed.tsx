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
} from "react-native";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/firebase";
import Posts from "./Posts";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { useUserInfo } from "@/providers/UserContext";
import { useRecoilState } from "recoil";
import { modalWardComment } from "@/atoms/modalAtom";
import { useUser } from "@clerk/clerk-expo";
import Comments from "./Comments";
import { router } from "expo-router";

const Feed = () => {
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false); // Separate loading state for comments
  const [posts, setPosts] = useState([]);
  const [input, setInput] = useState("");
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const bottomSheetRef = useRef(null);
  const [comments, setComments] = useState([]);

  const [postID] = useRecoilState(modalWardComment);
  const { user } = useUser();
  const { userData } = useUserInfo();

  const snapPoints = useMemo(() => ["100%"], []);
  const openBottomSheet = useCallback(() => setIsBottomSheetOpen(true), []);
  const closeBottomSheet = useCallback(() => {
    setIsBottomSheetOpen(false);
    setComments([]); // Clear comments when the sheet is closed
  }, []);

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const q = query(
          collection(db, "ward", userData.ward),
          orderBy("timestamp", "desc")
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const postsData = snapshot.docs;
          setPosts(postsData);
          setLoadingPosts(false);
        });
        return () => unsubscribe(); // Unsubscribe on unmount
      } catch (error) {
        console.error("Error fetching posts:", error);
        setLoadingPosts(false);
      }
    };

    fetchPosts();
  }, []);

  // Fetch comments for a specific post
  const fetchComments = useCallback(async () => {
    if (!postID && !userData) return;

    setLoadingComments(true); // Set loading state for comments
    try {
      const q = query(
        collection(db, "ward", userData.ward, postID, "comments"),
        orderBy("timestamp", "desc")
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const commentsData = snapshot.docs;
        setComments(commentsData);
        setLoadingComments(false);
      });
      return () => unsubscribe(); // Unsubscribe on unmount
    } catch (error) {
      console.error("Error fetching comments:", error);
      setLoadingComments(false);
    }
  }, [postID]);

  // Trigger fetching comments when bottom sheet opens
  useEffect(() => {
    if (isBottomSheetOpen) {
      fetchComments();
    }
  }, [isBottomSheetOpen, fetchComments]);

  // Send a comment
  async function sendComment() {
    if (!userData?.id) {
      router.replace("/(auth)");
      return;
    }

    if (!input.trim()) {
      alert("Comment cannot be empty!");
      return;
    }

    setLoadingComments(true); // Show loader when sending comment
    try {
      await addDoc(collection(db, "ward", userData.ward, postID, "comments"), {
        id: user.id,
        comment: input.trim(),
        timestamp: serverTimestamp(),
        email: user?.primaryEmailAddress?.emailAddress,
        name: userData.name,
        lastname: userData.lastname,
        nickname: userData.nickname,
        userImg: userData.userImg,
      });
      setInput(""); // Clear the input
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setLoadingComments(false);
    }
  }

  if (loadingPosts) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View className="flex-1 px-2">
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Posts post={item} id={item.id} openBottomSheet={openBottomSheet} />
        )}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <Text>No posts available</Text>
          </View>
        }
      />

      <BottomSheet
        ref={bottomSheetRef}
        index={isBottomSheetOpen ? 1 : -1}
        snapPoints={snapPoints}
        onChange={(index) => setIsBottomSheetOpen(index >= 1)}
        enablePanDownToClose={true}
      >
        <View>
          {loadingComments ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ActivityIndicator size="large" color="#0000ff" />
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <Comments comment={item} id={item.id} />
              )}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text>No comments available</Text>
                </View>
              }
            />
          )}
        </View>

        <KeyboardAvoidingView
          behavior="padding"
          style={{ position: "absolute", bottom: 0, width: "100%" }}
        >
          <BottomSheetView className="px-4 z-50">
            <View className="flex-row items-center justify-between px-4 border rounded-full border-gray-500">
              <TextInput
                placeholder="Comment"
                value={input}
                onChangeText={setInput}
                className="flex-1 rounded-full "
              />
              <Pressable onPress={sendComment}>
                <Ionicons name="send" color="gray" size={24} />
              </Pressable>
            </View>
          </BottomSheetView>
        </KeyboardAvoidingView>
      </BottomSheet>
    </View>
  );
};

export default Feed;
