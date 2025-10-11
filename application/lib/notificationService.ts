import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { db } from '../config/firebase-config';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import Constants from 'expo-constants';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type NotificationListener = {
  remove: () => void;
};

class NotificationService {
  private static instance: NotificationService;
  private notificationListener: NotificationListener | null = null;
  private responseListener: NotificationListener | null = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Check if we're in a development build
  isDevelopmentBuild(): boolean {
    return !Constants.expoGoConfig;
  }

  // Request permission for notifications
  async requestPermissions(): Promise<boolean> {
    // In Expo Go, we can't request permissions for remote notifications
    if (!this.isDevelopmentBuild()) {
      console.log('Running in Expo Go - limited notification functionality');
      // We can still show local notifications in Expo Go
      return true;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }
    
    return true;
  }

  // Get push token (only works in development builds)
  async getPushToken(): Promise<string | null> {
    // Push tokens only work in development builds, not in Expo Go
    if (!this.isDevelopmentBuild()) {
      console.log('Push tokens not available in Expo Go');
      return null;
    }

    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId || 'YOUR_PROJECT_ID',
      });
      return token.data;
    } catch (error) {
      console.log('Error getting push token:', error);
      return null;
    }
  }

  // Schedule a local notification
  async scheduleNotification(title: string, body: string, data: any = {}): Promise<string | null> {
    try {
      const trigger: Notifications.NotificationTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1,
      };

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger,
      });

      console.log('Notification scheduled with identifier:', identifier);
      return identifier;
    } catch (error) {
      console.log('Error scheduling notification:', error);
      return null;
    }
  }

  // Show immediate notification
  async showNotification(title: string, body: string, data: any = {}): Promise<string | null> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null, // null means immediate
      });

      console.log('Notification shown with identifier:', identifier);
      return identifier;
    } catch (error) {
      console.log('Error showing notification:', error);
      return null;
    }
  }

  // Listen for new notifications in Firebase and show push notifications
  listenForNotifications(userId: string) {
    const q = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    return onSnapshot(q, async (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const notificationData: any = change.doc.data();
          
          // Show push notification
          await this.showNotification(
            notificationData.title,
            notificationData.message,
            { 
              type: notificationData.type,
              notificationId: change.doc.id 
            }
          );
        }
      });
    });
  }

  // Set up notification listeners
  setupNotificationListeners() {
    // Handle received notifications
    this.notificationListener = Notifications.addNotificationReceivedListener((notification: Notifications.Notification) => {
      console.log('Notification received:', notification);
    });

    // Handle notification responses (when user taps on notification)
    this.responseListener = Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
      console.log('Notification response received:', response);
      // Handle navigation or other actions based on notification data
    });
  }

  // Clean up listeners
  cleanup() {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
  }
}

export default NotificationService.getInstance();