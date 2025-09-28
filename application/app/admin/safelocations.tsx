import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View, ActivityIndicator, Pressable, Platform, Alert, KeyboardAvoidingView, ScrollView } from 'react-native';
import { useRef, useState } from 'react';
import { TextInput } from 'react-native-gesture-handler';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import * as Location from 'expo-location';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase-config';

export default function Safelocations() {
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'operational' | 'notOperational' | ''>('');
  const [latitude, setLatitude] = useState('');  
  const [longitude, setLongitude] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);

  // map & marker state
  const mapRef = useRef<MapView>(null);
  const [coord, setCoord] = useState({
    lat: Number(latitude) || 7.8731,   
    lng: Number(longitude) || 80.7718,
  });

  const disabled =
    loading ||
    !address.trim() ||
    !status ||
    !name.trim() ||
    !type.trim() ||
    (!latitude.trim() || Number.isNaN(Number(latitude))) ||
    (!longitude.trim() || Number.isNaN(Number(longitude)));

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

  const useMyLocation = async () => {
    setBusy(true);
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      updateFromMap(pos.coords.latitude, pos.coords.longitude);

    
      const [rev] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      if (rev) {
        setAddress(
          `${rev.name ?? ''} ${rev.street ?? ''}, ${rev.city ?? ''}, ${rev.country ?? ''}`.trim()
        );
      }
    } finally {
      setBusy(false);
    }
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

  const onSubmit = async () => {
    try {
      if (disabled) return;
      setLoading(true);

      const lat = Number(latitude);
      const lng = Number(longitude);
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        Alert.alert('Invalid coords', 'Latitude/Longitude must be numbers.');
        return;
      }

      await addDoc(collection(db, 'safe_locations'), {
        address: address.trim(),
        name: name.trim(),
        type: type.trim(),
        isOperational: status === 'operational',
        latitude: lat,
        longitude: lng,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      Alert.alert('Success', 'Safe location added.');
     
      setAddress('');
      setStatus('');
      setLatitude('');
      setLongitude('');
      setName('');
      setType('');
    } catch (e) {
      console.warn(e);
      Alert.alert('Error', 'Could not add location.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#0b1220]"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow p-5 pb-32 gap-3" 
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View className="items-center justify-center">
          <Text className="text-white text-xl font-bold">Add Safe Locations</Text>
        </View>

        <View className="gap-3 mt-3">
         {/* name and address */}
          <TextInput
            className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white"
            placeholder="Location name (e.g., City Hospital)"
            placeholderTextColor="#cbd5e1"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <TextInput
            className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white"
            placeholder="Address"
            placeholderTextColor="#cbd5e1"
            value={address}
            onChangeText={setAddress}
            autoCapitalize="sentences"
          />

       {/* status */}
          <View className="gap-2">
            <Text className="text-white">Status</Text>
            <View className="flex-row gap-2 items-start">
              <Pressable
                onPress={() => setStatus('operational')}
                className={`px-3 py-1.5 rounded-lg border ${status === 'operational' ? 'bg-orange-500 border-orange-500' : 'bg-white/10 border-white/15'
                  }`}
              >
                <Text className="text-white text-sm font-semibold">Operational</Text>
              </Pressable>
              <Pressable
                onPress={() => setStatus('notOperational')}
                className={`px-3 py-1.5 rounded-lg border ${status === 'notOperational' ? 'bg-orange-500 border-orange-500' : 'bg-white/10 border-white/15'
                  }`}
              >
                <Text className="text-white text-sm font-semibold">Not operational</Text>
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

          {/* Type */}
          <TextInput
            className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white"
            placeholder="Type (hospital, shelter, police, …)"
            placeholderTextColor="#cbd5e1"
            value={type}
            onChangeText={setType}
            autoCapitalize="words"
          />

          {/* Save */}
          <Pressable
            onPress={onSubmit}
            disabled={disabled}
            className={`mt-4 rounded-xl px-4 py-3 items-center ${disabled ? 'bg-orange-500/60' : 'bg-orange-500'
              }`}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-extrabold">Add Location</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
