import React, { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-expo";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/firebase";

// Create context
const UserContext = createContext();
export const useUserInfo = () => useContext(UserContext);

const UserContextData = ({ children }) => {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState({});
  const { user } = useUser();
  const [posts, setPosts] = useState([]);
  const [hasFollowed, setHasFollowed] = useState({});

  // Format number utility
  const formatNumber = (number) => {
    if (number >= 1000000) {
      return (number / 1000000).toFixed(1) + "M";
    } else if (number >= 1000) {
      return (number / 1000).toFixed(1) + "k";
    } else {
      return number;
    }
  };

  // Fetch user data
  useEffect(() => {
    const fetchuserDetails = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const q = query(
          collection(db, "userPosts"),
          where("uid", "==", user.id)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setUserDetails(querySnapshot.docs[0].data());
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchuserDetails();
  }, [user]);

  // Fetch posts
  useEffect(() => {
    if (!db) return;

    const fetchPosts = async () => {
      const q = query(collection(db, "userPosts"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const postsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(postsData);
        setLoading(false);
      });

      return () => unsubscribe();
    };

    fetchPosts();
  }, [db]);

  // Fetch follow status from Firestore on page load
  useEffect(() => {
    if (!userDetails?.uid || posts.length === 0) return;

    const fetchFollowStatus = async () => {
      const followStatuses = {};

      const promises = posts.map(async (post) => {
        const postId = post?.uid;

        const followQuery = query(
          collection(db, "following"),
          where("followerId", "==", userDetails?.uid),
          where("followingId", "==", postId)
        );

        const followSnapshot = await getDocs(followQuery);
        followStatuses[postId] = !followSnapshot.empty; // If doc exists, user is following
      });

      await Promise.all(promises);
      setHasFollowed(followStatuses);
    };

    fetchFollowStatus();
  }, [posts, userDetails]);

  // Follow or unfollow a member
  const followMember = async (postId) => {
    if (!userDetails?.uid || !postId) return;

    setFollowLoading((prev) => ({ ...prev, [postId]: true }));

    try {
      if (hasFollowed[postId]) {
        // **Unfollow Logic**
        const followQuery = query(
          collection(db, "following"),
          where("followerId", "==", userDetails?.uid),
          where("followingId", "==", postId)
        );

        const followSnapshot = await getDocs(followQuery);

        if (!followSnapshot.empty) {
          const deletePromises = followSnapshot.docs.map((docSnapshot) =>
            deleteDoc(doc(db, "following", docSnapshot.id))
          );

          await Promise.all(deletePromises);
        }

        // Update state to reflect DB changes
        setHasFollowed((prev) => ({
          ...prev,
          [postId]: false,
        }));
      } else {
        // **Follow Logic**
        await addDoc(collection(db, "following"), {
          followerId: userDetails?.uid,
          followingId: postId,
          timeStamp: new Date(),
        });

        // Update state to reflect DB changes
        setHasFollowed((prev) => ({
          ...prev,
          [postId]: true,
        }));
      }
    } catch (error) {
      console.error("Error following/unfollowing: ", error);
    } finally {
      setFollowLoading((prev) => ({ ...prev, [postId]: false }));
    }
  };

  return (
    <UserContext.Provider
      value={{
        userDetails,
        followLoading,
        hasFollowed,
        formatNumber,
        followMember,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserContextData;
