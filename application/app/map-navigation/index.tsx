import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import {
  SafeLocation,
  getAllSafeLocations,
  getNearestSafeLocations,
  initializeSafeLocations,
} from '../../lib/safeLocations';
import EmbeddedMap from '../../lib/EmbeddedMap';
import { navigationTracker, NavigationState } from '../../lib/navigationService';

export default function MapNavigation() {
  const router = useRouter();
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [safeLocations, setSafeLocations] = useState<(SafeLocation & { distance: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [navigationState, setNavigationState] = useState<NavigationState | null>(null);

  useEffect(() => {
    initializeData();
  }, []);

  // Load safe locations after user location is obtained
  useEffect(() => {
    if (userLocation) {
      loadSafeLocations();
    }
  }, [userLocation]);

  const initializeData = async () => {
    try {
      setLoading(true);
      
      // Initialize Firebase data if needed
      await initializeSafeLocations();
      
      // Get user location first, then load nearby safe locations
      await getUserLocation();
    } catch (error) {
      console.error('Error initializing data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadSafeLocations = async () => {
    try {
      if (!userLocation) return;
      
      // Get only locations within 5km radius
      const nearbyLocations = await getNearestSafeLocations(
        userLocation.coords.latitude,
        userLocation.coords.longitude,
        5, // 5km radius
        20 // max 20 locations
      );
      
      setSafeLocations(nearbyLocations);
      console.log(`Found ${nearbyLocations.length} safe locations within 5km`);
    } catch (error) {
      console.error('Error loading safe locations:', error);
      setSafeLocations([]);
    }
  };

  const getUserLocation = async () => {
    try {
      // Request permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Please enable location permissions to use this feature.');
        return;
      }

      // Get current location
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your current location.');
    }
  };

  const openInGoogleMaps = () => {
    if (userLocation) {
      const url = Platform.select({
        ios: `http://maps.apple.com/?ll=${userLocation.coords.latitude},${userLocation.coords.longitude}&z=15`,
        android: `geo:${userLocation.coords.latitude},${userLocation.coords.longitude}?z=15`,
        default: `https://www.google.com/maps/@${userLocation.coords.latitude},${userLocation.coords.longitude},15z`
      });
      Linking.openURL(url || `https://www.google.com/maps/@${userLocation.coords.latitude},${userLocation.coords.longitude},15z`);
    }
  };

  const startNavigation = async (location: SafeLocation) => {
    try {
      await navigationTracker.startNavigation(location, (state) => {
        setNavigationState(state);
      });
      
      Alert.alert(
        'Navigation Started',
        `Navigation to ${location.name} has started. Follow the blue route on the map.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error starting navigation:', error);
      Alert.alert('Error', 'Could not start navigation. Please try again.');
    }
  };

  const stopNavigation = () => {
    navigationTracker.stopNavigation();
    setNavigationState(null);
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
            const url = Platform.select({
              ios: `http://maps.apple.com/?daddr=${location.latitude},${location.longitude}`,
              android: `google.navigation:q=${location.latitude},${location.longitude}`,
              default: `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`
            });
            Linking.openURL(url || `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`);
          }
        }
      ]
    );
  };

  const callLocation = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Error', 'Could not open phone app.');
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#4B5563" />
        <Text className="mt-4 text-gray-600">Getting your location...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View className="bg-white shadow-sm px-6 py-4 pt-12 z-10">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            className="bg-gray-100 rounded-full p-2 mt-8"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#4B5563" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-800">
            {navigationState?.isNavigating ? 
              `🧭 Navigating to ${navigationState.destination?.name}` : 
              'Safe Locations'
            }
          </Text>
          <TouchableOpacity
            className="bg-gray-100 rounded-full p-2 mt-8"
            onPress={navigationState?.isNavigating ? stopNavigation : initializeData}
          >
            <Ionicons 
              name={navigationState?.isNavigating ? "stop" : "refresh"} 
              size={24} 
              color={navigationState?.isNavigating ? "#FF3B30" : "#4B5563"} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Interactive Map */}
      <View className="flex-1">
        {userLocation ? (
          <View className="flex-1">
            <EmbeddedMap
              userLocation={{
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude,
              }}
              safeLocations={safeLocations}
              height={undefined} // Let it fill the container
              onLocationPress={navigateToLocation}
              navigationState={navigationState || undefined}
              onStartNavigation={startNavigation}
            />
            
            {/* Navigation Status Panel */}
            {navigationState?.isNavigating && (
              <View className="absolute top-4 left-4 right-4 bg-white rounded-xl p-4 shadow-lg border-l-4 border-blue-500">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-800">
                      🧭 To {navigationState.destination?.name}
                    </Text>
                    <View className="flex-row mt-2">
                      <View className="flex-1 mr-4">
                        <Text className="text-sm text-gray-600">Distance</Text>
                        <Text className="text-xl font-semibold text-blue-600">
                          {navigationState.remainingDistance?.toFixed(1)} km
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm text-gray-600">ETA</Text>
                        <Text className="text-xl font-semibold text-green-600">
                          {Math.round(navigationState.estimatedTimeArrival || 0)} min
                        </Text>
                      </View>
                    </View>
                    <Text className="text-sm text-gray-700 mt-2 italic">
                      {navigationState.nextInstruction}
                    </Text>
                  </View>
                  <TouchableOpacity
                    className="bg-red-500 rounded-full p-3 ml-4"
                    onPress={stopNavigation}
                  >
                    <Ionicons name="stop" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View className="flex-1 justify-center items-center">
            <Text className="text-gray-600">Unable to get your location</Text>
            <TouchableOpacity
              className="mt-4 bg-blue-500 px-6 py-3 rounded-lg"
              onPress={initializeData}
            >
              <Text className="text-white font-semibold">Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Bottom Action Button */}
      <View className="absolute bottom-6 left-6 right-6">
        {navigationState?.isNavigating ? (
          <TouchableOpacity 
            className="bg-red-500 rounded-full py-4 px-6 flex-row items-center justify-center shadow-lg"
            onPress={stopNavigation}
          >
            <Ionicons name="stop" size={24} color="white" />
            <Text className="text-white text-lg font-semibold ml-2">
              Stop Navigation
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            className="bg-blue-500 rounded-full py-4 px-6 flex-row items-center justify-center shadow-lg"
            onPress={() => router.push('/map-navigation/list' as any)}
          >
            <Ionicons name="list" size={24} color="white" />
            <Text className="text-white text-lg font-semibold ml-2">
              View List ({safeLocations.length} within 5km)
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}