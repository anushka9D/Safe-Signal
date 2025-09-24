import React from 'react';
import { View, Text, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLocation } from './safeLocations';

interface MapFallbackProps {
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  safeLocations?: SafeLocation[];
  onLocationPress?: (location: SafeLocation) => void;
}

export default function MapFallback({ userLocation, safeLocations = [], onLocationPress }: MapFallbackProps) {
  const openExternalMap = () => {
    if (!userLocation || safeLocations.length === 0) return;

    // Create a URL that shows all locations
    const locations = [
      userLocation,
      ...safeLocations.map(loc => ({ latitude: loc.latitude, longitude: loc.longitude }))
    ];

    const centerLat = locations.reduce((sum, loc) => sum + loc.latitude, 0) / locations.length;
    const centerLng = locations.reduce((sum, loc) => sum + loc.longitude, 0) / locations.length;

    const url = Platform.select({
      ios: `http://maps.apple.com/?ll=${centerLat},${centerLng}&z=13`,
      android: `geo:${centerLat},${centerLng}?z=13`,
      default: `https://www.google.com/maps/@${centerLat},${centerLng},13z`
    });

    Linking.openURL(url || `https://www.google.com/maps/@${centerLat},${centerLng},13z`);
  };

  return (
    <View className="flex-1 bg-gradient-to-br from-blue-50 to-green-50 justify-center items-center p-6">
      <Ionicons name="map-outline" size={80} color="#6B7280" />
      
      <Text className="text-xl font-bold text-gray-800 mt-4 text-center">
        Interactive Map
      </Text>
      
      {userLocation && (
        <Text className="text-sm text-gray-600 mt-2 text-center">
          Your location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
        </Text>
      )}
      
      <Text className="text-sm text-gray-500 mt-2 text-center">
        Showing {safeLocations.length} safe locations nearby
      </Text>

      <TouchableOpacity
        className="bg-blue-500 px-6 py-3 rounded-lg mt-6"
        onPress={openExternalMap}
      >
        <Text className="text-white font-medium">Open in Maps App</Text>
      </TouchableOpacity>

      {/* Quick access to safe locations */}
      <View className="mt-6 w-full">
        <Text className="text-lg font-semibold text-gray-800 mb-3 text-center">
          Quick Access
        </Text>
        {safeLocations.slice(0, 3).map((location, index) => (
          <TouchableOpacity
            key={location.id}
            className="bg-white rounded-lg p-3 mb-2 flex-row items-center shadow-sm"
            onPress={() => onLocationPress?.(location)}
          >
            <Ionicons 
              name="location" 
              size={20} 
              color="#3B82F6" 
            />
            <View className="ml-3 flex-1">
              <Text className="font-medium text-gray-800">{location.name}</Text>
              <Text className="text-sm text-gray-500 capitalize">
                {location.type.replace('_', ' ')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}