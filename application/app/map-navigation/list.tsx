
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import {
  SafeLocation,
  getNearestSafeLocations,
} from '../../lib/safeLocations';
import EmbeddedMap from '../../lib/EmbeddedMap';
import { navigationTracker, NavigationState } from '../../lib/navigationService';
import FooterNavigation from '../../lib/FooterNavigation';

export default function SafeLocationsList() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [safeLocations, setSafeLocations] = useState<(SafeLocation & { distance: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMapOverview, setShowMapOverview] = useState(false);
  const [navigationState, setNavigationState] = useState<NavigationState | null>(null);
  const { width } = Dimensions.get('window');
  const nearestOnly = params.nearestOnly === 'true';

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

      let nearestLocations;
      if (nearestOnly) {
        // Get only the nearest location when nearestOnly is true
        nearestLocations = await getNearestSafeLocations(
          location.coords.latitude,
          location.coords.longitude,
          5, // 5km radius
          1 // Only get 1 location (the nearest)
        );
      } else {
        // Get all locations within 5km radius as before
        nearestLocations = await getNearestSafeLocations(
          location.coords.latitude,
          location.coords.longitude,
          5, // 5km radius
          20 // max 20 locations
        );
      }
      
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

  const callLocation = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Error', 'Could not open phone app.');
    });
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
            {nearestOnly ? 'Nearest Safe Location' : `Safe Locations (${safeLocations.length})`}
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
        <View className="h-64 bg-gray-200">
          <EmbeddedMap
            userLocation={{
              latitude: userLocation.coords.latitude,
              longitude: userLocation.coords.longitude,
            }}
            safeLocations={safeLocations}
            height={250}
            onLocationPress={navigateToLocation}
            navigationState={navigationState || undefined}
            onStartNavigation={startNavigation}
          />
        </View>
      )}

      {/* Locations List */}
      <ScrollView className="flex-1 px-4 py-4 pb-20">
        {safeLocations.map((location, index) => (
          <TouchableOpacity
            key={`${location.id}-${index}`}
            className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
            onPress={() => navigateToLocation(location)}
          >
            <View className="flex-row items-center">
              <View className="bg-blue-100 rounded-full p-3 mr-4">
                <Ionicons
                  name={getLocationIcon(location.type)}
                  size={24}
                  color="#3B82F6"
                />
              </View>
              
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-800 mb-1">
                  {location.name}
                </Text>
                <Text className="text-sm text-gray-600 mb-2">
                  {location.address}
                </Text>
                <View className="flex-row items-center">
                  <Ionicons name="location" size={16} color="#6B7280" />
                  <Text className="text-sm text-gray-500 ml-1">
                    {location.distance.toFixed(1)} km away
                  </Text>
                  {location.phone && (
                    <>
                      <Text className="text-gray-300 mx-2">•</Text>
                      <TouchableOpacity onPress={() => callLocation(location.phone!)}>
                        <View className="flex-row items-center">
                          <Ionicons name="call" size={16} color="#3B82F6" />
                          <Text className="text-sm text-blue-600 ml-1">
                            Call
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
              
              <View className="items-center">
                <View className="bg-green-100 rounded-full px-3 py-1 mb-2">
                  <Text className="text-xs font-semibold text-green-800 capitalize">
                    {location.type.replace('_', ' ')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
        
        {safeLocations.length === 0 && (
          <View className="flex-1 justify-center items-center py-12">
            <Ionicons name="location-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 text-lg mt-4">
              No safe locations found within 5km
            </Text>
            <TouchableOpacity
              className="mt-4 bg-blue-500 px-6 py-3 rounded-lg"
              onPress={loadData}
            >
              <Text className="text-white font-semibold">Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Footer Navigation */}
      <FooterNavigation activeTab="map" />
    </SafeAreaView>
  );
}