import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from "expo-router";
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { auth, db } from '../../config/firebase-config';
import userNotificationInit from '../../lib/userNotificationInit';

interface UserBadgeData {
    quizCompleted?: boolean;
    knowledgeLevel?: string;
    riskAssessmentCompleted?: boolean;
}

interface DashboardBadge {
    icon: any;
    iconColor: string;
    bgColor: string;
}

export default function UserDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [userName, setUserName] = useState('User');
    const [userLocation, setUserLocation] = useState<string>('Getting location...');
    const [loading, setLoading] = useState(true);
    const [earnedBadges, setEarnedBadges] = useState<DashboardBadge[]>([]);
    const [totalBadgeCount, setTotalBadgeCount] = useState(0);
    const [recentNotifications, setRecentNotifications] = useState<any[]>([]);

    // Function to refresh badge data
    const refreshBadges = useCallback(async () => {
        if (auth.currentUser) {
            try {
                const userDocRef = doc(db, 'users', auth.currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    loadUserBadges(userData as UserBadgeData);
                }
            } catch (error) {
                console.error('Error refreshing badges:', error);
            }
        }
    }, []);

    // Refresh badges every time the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            refreshBadges();
        }, [refreshBadges])
    );

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            
            if (currentUser) {
                try {
                    // Initialize user notifications
                    await userNotificationInit.initializeUserNotifications(currentUser.uid);

                    const userDocRef = doc(db, 'users', currentUser.uid);
                    const userDoc = await getDoc(userDocRef);
                    
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        // Use name from Firestore
                        const name = userData.name || currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
                        setUserName(name);
                        
                        // Load badge data
                        loadUserBadges(userData as UserBadgeData);
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

        return () => {
            unsubscribe();
            // Clean up notification listeners
            userNotificationInit.cleanup();
        };
    }, []);

    const loadUserBadges = (userData: UserBadgeData) => {
        const badges: DashboardBadge[] = [];
        const totalBadges = 5; // Quiz + 3 Knowledge Levels + Risk Assessment
        
        // Quiz Completer Badge
        if (userData.quizCompleted) {
            badges.push({
                icon: 'checkmark-circle',
                iconColor: '#FFFFFF',
                bgColor: 'bg-green-500'
            });
        }

        // Progressive Knowledge Level Badges
        const isAdvanced = userData.knowledgeLevel === 'advanced';
        const isIntermediate = userData.knowledgeLevel === 'intermediate';
        const isBeginner = userData.knowledgeLevel === 'beginner';

        // Bronze (Beginner)
        if (isBeginner || isIntermediate || isAdvanced) {
            badges.push({
                icon: 'medal',
                iconColor: '#FFFFFF',
                bgColor: 'bg-orange-400'
            });
        }

        // Silver (Intermediate)
        if (isIntermediate || isAdvanced) {
            badges.push({
                icon: 'medal',
                iconColor: '#FFFFFF',
                bgColor: 'bg-gray-400'
            });
        }

        // Gold (Advanced)
        if (isAdvanced) {
            badges.push({
                icon: 'medal',
                iconColor: '#FFFFFF',
                bgColor: 'bg-yellow-500'
            });
        }

        // Risk Assessment Badge
        if (userData.riskAssessmentCompleted) {
            badges.push({
                icon: 'shield-checkmark',
                iconColor: '#FFFFFF',
                bgColor: 'bg-purple-500'
            });
        }

        setEarnedBadges(badges);
        setTotalBadgeCount(totalBadges);
    };

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

    // Fetch recent notifications from Firebase
    useEffect(() => {
        const q = query(
            collection(db, 'notifications'),
            orderBy('createdAt', 'desc'),
            limit(2)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs: any[] = [];
            snapshot.forEach((doc) => {
                notifs.push({ id: doc.id, ...doc.data() });
            });
            setRecentNotifications(notifs);
        }, (error) => {
            console.error('Error fetching recent notifications:', error);
        });

        return () => unsubscribe();
    }, []);

    // Format time as "X min/hours/days ago"
    const getTimeAgo = (timestamp: any) => {
        if (!timestamp) return '';
        try {
            const date = timestamp.toDate();
            const now = new Date();
            const diffInMs = now.getTime() - date.getTime();
            const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
            const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
            const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

            if (diffInMinutes < 1) return 'Just now';
            if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
            if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
            return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
        } catch (error) {
            return '';
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
                            <View className="flex-row items-center justify-between mb-2">
                                <Text className="text-white font-semibold text-base">
                                    Your Badges
                                </Text>
                                <View className="bg-orange-500 rounded-full px-2 py-1">
                                    <Text className="text-white text-xs font-bold">
                                        {earnedBadges.length}/{totalBadgeCount}
                                    </Text>
                                </View>
                            </View>
                            
                            {earnedBadges.length === 0 ? (
                                <View className="items-center justify-center py-2">
                                    <Ionicons name="lock-closed" size={32} color="#9CA3AF" />
                                    <Text className="text-gray-400 text-xs mt-1">No badges yet</Text>
                                </View>
                            ) : (
                                <View className="flex-row flex-wrap gap-2 mt-2">
                                    {earnedBadges.slice(0, 3).map((badge, index) => (
                                        <View 
                                            key={index}
                                            className={`${badge.bgColor} rounded-full w-9 h-9 items-center justify-center`}
                                        >
                                            <Ionicons 
                                                name={badge.icon} 
                                                size={20} 
                                                color={badge.iconColor} 
                                            />
                                        </View>
                                    ))}
                                    {earnedBadges.length > 3 && (
                                        <View className="bg-gray-600 rounded-full w-9 h-9 items-center justify-center">
                                            <Text className="text-white text-xs font-bold">
                                                +{earnedBadges.length - 3}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}
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
                        {recentNotifications.map((notification) => {
                        const icon = notification.type === 'warning' 
                            ? { name: 'warning' as const, color: '#EF4444', bg: 'bg-red-100' }
                            : { name: 'alert-circle' as const, color: '#3B82F6', bg: 'bg-blue-100' };
                        
                        return (
                            <TouchableOpacity 
                                key={notification.id}
                                className="bg-white rounded-xl p-3 flex-row items-center"
                                onPress={() => router.push('/notifications/notifications')}
                            >
                                <View className={`${icon.bg} rounded-full p-2 mr-3`}>
                                    <Ionicons name={icon.name} size={20} color={icon.color} />
                                </View>
                                <View className="flex-1">
                                    <Text className="font-semibold text-gray-800 text-lg">
                                        {notification.title}
                                    </Text>
                                    <Text className="text-gray-600 text-md" numberOfLines={1}>
                                        {notification.message}
                                    </Text>
                                </View>
                                <Text className="text-gray-500 text-md">
                                    {getTimeAgo(notification.createdAt)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
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