
import { Link, router } from 'expo-router'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native'
import { auth, } from '../../config/firebase-config'
import { db } from '../../config/firebase-config'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { ensureUserDoc, routeByRole } from '../../lib/users'
import { getUserLocationOnce } from '@/lib/location'

export default function SignUp() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const disabled = loading || !email || !password || password.length < 6 || password !== confirm

  const onSubmit = async () => {
    try {
      if (disabled) return
      setLoading(true)
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)

      const loc = await getUserLocationOnce();

      await ensureUserDoc(cred.user)

      await setDoc(doc(db, 'users', cred.user.uid), {
        email: email.trim(),
        name: name.trim(),
        role: 'user',
        createdAt: serverTimestamp(),
        location: loc
        ? {
            lat: loc.lat,
            lng: loc.lng,
            accuracy: loc.accuracy ?? null,
            capturedAt: loc.capturedAt,
          }
        : null,
      }, { merge: true })

      router.replace('/')
    } catch (e: any) {
      let msg = 'Sign up failed. Please try again.'
      if (e?.code === 'auth/email-already-in-use') msg = 'Email already in use.'
      if (e?.code === 'auth/invalid-email') msg = 'Invalid email.'
      if (e?.code === 'auth/weak-password') msg = 'Password should be at least 6 characters.'
      Alert.alert('Error', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="flex-1 bg-[#0b1220] p-5 justify-center">
      <Text className="text-white text-3xl font-extrabold">Create account</Text>
      <Text className="text-slate-300 mt-2">Join Safe Signal</Text>

      <View className="mt-6 gap-3">
        <TextInput
          className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white"
          placeholder="Full name"
          placeholderTextColor="#cbd5e1"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <TextInput
          className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white"
          placeholder="Email"
          placeholderTextColor="#cbd5e1"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white"
          placeholder="Password (min 6 chars)"
          placeholderTextColor="#cbd5e1"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white"
          placeholder="Confirm password"
          placeholderTextColor="#cbd5e1"
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
        />
      </View>

      <Pressable
        onPress={onSubmit}
        disabled={disabled}
        className={`mt-6 rounded-xl px-4 py-3 items-center ${disabled ? 'bg-orange-500/60' : 'bg-orange-500'
          }`}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-extrabold">Create account</Text>
        )}
      </Pressable>

      <View className="flex-row gap-1 mt-4">
        <Text className="text-slate-400">Already have an account?</Text>
        <Link href="/auth/login">
          <Text className="text-white font-semibold">Log in</Text>
        </Link>
      </View>
    </View>
  )
}
