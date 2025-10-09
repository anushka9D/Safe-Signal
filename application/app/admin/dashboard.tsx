
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';

import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '../../config/firebase-config';

import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

 

  return (
    <SafeAreaView className="flex-1 bg-[#0b1220]">
      <ScrollView contentContainerClassName="p-5 gap-5">
        <Text className="text-white text-2xl font-extrabold">Admin Dashboard</Text>
        <Text className="text-slate-400">{user?.email ?? '—'}</Text>

        <View className="flex-row gap-3">
         
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
