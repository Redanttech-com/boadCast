// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDamBDVXsQEo1Ii7m44OFHIEKiFihJngtg",
  authDomain: "insta-2-yt-326f5.firebaseapp.com",
  projectId: "insta-2-yt-326f5",
  storageBucket: "insta-2-yt-326f5.appspot.com",
  messagingSenderId: "816842422080",
  appId: "1:816842422080:web:4ce71ea7146ca29f71eca5",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth();
const db = getFirestore();
const storage = getStorage();

export  { app, auth, db, storage };
