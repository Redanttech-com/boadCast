// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDlVU4gg2hDjmxHaLmrU7BwBH0P2oXAMSg",
  authDomain: "broadcast-ddeb4.firebaseapp.com",
  projectId: "broadcast-ddeb4",
  storageBucket: "broadcast-ddeb4.firebasestorage.app",
  messagingSenderId: "803737868675",
  appId: "1:803737868675:web:28f8fab8f02aff2021feb6",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth();
const db = getFirestore();
const storage = getStorage();

export  { app, auth, db, storage };
