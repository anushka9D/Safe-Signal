
import { ScrollView, View, Text, Pressable } from 'react-native'
import { Link } from 'expo-router'
import { Image } from 'expo-image'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../config/firebase-config'

export default function HomeScreen() {
  const [signedIn, setSignedIn] = useState(false)

  // useEffect(() => {
  //   const unsub = onAuthStateChanged(auth, (u) => setSignedIn(!!u))
  //   return unsub
  // }, [])

  return (
    <SafeAreaView className="flex-1 bg-[#0b1220]">
      <StatusBar style="light" />

      <Image
        source={require('../assets/images/admin.jpg')}
        style={StyleSheet.absoluteFillObject}  
        contentFit="cover"                    
        priority="high"
      />

      <View pointerEvents="none" className="absolute inset-0 bg-black/50 z-10" />

      <ScrollView
        className="relative z-20"
        contentContainerClassName="flex-grow justify-end p-5 pb-24 gap-3"
        showsVerticalScrollIndicator={false}
      >
       
        <View className="gap-3 mt-2">
          <Text className="text-white text-3xl font-extrabold">Stay ahead of risk</Text>

          <Text className="text-slate-200 text-base leading-6 max-w-[720px]">
            Monitor incidents, coordinate response, and keep your people safe and fast.
          </Text>

          <View className="flex-row gap-3 flex-wrap mt-2">
            {/* {signedIn ? (
             
              <Link href="/auth/login" asChild>
                <Pressable className="bg-white/10 border border-white/15 rounded-xl px-4 py-3">
                  <Text className="text-white font-extrabold">Continue</Text>
                </Pressable>
              </Link>
            ) : ( */}
              
              <>
                <Link href="/auth/login" asChild>
                  <Pressable className="bg-orange-500 rounded-xl px-4 py-3">
                    <Text className="text-white text-base font-extrabold">Login</Text>
                  </Pressable>
                </Link>

                <Link href="/auth/sign-up" asChild>
                  <Pressable className="bg-white rounded-xl px-4 py-3">
                    <Text className="text-gray-900 text-base font-extrabold">Sign up</Text>
                  </Pressable>
                </Link>
              </>
            {/* )} */}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
