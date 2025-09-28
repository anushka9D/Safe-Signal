
import React, { useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { onAuthStateChanged, signInWithEmailAndPassword, User } from 'firebase/auth'
import { auth } from '../../config/firebase-config'
import { getSupport, enableForUser, isEnabledForUser, authenticate } from '../../lib/biometrics'
import { ensureUserDoc, routeByRole } from '../../lib/users'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [canBio, setCanBio] = useState(false)


  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return setCanBio(false)
      setCanBio(await isEnabledForUser(u.uid))
    })
    return unsub
  }, [])

  const disabled = loading || !email || password.length < 6

  
  const afterLoginBiometrics = async (user: User) => {
    
    if (await isEnabledForUser(user.uid)) {
      return routeByRole(user)
    }

    const { hasHardware, enrolled } = await getSupport()
    if (!hasHardware) return routeByRole(user)

    Alert.alert(
      'Enable fingerprint?',
      enrolled
        ? 'Use your fingerprint/FaceID to unlock the app next time.'
        : 'Enroll a fingerprint/FaceID in device settings first.',
      [
        { text: 'Not now', style: 'cancel', onPress: () => routeByRole(user) },
        {
          text: 'Enable',
          onPress: async () => {
            try {
              if (!enrolled) return routeByRole(user)
              await enableForUser(user.uid)
              await routeByRole(user)
            } catch (e: any) {
              Alert.alert('Enable failed', String(e?.message ?? e))
              await routeByRole(user)
            }
          },
        },
      ]
    )
  }

  const onLogin = async () => {
    if (disabled) return
    try {
      setLoading(true)
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password)

      await ensureUserDoc(cred.user)

     
      await afterLoginBiometrics(cred.user)

     
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }


  const handleBiometricUnlock = async () => {
    const u = auth.currentUser
    if (!u) {
      return Alert.alert(
        'No saved session',
        'Sign in with email/password once, then enable fingerprint on this device.'
      )
    }
    const enabled = await isEnabledForUser(u.uid)
    if (!enabled) {
      return Alert.alert(
        'Fingerprint not enabled',
        'Enable fingerprint after login (or in settings) for this account on this device.'
      )
    }
    const ok = await authenticate('Unlock to continue')
    if (ok) {
      await ensureUserDoc(u)
      await routeByRole(u) 
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0b1220]">
      <View className="flex-1 p-5 justify-center">
        <Text className="text-white text-3xl font-extrabold">Welcome back</Text>

        <View className="mt-6 gap-3">
          <TextInput
            className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white"
            placeholder="Email"
            placeholderTextColor="#cbd5e1"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white"
            placeholder="Password"
            placeholderTextColor="#cbd5e1"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <Pressable
          onPress={onLogin}
          disabled={disabled}
          className={`mt-6 rounded-xl px-4 py-3 items-center ${
            disabled ? 'bg-orange-500/60' : 'bg-orange-500'
          }`}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-extrabold">Log in</Text>}
        </Pressable>

        {canBio && (
          <Pressable
            onPress={handleBiometricUnlock}
            className="mt-3 rounded-xl px-4 py-3 items-center bg-white/10 border border-white/15"
          >
            <Text className="text-white font-extrabold">Use fingerprint</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  )
}