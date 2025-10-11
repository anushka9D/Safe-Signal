

import { useEffect, useState } from "react";
import { Text, View, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, Alert, Image, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/config/firebase-config"; 

type UserDoc = {
  displayName?: string;
  email?: string;
  phone?: string;
  role?: string;
  photoURL?: string;
  createdAt?: any; 
};

export default function Profile() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [error, setError] = useState<string | null>(null);

  
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUid(null);
        setUserDoc(null);
        setLoading(false);
       
        return;
      }

      try {
        setLoading(true);
        setUid(user.uid);
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data() as UserDoc;
          
          setUserDoc({
            displayName: data.displayName ?? user.displayName ?? "Unnamed User",
            email: data.email ?? user.email ?? "",
            phone: data.phone ?? user.phoneNumber ?? "",
            role: data.role ?? "user",
            photoURL: data.photoURL ?? user.photoURL ?? "",
            createdAt: data.createdAt,
          });
        } else {
          
          setUserDoc({
            displayName: user.displayName ?? "Unnamed User",
            email: user.email ?? "",
            phone: user.phoneNumber ?? "",
            role: "user",
            photoURL: user.photoURL ?? "",
          });
        }
        setError(null);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load profile");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace("/auth/login");
    } catch (e: any) {
      Alert.alert("Sign out failed", e?.message ?? "Please try again.");
    }
  };

  const createdAtText =
    userDoc?.createdAt?.toDate?.() instanceof Date
      ? userDoc!.createdAt.toDate().toDateString()
      : undefined;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View className="bg-white shadow-sm px-6 py-4 pt-12">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            className="bg-gray-100 rounded-full p-2 mt-8"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#4B5563" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-800 mt-8">User Profile</Text>
          <View className="w-10" />
        </View>
      </View>

      {/* Body */}
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {loading ? (
          <View className="mt-10 items-center">
            <ActivityIndicator size="large" />
            <Text className="text-gray-500 mt-3">Loading profile…</Text>
          </View>
        ) : error ? (
          <View className="mt-10">
            <Text className="text-red-600 font-semibold mb-2">Error</Text>
            <Text className="text-gray-700">{error}</Text>
          </View>
        ) : (
          <>
            {/* Avatar + name */}
            <View className="items-center mb-6">
              {userDoc?.photoURL ? (
                <Image
                  source={{ uri: userDoc.photoURL }}
                  className="w-24 h-24 rounded-full"
                />
              ) : (
                <View className="w-24 h-24 rounded-full bg-gray-100 items-center justify-center">
                  <Ionicons name="person" size={36} color="#9CA3AF" />
                </View>
              )}
              <Text className="text-xl font-bold text-gray-900 mt-3">
                {userDoc?.displayName ?? "Unnamed User"}
              </Text>
              {createdAtText && (
                <Text className="text-gray-500 text-sm mt-1">
                  Joined {createdAtText}
                </Text>
              )}
            </View>

            {/* Info cards */}
            <View className="space-y-3 gap-4">
              <InfoRow icon="mail" label="Email" value={userDoc?.email || "—"} />
              <InfoRow icon="call" label="Phone" value={userDoc?.phone || "—"} />
              <InfoRow icon="shield-checkmark" label="Role" value={userDoc?.role || "user"} />
             
            </View>

            {/* Actions */}
            <View className="mt-8">
              <TouchableOpacity
                className="bg-red-500 rounded-2xl py-3 items-center"
                onPress={handleSignOut}
              >
                <Text className="text-white font-semibold">Sign out</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
      <View className="flex-row items-center">
        <Ionicons name={icon} size={20} color="#6B7280" />
        <Text className="ml-2 text-gray-700">{label}</Text>
      </View>
      <Text className={`text-gray-900 ${mono ? "font-mono" : "font-semibold"}`} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
