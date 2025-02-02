// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCFIeRX70wRkFyHYpDTe7N9qLHcW8AF98g",
  authDomain: "deepstate-83058.firebaseapp.com",
  databaseURL: "https://deepstate-83058-default-rtdb.firebaseio.com",
  projectId: "deepstate-83058",
  storageBucket: "deepstate-83058.appspot.com",
  messagingSenderId: "317087443326",
  appId: "1:317087443326:web:69fb6b0647e13df71dab2f",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth();
const db = getFirestore();
const storage = getStorage();

export  { app, auth, db, storage };
