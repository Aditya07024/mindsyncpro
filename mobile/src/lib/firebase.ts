import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
  inMemoryPersistence,
} from "firebase/auth";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyBGk2kSZDxKkp5Z0G0Fms4LFJe1bGroUN0",
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "my-mind-therapy-friend.firebaseapp.com",
  projectId:
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
    "my-mind-therapy-friend",
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "my-mind-therapy-friend.firebasestorage.app",
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    "466122514705",
  appId:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID ||
    "1:466122514705:web:b54a85245d7e371c1fecb0",
  measurementId:
    process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ||
    "G-XFXBKHZ3Y0",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let authInstance: any;

try {
  if (Platform.OS === "web") {
    authInstance = getAuth(app);
  } else {
    const persistence =
      typeof getReactNativePersistence === "function"
        ? getReactNativePersistence(AsyncStorage)
        : inMemoryPersistence;

    authInstance = initializeAuth(app, { persistence });
  }
} catch {
  authInstance = getAuth(app);
}

export const auth = authInstance;
