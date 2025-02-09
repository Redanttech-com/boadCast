// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAmI3uZKu0oqJ90xsX-3BLsYNLno3rz3rI",
  authDomain: "deep-state-dce44.firebaseapp.com",
  databaseURL: "https://deep-state-dce44-default-rtdb.firebaseio.com",
  projectId: "deep-state-dce44",
  storageBucket: "deep-state-dce44.appspot.com",
  messagingSenderId: "36467854328",
  appId: "1:36467854328:web:bb49838d3beb41be77240d",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth();
const db = getFirestore();
const storage = getStorage();

export  { app, auth, db, storage };
