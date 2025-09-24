
import { SafeAreaView } from 'react-native-safe-area-context'
import { View, Text, ScrollView, Pressable, Alert, TouchableOpacity, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { onAuthStateChanged, signOut, User } from 'firebase/auth'
import { auth } from '../../config/firebase-config'
import { setLocked, clearLocked } from '../../lib/biometrics'
import { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser)
    return unsub
  }, [])

  const handleLock = async () => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    await setLocked(uid)
    router.replace('/auth/login')
  }

  const handleLogout = async () => {
    const uid = auth.currentUser?.uid
    try {
      setBusy(true)
      if (uid) await clearLocked(uid)
      await signOut(auth)
      router.replace('/')
    } catch (e: any) {
      Alert.alert('Logout failed', String(e?.message ?? e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0b1220]">
      <ScrollView contentContainerClassName="p-5 gap-5">
        <Text className="text-white text-2xl font-extrabold">user Dashboard</Text>
        <Text className="text-slate-400">{user?.email ?? '—'}</Text>

        <View className="flex-1 justify-center">
          <View className="flex-1 flex-row flex-wrap justify-between p-4">

            <TouchableOpacity
              className="bg-gray-800 rounded-xl py-5 px-6 shadow-lg m-1 w-[45%] h-[20%] justify-center"
              onPress={() => router.push('/disaster-screen/flood')}
            >
              <Text className="text-white text-lg font-semibold text-center">
                Flood
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-gray-800 rounded-xl py-5 px-6 shadow-lg m-1 w-[45%] h-[20%] justify-center"
              onPress={() => router.push('/disaster-screen/landSlide')}
            >
              <Text className="text-white text-lg font-semibold text-center">
                Land Slides
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-gray-800 rounded-xl py-5 px-6 shadow-lg m-1 w-[45%] h-[20%] justify-center"
              onPress={() => router.push('/disaster-screen/earthquake')}
            >
              <Text className="text-white text-lg font-semibold text-center">
                Earthquake
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-gray-800 rounded-xl py-5 px-6 shadow-lg m-1 w-[45%] h-[20%] justify-center"
              onPress={() => router.push('/disaster-screen/storm')}
            >
              <Text className="text-white text-lg font-semibold text-center">
                Storms 
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-gray-800 rounded-xl py-5 px-6 shadow-lg m-1 w-[100%] h-[10%] justify-center"
              onPress={() => router.push('/settings/settings')}
            >
              <Text className="text-white text-lg font-semibold text-center">
                Settings
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-gray-800 rounded-xl py-5 px-6 shadow-lg m-1 w-[100%] h-[10%] justify-center"
              onPress={() => router.push('/notifications/notifications')}
            >
              <Text className="text-white text-lg font-semibold text-center">
                Notifications
              </Text>
            </TouchableOpacity>

          </View>
        </View>

        <View className="flex-row gap-3">
          <Pressable onPress={handleLock} className="px-4 py-3 rounded-xl bg-white/10 border border-white/15">
            <Text className="text-white font-semibold">Lock app</Text>
          </Pressable>

          <Pressable onPress={handleLogout} disabled={busy} className="px-4 py-3 rounded-xl bg-white/10 border border-white/15">
            {busy ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">Logout</Text>}
          </Pressable>
        </View>

        {/* Floating Map Button */}
            <TouchableOpacity
 className="absolute bottom-6 right-6 bg-blue-500 rounded-full p-4 shadow-lg"
                onPress={() => router.push('/map-navigation/' as any)}
            >
                <Ionicons name="map" size={28} color="white" />
            </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}
