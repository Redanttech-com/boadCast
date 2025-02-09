import React, { useState, useEffect } from "react";
import { db } from "@/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { useUserInfo } from "@/components/UserContext";

const useFollowData = () => {
  const { userDetails } = useUserInfo();
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  console.log("useFollowData -> userDetails:", userDetails); // Debugging

  useEffect(() => {
    if (!userDetails?.uid) return;

    setLoading(true);

    /** 🔹 Fetch Followers (Users who follow the current user) */
    const followersQuery = query(
      collection(db, "following"),
      where("followingId", "==", userDetails.uid) // Users following me
    );

    const unsubscribeFollowers = onSnapshot(
      followersQuery,
      async (snapshot) => {
        const followersList = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const followerData = docSnap.data();

            // Fetch follower user details
            const userQuery = query(
              collection(db, "userPosts"),
              where("id", "==", followerData.followerId)
            );
            const userSnap = await getDocs(userQuery);

            if (!userSnap.empty) {
              return { ...followerData, ...userSnap.docs[0].data() };
            }
            return followerData;
          })
        );

        setFollowers(followersList);
      }
    );

    /** 🔹 Fetch Following (Users I am following) */
    const followingQuery = query(
      collection(db, "following"),
      where("followerId", "==", userDetails?.uid) // Users I am following
    );

    const unsubscribeFollowing = onSnapshot(
      followingQuery,
      async (snapshot) => {
        const followingList = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const followingData = docSnap.data();

            // Fetch following user details
            const userQuery = query(
              collection(db, "userPosts"),
              where("uid", "==", followingData.followingId)
            );
            const userSnap = await getDocs(userQuery);

            if (!userSnap.empty) {
              return { ...followingData, ...userSnap.docs[0].data() };
            }
            return followingData;
          })
        );

        setFollowing(followingList);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeFollowers();
      unsubscribeFollowing();
    };
  }, [userDetails]);

  return { followers, following, loading, currentUserId: userDetails?.uid };
};

export default useFollowData;
