import React from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FooterNavigationProps {
  activeTab?: 'home' | 'map' | 'family' | 'resources' | 'status';
}

export default function FooterNavigation({ activeTab = 'home' }: FooterNavigationProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const navigateToPage = (page: string) => {
    switch (page) {
      case 'home':
        router.push('/user/dashboard' as any);
        break;
      case 'map':
        router.push('/map-navigation' as any);
        break;
      case 'family':
        router.push('/map-navigation/familyadd' as any);
        break;
      case 'resources':
        console.log('Resources button pressed');
        break;
      case 'status':
        router.push('/map-navigation/statusadd' as any);
        break;
      default:
        break;
    }
  };

  const getIconColor = (tab: string) => {
    return activeTab === tab ? '#007AFF' : '#9CA3AF';
  };

  const footerStyle = Platform.select({
    web: {
      position: 'fixed' as const,
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      backgroundColor: '#374151',
      borderTopWidth: 1,
      borderTopColor: '#4B5563',
      paddingBottom: Math.max(insets.bottom, 8),
      minHeight: 70
    },
    default: {
      position: 'absolute' as const,
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      elevation: 10,
      backgroundColor: '#374151',
      borderTopWidth: 1,
      borderTopColor: '#4B5563',
      paddingBottom: Math.max(insets.bottom, 8),
      minHeight: 70
    }
  });

  return (
    <View style={footerStyle}>
      <View className="flex-row justify-around items-center py-3">
        {/* Home */}
        <TouchableOpacity
          className="flex-1 items-center py-2"
          onPress={() => navigateToPage('home')}
        >
          <Ionicons 
            name="home" 
            size={24} 
            color={getIconColor('home')} 
          />
          <Text 
            className="text-xs mt-1"
            style={{ color: activeTab === 'home' ? '#007AFF' : '#9CA3AF' }}
          >
            Home
          </Text>
        </TouchableOpacity>

        {/* Map */}
        <TouchableOpacity
          className="flex-1 items-center py-2"
          onPress={() => navigateToPage('map')}
        >
          <Ionicons 
            name="location" 
            size={24} 
            color={getIconColor('map')} 
          />
          <Text 
            className="text-xs mt-1"
            style={{ color: activeTab === 'map' ? '#007AFF' : '#9CA3AF' }}
          >
            Map
          </Text>
        </TouchableOpacity>

        {/* Family */}
        <TouchableOpacity
          className="flex-1 items-center py-2"
          onPress={() => navigateToPage('family')}
        >
          <Ionicons 
            name="people" 
            size={24} 
            color={getIconColor('family')} 
          />
          <Text 
            className="text-xs mt-1"
            style={{ color: activeTab === 'family' ? '#007AFF' : '#9CA3AF' }}
          >
            Family
          </Text>
        </TouchableOpacity>

        {/* Resources */}
        <TouchableOpacity
          className="flex-1 items-center py-2"
          onPress={() => navigateToPage('resources')}
        >
          <Ionicons 
            name="book" 
            size={24} 
            color={getIconColor('resources')} 
          />
          <Text 
            className="text-xs mt-1"
            style={{ color: activeTab === 'resources' ? '#007AFF' : '#9CA3AF' }}
          >
            Resources
          </Text>
        </TouchableOpacity>

        {/* Status */}
        <TouchableOpacity
          className="flex-1 items-center py-2"
          onPress={() => navigateToPage('status')}
        >
          <Ionicons 
            name="heart" 
            size={24} 
            color={getIconColor('status')} 
          />
          <Text 
            className="text-xs mt-1"
            style={{ color: activeTab === 'status' ? '#007AFF' : '#9CA3AF' }}
          >
            Status
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}