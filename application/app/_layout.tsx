import "./global.css"

import { Stack } from 'expo-router';
import { StripeProvider } from '@stripe/stripe-react-native';
import notificationService from '../lib/notificationService';
import { useEffect } from 'react';

export default function RootLayout() {
    useEffect(() => {
    // Initialize notification service
    const initNotifications = async () => {
      await notificationService.requestPermissions();
      notificationService.setupNotificationListeners();
    };
    
    initNotifications();
    
    // Cleanup on unmount
    return () => {
      notificationService.cleanup();
    };
  }, []);
  
  return (
    <StripeProvider publishableKey="pk_test_51SGO3HQZlaiiozHEiKefK7ZkVjbolc7Y2S9tGgyqblfB0VqWIVs2spBJS8hCLhvrbtG2RvdCULskHeUaiCwinYPK00viT2GFLo">
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
    </StripeProvider>
  );
}