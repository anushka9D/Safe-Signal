
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View, ActivityIndicator, Pressable } from 'react-native';
import { useState } from 'react';
import { TextInput } from 'react-native-gesture-handler';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../config/firebase-config'
import { Alert } from 'react-native';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import * as Location from 'expo-location';

export default function Safelocations() {

  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<'operational' | 'notOperational' | ''>('');
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false)
  const disabled = loading || !address || !status || !latitude || !longitude || !name || !type

  const useMyLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setLatitude(String(pos.coords.latitude));
    setLongitude(String(pos.coords.longitude));
  };

  // Helper to read current numbers (fallback to Sri Lanka center)
  const latNum = Number(latitude) || 7.8731;
  const lngNum = Number(longitude) || 80.7718;


  const onSubmit = async () => {
    try {
      if (disabled) return
      setLoading(true)

      const lat = Number(latitude);
      const lng = Number(longitude);
      const operational = status.trim().toLowerCase() === 'true';


      await addDoc(collection(db, 'safe_locations',), {
        address: address.trim(),
        name: name.trim(),
        isOperational: operational,
        latitude: lat,
        longitude: lng,
        type: type.trim(),

        createdAt: serverTimestamp(),

      })
      setAddress("");
      setStatus("");
      setLatitude("");
      setLongitude("");
      setName("");
      setType("");
      Alert.alert('Success', 'Safe location added successfully.');
    } catch (error) {
      console.warn(error);
    } finally {
      setLoading(false)
    }

  }

  return (
    <SafeAreaView className="flex-1 bg-[#0b1220] p-5">
      <View className='flex items-center justify-center'>
        <Text className="text-white text-xl font-bold ">Add Safe Locations</Text>
      </View>

      <View className='gap-3 mt-3 '>
        <TextInput
          className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white"
          placeholder='Safe are address'
          placeholderTextColor="#cbd5e1"
          value={address}
          onChangeText={setAddress}
          autoCapitalize="words"
        />

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

        <TextInput
          className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white"
          placeholder='Add the latitude'
          placeholderTextColor="#cbd5e1"
          value={latitude}
          onChangeText={setLatitude}
          autoCapitalize="words"
        />
        {/* <TextInput
          className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white"
          placeholder='Add the longitude'
          placeholderTextColor="#cbd5e1"
          value={longitude}
          onChangeText={setLongitude}
          autoCapitalize="words"
        />
        <TextInput
          className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white"
          placeholder='Add the name'
          placeholderTextColor="#cbd5e1"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        /> */}

        <View className="gap-2">
          <Text className="text-white">Pick location</Text>

      
          <View style={{ height: 240, borderRadius: 12, overflow: 'hidden' }}>
            <MapView
              style={{ flex: 1 }}
              initialRegion={{
                latitude: latNum,
                longitude: lngNum,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
              onPress={(e: MapPressEvent) => {
                const { latitude: la, longitude: lo } = e.nativeEvent.coordinate;
                setLatitude(String(la));
                setLongitude(String(lo));
              }}
            >
              {(latitude && longitude) ? (
                <Marker
                  coordinate={{ latitude: Number(latitude), longitude: Number(longitude) }}
                  draggable
                  onDragEnd={(e) => {
                    const { latitude: la, longitude: lo } = e.nativeEvent.coordinate;
                    setLatitude(String(la));
                    setLongitude(String(lo));
                  }}
                />
              ) : null}
            </MapView>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-slate-300 text-xs">
              {latitude && longitude ? `Lat: ${Number(latitude).toFixed(6)}  Lng: ${Number(longitude).toFixed(6)}` : 'Tap map to set coordinates'}
            </Text>

            <Pressable
              onPress={useMyLocation}
              className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 self-start"
            >
              <Text className="text-white text-xs font-semibold">Use my location</Text>
            </Pressable>
          </View>
        </View>

        <TextInput
          className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white"
          placeholder="Add the type"
          placeholderTextColor="#cbd5e1"
          value={type}
          onChangeText={setType}
          autoCapitalize="words"
        />

        <Pressable
          onPress={onSubmit}
          disabled={disabled}
          className={`mt-6 rounded-xl px-4 py-3 items-center ${disabled ? 'bg-orange-500/60' : 'bg-orange-500'
            }`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-extrabold">Add Location</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
