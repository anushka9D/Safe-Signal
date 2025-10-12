import notificationService from './notificationService';
import { db } from '../config/firebase-config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

class UserNotificationInit {
  private static instance: UserNotificationInit;
  private unsubscribe: (() => void) | null = null;

  private constructor() {}

  static getInstance(): UserNotificationInit {
    if (!UserNotificationInit.instance) {
      UserNotificationInit.instance = new UserNotificationInit();
    }
    return UserNotificationInit.instance;
  }

  // Initialize notifications for the current user
  async initializeUserNotifications(userId: string) {
    try {
      // Request notification permissions
      const hasPermission = await notificationService.requestPermissions();
      if (!hasPermission) {
        console.log('Notification permissions not granted');
        return false;
      }

      // Only try to get push token in development builds, not in Expo Go
      if (notificationService.isDevelopmentBuild()) {
        // Get push token
        const pushToken = await notificationService.getPushToken();
        if (pushToken) {
          // Store push token in user's document in Firebase
          await this.saveUserPushToken(userId, pushToken);
        }
      } else {
        console.log('Running in Expo Go - push tokens not available');
      }

      // Set up notification listeners (works in both Expo Go and development builds)
      notificationService.setupNotificationListeners();

      // Listen for new notifications in Firebase
      this.unsubscribe = notificationService.listenForNotifications(userId);

      console.log('User notifications initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing user notifications:', error);
      return false;
    }
  }

  // Save user push token to Firebase
  private async saveUserPushToken(userId: string, token: string) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        await setDoc(userRef, { pushToken: token }, { merge: true });
      } else {
        await setDoc(userRef, { pushToken: token });
      }
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  // Clean up notification listeners
  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    notificationService.cleanup();
  }
}

export default UserNotificationInit.getInstance();