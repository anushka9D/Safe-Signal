
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getApp, getApps, initializeApp } from 'firebase/app'
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'
import { Platform } from 'react-native'

const firebaseConfig = {
  apiKey: "AIzaSyDeAXMlaTipMnVe1eLlYUiq1VoXiM6IkFA",
  authDomain: "safe-signal-admin.firebaseapp.com",
  projectId: "safe-signal-admin",
  storageBucket: "safe-signal-admin.firebasestorage.app",
  messagingSenderId: "764334848674",
  appId: "1:764334848674:web:91a30f0ae350a26b1935fb",
  measurementId: "G-XC0L3NCX7S"
};



const app = getApps().length ? getApp() : initializeApp(firebaseConfig)


export const auth =
  Platform.OS === 'web'
    ? getAuth(app)
    : (() => {
      try {
        return initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage),
        })
      } catch {

        return getAuth(app)
      }
    })()

export const db = getFirestore(app)
export const functions = getFunctions(app)