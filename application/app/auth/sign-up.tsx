
import { Link, router } from 'expo-router'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native'
import { auth, } from '../../config/firebase-config'
import { db } from '../../config/firebase-config'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { ensureUserDoc, routeByRole } from '../../lib/users'
import { getDefaultLanguage, PreferredLanguage } from '@/lib/locale'
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import * as Location from 'expo-location';
import { useRef } from 'react'
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context'


export default function SignUp() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const disabled = loading || !email || !password || password.length < 6 || password !== confirm

  const [preferredLanguage, setPreferredLanguage] = useState<PreferredLanguage>(getDefaultLanguage());

  const [query, setQuery] = useState('');
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    try {
      if (disabled) return
      setLoading(true)
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)

      await ensureUserDoc(cred.user)

      await setDoc(doc(db, 'users', cred.user.uid), {
        email: email.trim(),
        name: name.trim(),
        role: 'user',
        preferredLanguage,
        createdAt: serverTimestamp(),
        query,
        location: {
          lat: coord.lat,
          lng: coord.lng,
          accuracy: null,
          capturedAt: serverTimestamp(),
        },
      }, { merge: true })

      router.replace('/quiz/onboarding')
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

  const onLatChange = (t: string) => {
    setLatitude(t);
    const val = Number(t);
    if (!Number.isNaN(val)) {
      setCoord((c) => ({ ...c, lat: val }));
    }
  };
  const onLngChange = (t: string) => {
    setLongitude(t);
    const val = Number(t);
    if (!Number.isNaN(val)) {
      setCoord((c) => ({ ...c, lng: val }));
    }
  };

  // map & marker state
  const mapRef = useRef<MapView>(null);
  const [coord, setCoord] = useState({
    lat: Number(latitude) || 7.8731,
    lng: Number(longitude) || 80.7718,
  });

  const animateTo = (lat: number, lng: number) => {
    mapRef.current?.animateToRegion(
      { latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 },
      300
    );
  };

  const updateFromMap = (lat: number, lng: number) => {
    setCoord({ lat, lng });
    setLatitude(String(lat));
    setLongitude(String(lng));
    animateTo(lat, lng);
  };

  const onMapPress = (e: MapPressEvent) => {
    const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
    updateFromMap(lat, lng);
  };


  const searchAddress = async () => {
    const q = query.trim();
    if (!q) return;
    setBusy(true);
    try {
      const res = await Location.geocodeAsync(q);
      if (res?.length) {
        const { latitude: lat, longitude: lng } = res[0];
        updateFromMap(lat, lng);

      } else {
        Alert.alert('Not found', 'No results for that address.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
   


      <KeyboardAvoidingView
        className="flex-1 bg-[#0b1220]"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow p-5 pt-20 pb-32 gap-3 justify-center"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >

          <Text className="text-white text-3xl font-extrabold">Create account </Text>
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

            <View className="gap-2 bg-white/10 border border-white/15 rounded-xl px-4 py-3 flex flex-col">
              <Text className="text-white">Select prefered language</Text>
              <View className='gap-3 items-start'>
                <Pressable
                  onPress={() => setPreferredLanguage("si")}
                  className={`px-4 py-2 rounded-xl border ${preferredLanguage === "si"
                    ? "bg-orange-500 border-orange-500"
                    : "bg-white/10 border-white/15"
                    }`}
                >
                  <Text className="text-white font-semibold">සිංහල</Text>
                </Pressable>

                <Pressable
                  onPress={() => setPreferredLanguage("en")}
                  className={`px-4 py-2 rounded-xl border ${preferredLanguage === "en"
                    ? "bg-orange-500 border-orange-500"
                    : "bg-white/10 border-white/15"
                    }`}
                >
                  <Text className="text-white font-semibold">English</Text>
                </Pressable>
              </View>

            </View>

            {/*  search + map */}
            <View className="gap-3">
              <View className="flex-row items-center gap-2">
                <TextInput
                  className="flex-1 bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white"
                  placeholder="Search address/place"
                  placeholderTextColor="#cbd5e1"
                  value={query}
                  onChangeText={setQuery}
                  returnKeyType="search"
                  onSubmitEditing={searchAddress}
                  autoCapitalize="none"
                />
                <Pressable onPress={searchAddress} disabled={busy} className="px-3 py-2 rounded-lg bg-orange-500">
                  <Text className="text-white font-semibold">{busy ? '...' : 'Search'}</Text>
                </Pressable>
              </View>

              <View style={{ height: 240, borderRadius: 12, overflow: 'hidden' }}>
                <MapView
                  ref={mapRef}
                  style={{ flex: 1 }}
                  initialRegion={{
                    latitude: coord.lat,
                    longitude: coord.lng,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                  }}
                  onPress={onMapPress}
                >
                  <Marker
                    coordinate={{ latitude: coord.lat, longitude: coord.lng }}
                    draggable
                    onDragEnd={(e) => {
                      const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
                      updateFromMap(lat, lng);
                    }}
                  />
                </MapView>
              </View>

              {/* Coord fields  */}
              <View className="flex-row gap-2">
                <TextInput
                  className="flex-1 bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white"
                  placeholder="Latitude"
                  placeholderTextColor="#cbd5e1"
                  value={latitude}
                  onChangeText={onLatChange}
                  keyboardType="numeric"
                  autoCapitalize="none"
                />
                <TextInput
                  className="flex-1 bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white"
                  placeholder="Longitude"
                  placeholderTextColor="#cbd5e1"
                  value={longitude}
                  onChangeText={onLngChange}
                  keyboardType="numeric"
                  autoCapitalize="none"
                />
              </View>
            </View>

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

        </ScrollView>
      </KeyboardAvoidingView >

  )
}
