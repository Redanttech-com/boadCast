import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Video } from "expo-av";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { db, storage } from "@/firebase";
import { SafeAreaView } from "react-native-safe-area-context";

export default function StatusPage() {
  const { id } = useLocalSearchParams();
  const [statuses, setStatuses] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (!id) return;

    const q = query(collection(db, "status"), where("uid", "==", id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const statusList = snapshot.docs.map((doc) => ({
        docId: doc.id,
        ...doc.data(),
      }));
      setStatuses(statusList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const deleteStatus = async (docId) => {
    if (!docId) return;
    Alert.alert(
      "Delete Status",
      "Are you sure you want to delete this status?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "status", docId));
              await deleteObject(ref(storage, `status/${docId}/video`));
              setStatuses((prev) =>
                prev.filter((status) => status.docId !== docId)
              );
            } catch (error) {
              console.error("Error deleting status:", error);
            }
          },
        },
      ]
    );
  };

  const pauseOrResume = () => setIsPaused((prev) => !prev);

  useEffect(() => {
    if (!statuses.length || loading) return;

    const currentStatus = statuses[currentIndex];

    if (currentStatus?.video) {
      if (videoRef.current) {
        videoRef.current.playAsync();
      }
    } else {
      // Start progress for images (5 seconds duration)
      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            handleNext();
            return 0;
          }
          return prev + 2; // Adjust based on total duration
        });
      }, 100);
    }

    return () => clearInterval(timerRef.current);
  }, [statuses, currentIndex, loading]);

  const handleNext = () => {
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
       router.push("/(drawer)/(tabs)");
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

// useEffect(() => {
//   if (!loading && statuses.length === 0) {
//     setTimeout(() => {
//       router.push("/(drawer)/(tabs)");
//     }, 100); // Delay to ensure hooks complete before navigation
//   }
// }, [loading, statuses]);



  return (
    <SafeAreaView style={styles.container}>
      
      {/* Progress Bars */}
      <View style={styles.progressBarContainer}>
        {statuses.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressBar,
              index < currentIndex ? styles.progressBarCompleted : {},
            ]}
          >
            {index === currentIndex && (
              <View
                style={{ ...styles.progressIndicator, width: `${progress}%` }}
              />
            )}
          </View>
        ))}
      </View>

      {/* Current Status */}
      {statuses.length > 0 &&
        (statuses[currentIndex]?.image ? (
          <Image
            source={{ uri: statuses[currentIndex]?.image }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : statuses[currentIndex]?.video ? (
          <Video
            ref={videoRef}
            source={{ uri: statuses[currentIndex]?.video }}
            style={styles.video}
            useNativeControls
            shouldPlay
            resizeMode="contain"
            onPlaybackStatusUpdate={(status) => {
              if (status.didJustFinish) {
                handleNext();
              } else {
                const progressPercentage =
                  (status.positionMillis / status.durationMillis) * 100;
                setProgress(progressPercentage);
              }
            }}
          />
        ) : null)}

      {/* Status Text */}
      {statuses[currentIndex]?.text && (
        <View style={styles.textContainer}>
          <Text style={styles.statusText}>{statuses[currentIndex]?.text}</Text>
        </View>
      )}

      {/* Delete & Pause Buttons */}
      {id === userDetails?.uid && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteStatus(statuses[currentIndex]?.docId)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.pauseButton} onPress={pauseOrResume}>
        <Text style={styles.pauseButtonText}>
          {isPaused ? "Resume" : "Pause"}
        </Text>
      </TouchableOpacity>

      {/* Navigation Controls */}
      <TouchableOpacity style={styles.navButtonLeft} onPress={handlePrev} className="h-screen p-10 ">
        <ChevronLeft size={32} className="hidden"/>
      </TouchableOpacity>
      <TouchableOpacity style={styles.navButtonRight} onPress={handleNext} className="h-screen p-10 ">
        <ChevronRight size={32} className="hidden"/>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  progressBarContainer: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
  },
  progressBar: {
    flex: 1,
    height: 2,
    backgroundColor: "gray",
    marginHorizontal: 2,
  },
  progressBarCompleted: { backgroundColor: "white" },
  progressIndicator: { height: 2, backgroundColor: "white" },
  image: { width: "100%", height: "80%" },
  video: { width: "100%", height: "80%" },
  textContainer: {
    position: "absolute",
    bottom: 40,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 10,
    borderRadius: 5,
  },
  statusText: { color: "white", fontSize: 18 },
  deleteButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "red",
    padding: 10,
    borderRadius: 5,
  },
  deleteButtonText: { color: "white", fontWeight: "bold" },
  pauseButton: {
    position: "absolute",
    bottom: 80,
    padding: 10,
    backgroundColor: "gray",
    borderRadius: 5,
  },
  pauseButtonText: { color: "white" },
  navButtonLeft: { position: "absolute", left: 10, top: "50%" },
  navButtonRight: { position: "absolute", right: 10, top: "50%" },
});
