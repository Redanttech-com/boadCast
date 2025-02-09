import React, { createContext, useContext, useState, useEffect } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useUser } from "@clerk/clerk-expo";

const FollowContext = createContext();

export const useFollow = () => useContext(FollowContext);

export const FollowProvider = ({ children }) => {
  const [hasFollowed, setHasFollowed] = useState({});
  const { user } = useUser();
  const [posts, setPosts] = useState([]);
  const [followloading, setFollowLoading] = useState({});

  // Fetch posts in real-time
  useEffect(() => {
    const q = query(collection(db, "userPosts"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, []);

  // Fetch follow status for all posts
  useEffect(() => {
    const fetchFollowStatus = async () => {
      if (!user?.id || posts.length === 0) return;

      const followStatuses = {};
      const promises = posts.map((post) => {
        const postId = post?.uid;
        return getDocs(
          query(
            collection(db, "following"),
            where("followerId", "==", user.id),
            where("followingId", "==", postId)
          )
        ).then((followDoc) => {
          followStatuses[postId] = !followDoc.empty;
        });
      });

      await Promise.all(promises);
      setHasFollowed(followStatuses);
    };

    fetchFollowStatus();
  }, [posts, user]); // Runs when posts or user changes

  // Follow or Unfollow function
  const followMember = async (postId) => {
    if (!user?.id || !postId) return;
    setFollowLoading((prev) => ({ ...prev, [postId]: true }));
    setHasFollowed((prev) => ({
      ...prev,
      [postId]: !prev[postId], // Toggle UI instantly
    }));

    try {
      if (hasFollowed[postId]) {
        // Unfollow Logic
        const followingQuery = query(
          collection(db, "following"),
          where("followerId", "==", user.id),
          where("followingId", "==", postId)
        );

        const followerQuery = query(
          collection(db, "following"),
          where("followerId", "==", postId),
          where("followingId", "==", user.id)
        );

        const followingSnapshot = await getDocs(followingQuery, followerQuery);
        const batchDeletes = followingSnapshot.docs.map((docSnapshot) =>
          deleteDoc(doc(db, "following", docSnapshot.id))
        );

        await Promise.all(batchDeletes);
      } else {
        // Follow Logic
        const followedUserQuery = query(
          collection(db, "userPosts"),
          where("uid", "==", user.id)
        );
        const followedUserSnapshot = await getDocs(followedUserQuery);

        if (!followedUserSnapshot.empty) {
          const followedUserData = followedUserSnapshot.docs[0].data();

          await addDoc(collection(db, "following"), {
            followerId: postId,
            name: followedUserData.name,
            nickname: followedUserData.nickname,
            userImg: followedUserData.userImg,
            timeStamp: new Date(),
          });
        }

        const followingUserQuery = query(
          collection(db, "userPosts"),
          where("uid", "==", postId)
        );
        const followingUserSnapshot = await getDocs(followingUserQuery);

        if (!followingUserSnapshot.empty) {
          const followingUserData = followingUserSnapshot.docs[0].data();

          await addDoc(collection(db, "following"), {
            followingId: user.id,
            name: followingUserData.name,
            nickname: followingUserData.nickname,
            userImg: followingUserData.userImg,
            timeStamp: new Date(),
          });
        }
      }
    } catch (error) {
      console.error("Error following/unfollowing: ", error);
    }
    setFollowLoading((prev) => ({ ...prev, [postId]: false }));
  };

  return (
    <FollowContext.Provider
      value={{ hasFollowed, followMember, followloading }}
    >
      {children}
    </FollowContext.Provider>
  );
};
