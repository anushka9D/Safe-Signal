import { Text, View, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

export default function Notifications() {
    const router = useRouter();
    const [activeFilter, setActiveFilter] = useState('All');

        const notifications = [
        {
            id: 1,
            type: "alert",
            title: "🌊 FLOOD WARNING:",
            message: "River levels rising rapidly due to continuous rainfall. Residents in low-lying areas are advised to evacuate to safer locations.",
            date: "24 Sep 2025 at 14:35",
            hasMore: true,
            isRead: true
        },
        {
            id: 2,
            type: "alert",
            title: "🌍 EARTHQUAKE DETECTED:",
            message: "A 6.2 magnitude earthquake was recorded 12 km from your location. Expect aftershocks. Avoid damaged buildings.",
            date: "24 Sep 2025 at 13:50",
            hasMore: true,
            isRead: true
        },
        {
            id: 3,
            type: "alert",
            title: "🌪️ STORM ALERT:",
            message: "Severe thunderstorm expected in your area within the next hour. Stay indoors and secure loose objects outdoors.",
            date: "23 Sep 2025 at 19:20",
            hasMore: true,
            isRead: false
        },
        {
            id: 4,
            type: "alert",
            title: "🏔️ LANDSLIDE WARNING:",
            message: "High risk of landslides due to saturated soil and continuous rainfall. Avoid hillside roads and stay alert for evacuation orders.",
            date: "23 Sep 2025 at 17:05",
            hasMore: true,
            isRead: false
        },
        {
            id: 5,
            type: "alert",
            title: "🌊 FLOOD EVACUATION NOTICE:",
            message: "Immediate evacuation advised in Zone 4 due to overflowing riverbanks. Emergency shelters are open nearby.",
            date: "22 Sep 2025 at 21:15",
            hasMore: true,
            isRead: false
        },
        {
            id: 6,
            type: "alert",
            title: "🌍 EARTHQUAKE AFTERSHOCK ALERT:",
            message: "Multiple aftershocks detected following this morning's quake. Remain cautious and follow safety protocols.",
            date: "22 Sep 2025 at 19:45",
            hasMore: true,
            isRead: false
        }
    ];

    // Filter notifications
    const getFilteredNotifications = () => {
        switch (activeFilter) {
            case 'Read':
                return notifications.filter(notification => notification.isRead);
            case 'Unread':
                return notifications.filter(notification => !notification.isRead);
            default:
                return notifications;
        }
    };

    const filteredNotifications = getFilteredNotifications();

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            {/* Header */}
            <View className="bg-white shadow-sm px-6 py-4 pt-12">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                        className="p-2"
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#4B5563" />
                    </TouchableOpacity>
                    <Text className="text-xl font-semibold text-gray-700 flex-1 ml-4">
                        Notifications
                    </Text>
                    <View className="w-8" />
                </View>

                {/* Filter Tabs */}
                <View className="flex-row mt-6 mb-2">
                    <TouchableOpacity 
                        className={`rounded-full px-6 py-2 mr-3 ${activeFilter === 'All' ? 'bg-pink-500' : 'bg-gray-200'}`}
                        onPress={() => setActiveFilter('All')}
                    >
                        <Text className={`font-medium ${activeFilter === 'All' ? 'text-white' : 'text-gray-600'}`}>
                            All
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        className={`rounded-full px-6 py-2 mr-3 ${activeFilter === 'Read' ? 'bg-pink-500' : 'bg-gray-200'}`}
                        onPress={() => setActiveFilter('Read')}
                    >
                        <Text className={`font-medium ${activeFilter === 'Read' ? 'text-white' : 'text-gray-600'}`}>
                            Read
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        className={`rounded-full px-6 py-2 ${activeFilter === 'Unread' ? 'bg-pink-500' : 'bg-gray-200'}`}
                        onPress={() => setActiveFilter('Unread')}
                    >
                        <Text className={`font-medium ${activeFilter === 'Unread' ? 'text-white' : 'text-gray-600'}`}>
                            Unread
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Notifications List */}
            <ScrollView className="flex-1 px-4 pt-4">
                {filteredNotifications.length === 0 ? (
                    <View className="flex-1 items-center justify-center mt-20">
                        <Ionicons name="notifications-off-outline" size={48} color="#9CA3AF" />
                        <Text className="text-gray-500 text-center mt-4 text-lg">
                            No {activeFilter.toLowerCase()} notifications
                        </Text>
                    </View>
                ) : (
                    filteredNotifications.map((notification, index) => (
                        <View 
                            key={notification.id} 
                            className={`mb-4 p-4 rounded-lg ${notification.isRead ? 'bg-gray-100' : 'bg-white'} ${notification.isRead ? '' : 'shadow-sm'}`}
                        >
                            <View className="flex-row items-start">
                                <View className="mr-3 mt-1">
                                    <Ionicons name="alert-circle" size={24} color="#d60000ff" />
                                </View>
                                <View className="flex-1">
                                    <Text className={`font-medium mb-2 ${notification.isRead ? 'text-gray-500' : 'text-gray-700'}`}>
                                        {notification.title}
                                    </Text>
                                    <Text className={`text-sm leading-5 mb-3 ${notification.isRead ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {notification.message}
                                        {notification.hasMore && (
                                            <Text className="text-pink-500 font-medium"> View more</Text>
                                        )}
                                    </Text>
                                    <Text className={`text-xs ${notification.isRead ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {notification.date}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}