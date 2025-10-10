
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { Redirect, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View, Text, Alert, ActivityIndicator } from 'react-native';

import { Drawer } from 'expo-router/drawer';
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from '@react-navigation/drawer';

import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../config/firebase-config';

import {
  isEnabledForUser,
  isLocked,
  authenticate,
  setLocked,
  clearLocked,
} from '../../lib/biometrics';

function CustomDrawerContent(props: any) {
  const [busy, setBusy] = useState(false);
  const email = auth.currentUser?.email ?? '—';

  const handleLock = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      setBusy(true);
      await setLocked(uid);
      router.replace('/auth/login');
    } catch (e: any) {
      Alert.alert('Lock failed', String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    const uid = auth.currentUser?.uid;
    try {
      setBusy(true);
      if (uid) await clearLocked(uid);
      await signOut(auth);
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Logout failed', String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flex: 1, backgroundColor: '#0b1220' }}
    >

      <View style={{ padding: 16 }}>
        <Text style={{ color: '#94a3b8', marginBottom: 4 }}>Logged in as</Text>
        <Text style={{ color: 'white', fontWeight: '700' }}>{email}</Text>
      </View>


      <DrawerItemList {...props} />


      <View
        style={{
          marginTop: 'auto',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.1)',
        }}
      >
        <DrawerItem
          label={() => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {busy ? <ActivityIndicator /> : null}
              <Text style={{ color: 'white', fontWeight: '600' }}>Lock app</Text>
            </View>
          )}
          onPress={handleLock}
        />
        <DrawerItem
          label={() => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {busy ? <ActivityIndicator /> : null}
              <Text style={{ color: 'white', fontWeight: '600' }}>Logout</Text>
            </View>
          )}
          onPress={handleLogout}
        />
      </View>
    </DrawerContentScrollView>
  );
}

export default function AdminLayout() {
  const [status, setStatus] = useState<'checking' | 'ok' | 'out'>('checking');
  const prompted = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return setStatus('out');

      const [enabled, locked] = await Promise.all([
        isEnabledForUser(user.uid),
        isLocked(user.uid),
      ]);

      if (enabled && locked && !prompted.current) {
        prompted.current = true;
        const ok = await authenticate();
        if (!ok) return setStatus('out');
      }
      setStatus('ok');
    });
    return unsub;
  }, []);

  if (status === 'checking') return null;
  if (status === 'out') return <Redirect href="/auth/login" />;

  return (
    <Drawer
      initialRouteName="dashboard"
      screenOptions={{
        headerStyle: { backgroundColor: '#0b1220' },
        headerTintColor: '#fff',
        drawerStyle: { backgroundColor: '#0b1220' },
        drawerActiveTintColor: '#fff',
        drawerInactiveTintColor: '#94a3b8',
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Drawer.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Drawer.Screen name="donations" options={{ title: 'Donations' }} />
      <Drawer.Screen name="content" options={{ title: 'Content management' }} />
      <Drawer.Screen name="safelocations" options={{ title: 'Add Safe Locations' }} />
    </Drawer>
  );
}
