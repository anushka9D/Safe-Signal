import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from "expo-router";
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { auth, db } from '../../config/firebase-config';

export default function UserDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [userName, setUserName] = useState('User');
    const [userLocation, setUserLocation] = useState<string>('Getting location...');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            
            if (currentUser) {
                try {
                    const userDocRef = doc(db, 'users', currentUser.uid);
                    const userDoc = await getDoc(userDocRef);
                    
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        // Use name from Firestore
                        const name = userData.name || currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
                        setUserName(name);
                    } else {
                        // Fallback to auth user data
                        const name = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
                        setUserName(name);
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    const name = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
                    setUserName(name);
                }
            } else {
                setUserName('User');
            }
            setLoading(false);
        });

        getCurrentLocation();

        return unsubscribe;
    }, []);

    const getCurrentLocation = async () => {
        try {
            // Request permission
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setUserLocation('Location access denied');
                return;
            }

            // Get current location
            let location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced
            });

            // Reverse geocode to get address
            let reverseGeocode = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });

            if (reverseGeocode.length > 0) {
                const address = reverseGeocode[0];
                // Format the location string
                const locationString = `${address.city || address.subregion || 'Unknown City'}${address.region ? '\n' + address.region : ''}`;
                setUserLocation(locationString);
            } else {
                setUserLocation('Location unavailable');
            }
        } catch (error) {
            console.error('Error getting location:', error);
            setUserLocation('Unable to get location');
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

                {/* Header Section */}
                <View className="bg-white px-6 py-4 pt-12 mt-4 mb-4">

                    <View className="flex-row items-center justify-between mb-6">
                        <View className="flex-1">
                            <Text className="text-xl font-bold text-gray-800">
                                Welcome
                            </Text>
                            <Text className="text-xl font-bold text-gray-800">
                                {loading ? 'Loading...' : userName}
                            </Text>
                        </View>

                        <View className="flex-row space-x-5 gap-3">
                            <TouchableOpacity
                                className="bg-gray-100 rounded-full p-2"
                                onPress={() => router.push('/user/profile')}
                            >
                                <Ionicons name="person" size={35} color="#4B5563" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="bg-gray-100 rounded-full p-2"
                                onPress={() => router.push('/notifications/notifications')}
                            >
                                <Ionicons name="notifications" size={35} color="#4B5563" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="bg-gray-100 rounded-full p-2"
                                onPress={() => router.push('/settings/settings')}
                            >
                                <Ionicons name="settings" size={35} color="#4B5563" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Upper Cards */}
                    <View className="flex-row space-x-4 gap-4">

                        {/* Badges */}
                        <TouchableOpacity
                            className="bg-gray-800 rounded-2xl p-4 flex-1"
                            onPress={() => router.push('/badges/badges')}
                        >
                            <Text className="text-white font-semibold text-base mb-3 text-center">
                                Your Badges
                            </Text>
                            <View className="flex-row space-x-2 gap-3">
                                <View className="bg-yellow-100 rounded-full w-11 h-11 items-center justify-center">
                                    <Text className="text-white text-lg font-bold">🏆</Text>
                                </View>
                                <View className="bg-gray-100 rounded-full w-11 h-11 items-center justify-center">
                                    <Text className="text-white text-lg font-bold">⭐</Text>
                                </View>
                                <View className="bg-yellow-100 rounded-full w-11 h-11 items-center justify-center">
                                    <Text className="text-white text-lg font-bold">🥉</Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* Saved Location */}
                        <TouchableOpacity
                            className="bg-gray-800 rounded-2xl p-4 flex-1"
                            onPress={getCurrentLocation}
                        >
                            <Text className="text-white font-semibold text-base mb-2 text-center">
                                Saved Location
                            </Text>
                            <Text className="text-white text-lg font-bold text-center">
                                {userLocation}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Recent Notifications Section */}
                <View className="bg-gray-800 mx-4 rounded-2xl p-4 mb-6 pb-6">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-white font-semibold text-lg">
                            Recent Notifications
                        </Text>

                        <TouchableOpacity onPress={() => router.push('/notifications/notifications')}>
                            <Text className="text-gray-300 text-sm">
                                See All
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Notifications */}
                    <View className="space-y-3 gap-4">
                        <TouchableOpacity className="bg-white rounded-xl p-3 flex-row items-center">
                            <View className="bg-blue-100 rounded-full p-2 mr-3">
                                <Ionicons name="water" size={20} color="#3B82F6" />
                            </View>
                            <View className="flex-1">
                                <Text className="font-semibold text-gray-800 text-lg">Flood</Text>
                                <Text className="text-gray-600 text-md">Location : Kalutara</Text>
                            </View>

                            <Text className="text-gray-500 text-md">5 min ago</Text>
                        </TouchableOpacity>

                        <TouchableOpacity className="bg-white rounded-xl p-3 flex-row items-center">
                            <View className="bg-red-100 rounded-full p-2 mr-3">
                                <Ionicons name="thunderstorm" size={20} color="#EF4444" />
                            </View>
                            <View className="flex-1">
                                <Text className="font-semibold text-gray-800 text-lg">Tropical Cyclone</Text>
                                <Text className="text-gray-600 text-md">Location : Gampaha</Text>
                            </View>

                            <Text className="text-gray-500 text-md">24 min ago</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Risk Assessment Quiz */}
                <TouchableOpacity
                    className="bg-gray-800 mx-4 rounded-2xl p-6 mb-4"
                    onPress={() => router.push('/quiz/riskAssessmentSummary')}
                >
                    <Text className="text-white text-xl font-bold text-center">
                        Risk Assessment Quiz
                    </Text>
                </TouchableOpacity>

                {/* Disaster Categories Grid */}
                <View className="px-4 mb-4">
                    <View className="flex-row space-x-4 mb-4 gap-4">
                        <TouchableOpacity
                            className="bg-gray-800 rounded-2xl p-6 flex-1 items-center justify-center h-24"
                            onPress={() => router.push('/disaster-screen/flood')}
                        >
                            <Text className="text-white text-lg font-bold">
                                Floods
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="bg-gray-800 rounded-2xl p-6 flex-1 items-center justify-center h-24"
                            onPress={() => router.push('/disaster-screen/earthquake')}
                        >
                            <Text className="text-white text-lg font-bold">
                                Earthquake
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row space-x-4 gap-4">
                        <TouchableOpacity
                            className="bg-gray-800 rounded-2xl p-6 flex-1 items-center justify-center h-24"
                            onPress={() => router.push('/disaster-screen/landSlide')}
                        >
                            <Text className="text-white text-lg font-bold">
                                Landslides
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="bg-gray-800 rounded-2xl p-6 flex-1 items-center justify-center h-24"
                            onPress={() => router.push('/disaster-screen/storm')}
                        >
                            <Text className="text-white text-lg font-bold">
                                Storms
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Donate & Help */}
                <TouchableOpacity
                    className="bg-gray-800 mx-4 rounded-2xl p-6 mb-8"
                    onPress={() => router.push('/donation/dashboard')}
                >
                    <Text className="text-white text-xl font-bold text-center">
                        Donate & Help
                    </Text>
                </TouchableOpacity>

            </ScrollView>

            {/* Floating Map Button */}
            <TouchableOpacity
                className="absolute bottom-20 right-8 bg-blue-500 rounded-full p-4 shadow-lg"
                onPress={() => router.push('/map-navigation/' as any)} 
            >
                <Ionicons name="map" size={40} color="white" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}