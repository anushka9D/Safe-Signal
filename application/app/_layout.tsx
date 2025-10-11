import "./global.css"

import { Stack } from 'expo-router';
import { StripeProvider } from '@stripe/stripe-react-native';

export default function RootLayout() {
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