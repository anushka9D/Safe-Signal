
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import {
  SafeLocation,
  getNearestSafeLocations,
} from '../../lib/safeLocations';
import EmbeddedMap from '../../lib/EmbeddedMap';
import { navigationTracker, NavigationState } from '../../lib/navigationService';

export default function SafeLocationsList() {
  const router = useRouter();
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [safeLocations, setSafeLocations] = useState<(SafeLocation & { distance: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMapOverview, setShowMapOverview] = useState(false);
  const [navigationState, setNavigationState] = useState<NavigationState | null>(null);
  const { width } = Dimensions.get('window');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Please enable location permissions.');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);

      const nearestLocations = await getNearestSafeLocations(
        location.coords.latitude,
        location.coords.longitude,
        5, // 5km radius
        20 // max 20 locations
      );
      
      setSafeLocations(nearestLocations);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load safe locations.');
    } finally {
      setLoading(false);
    }
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'hospital': return 'medical';
      case 'fire_station': return 'flame';
      case 'police': return 'shield';
      case 'shelter': return 'home';
      case 'emergency_center': return 'warning';
      default: return 'location';
    }
  };

  const navigateToLocation = (location: SafeLocation) => {
    Alert.alert(
      'Start Navigation',
      `Navigate to ${location.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Navigation', 
          onPress: () => startNavigation(location)
        },
        {
          text: 'External Maps',
          onPress: () => {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`;
            Linking.openURL(url).catch(() => {
              Alert.alert('Error', 'Could not open navigation app.');
            });
          }
        }
      ]
    );
  };

  const startNavigation = async (location: SafeLocation) => {
    try {
      await navigationTracker.startNavigation(location, (state) => {
        setNavigationState(state);
      });
      
      Alert.alert(
        'Navigation Started',
        `Navigation to ${location.name} has started. Return to map view to see the route.`,
        [
          { text: 'OK' },
          { text: 'Go to Map', onPress: () => router.back() }
        ]
      );
    } catch (error) {
      console.error('Error starting navigation:', error);
      Alert.alert('Error', 'Could not start navigation. Please try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#4B5563" />
        <Text className="mt-4 text-gray-600">Loading safe locations...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
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
          <Text className="text-2xl font-bold text-gray-800">
            Safe Locations (5km)
          </Text>
          <TouchableOpacity
            className="bg-gray-100 rounded-full p-2 mt-8"
            onPress={() => setShowMapOverview(!showMapOverview)}
          >
            <Ionicons name="map" size={24} color="#4B5563" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map Overview - Toggle */}
      {showMapOverview && userLocation && (
        <View className="bg-white mx-4 my-2 rounded-xl overflow-hidden shadow-sm">
          <View className="p-3 border-b border-gray-100">
            <Text className="text-lg font-semibold text-gray-800">Overview Map</Text>
            <Text className="text-sm text-gray-600">{safeLocations.length} locations within 5km</Text>
          </View>
          <EmbeddedMap
            userLocation={{
              latitude: userLocation.coords.latitude,
              longitude: userLocation.coords.longitude,
            }}
            safeLocations={safeLocations}
            height={250}
            onLocationPress={navigateToLocation}
          />
        </View>
      )}

      {/* Locations List */}
      <ScrollView className="flex-1 px-4 py-4">
        {safeLocations.map((location) => (
          <View
            key={location.id}
            className="bg-white rounded-xl p-4 mb-3 shadow-sm"
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center flex-1">
                <Ionicons
                  name={getLocationIcon(location.type) as any}
                  size={24}
                  color="#4B5563"
                />
                <View className="ml-3 flex-1">
                  <Text className="text-lg font-semibold text-gray-800">
                    {location.name}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {location.distance.toFixed(1)} km away
                  </Text>
                </View>
              </View>
            </View>
            
            <Text className="text-gray-600 mb-3">{location.address}</Text>
            
            {/* Mini Map for each location */}
            <View className="mb-3 rounded-lg overflow-hidden border border-gray-200">
              <EmbeddedMap
                userLocation={userLocation ? {
                  latitude: userLocation.coords.latitude,
                  longitude: userLocation.coords.longitude,
                } : undefined}
                safeLocations={[location]}
                height={150}
                onLocationPress={navigateToLocation}
              />
            </View>
            
            <View className="flex-row space-x-2">
              <TouchableOpacity
                className="bg-blue-500 px-4 py-3 rounded-lg flex-1"
                onPress={() => startNavigation(location)}
              >
                <Text className="text-white text-center font-medium">
                  🧭 Start Navigation
                </Text>
              </TouchableOpacity>
              
              {location.phone && (
                <TouchableOpacity
                  className="bg-green-500 px-4 py-3 rounded-lg flex-1"
                  onPress={() => {
                    Linking.openURL(`tel:${location.phone}`).catch(() => {
                      Alert.alert('Error', 'Could not open phone app.');
                    });
                  }}
                >
                  <Text className="text-white text-center font-medium">
                    Call
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
        
        {safeLocations.length === 0 && (
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="location-outline" size={64} color="#9CA3AF" />
            <Text className="text-gray-500 text-lg mt-4">No safe locations within 5km</Text>
            <Text className="text-gray-400 text-sm mt-2">Try moving to a different area</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}