
import { SafeAreaView } from 'react-native-safe-area-context'
import { View, Text, ScrollView, Pressable, Alert, TouchableOpacity, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { onAuthStateChanged, signOut, User } from 'firebase/auth'
import { auth } from '../../config/firebase-config'
import { setLocked, clearLocked } from '../../lib/biometrics'
import { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'

export default function Settings() {
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

                {/* Header */}
                <View className="bg-white shadow-sm px-6 py-4 pt-12">
                    <View className="flex-row items-center justify-between">
                        <TouchableOpacity
                            className="bg-gray-100 rounded-full p-2 mt-8"
                            onPress={() => router.back()}
                        >
                            <Ionicons name="arrow-back" size={24} color="#4B5563" />
                        </TouchableOpacity>
                        <Text className="text-2xl font-bold text-gray-800">
                            Settings
                        </Text>
                        <View className="w-10" />
                    </View>
                </View>

                <Text className="text-slate-400 mx-4">{user?.email ?? '—'}</Text>


                <View className="flex-row gap-3 mx-4">
                    <Pressable onPress={handleLock} className="flex-1 bg-gray-600 rounded-2xl p-6">
                        <Text className="text-white text-xl font-bold text-center">Lock app</Text>
                    </Pressable>

                    <Pressable onPress={handleLogout} disabled={busy} className="flex-1 bg-gray-600 rounded-2xl p-6">
                        {busy ? <ActivityIndicator color="#fff" /> :
                            <Text className="text-white text-xl font-bold text-center">Logout</Text>
                        }
                    </Pressable>
                </View>

                <TouchableOpacity
                    className="bg-gray-600 mx-4 rounded-2xl p-6 mb-8"
                    onPress={() => router.push('/quiz/onboarding')}
                >
                    <Text className="text-white text-xl font-bold text-center">
                        Retake Onboarding Quiz
                    </Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    )
}