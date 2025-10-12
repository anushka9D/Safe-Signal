import { Text, View, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../config/firebase-config';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import notificationService from '../../lib/notificationService';

interface Notification {
    id: string;
    type: 'alert' | 'warning';
    title: string;
    message: string;
    createdAt: any;
}

export default function Notifications() {
    const router = useRouter();
    const [activeFilter, setActiveFilter] = useState('All');
    const [expandedNotifications, setExpandedNotifications] = useState<Record<string, boolean>>({});
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Load read notifications from AsyncStorage
    useEffect(() => {
        loadReadNotifications();
    }, []);

    const loadReadNotifications = async () => {
        try {
            const readIds = await AsyncStorage.getItem('readNotifications');
            if (readIds) {
                setReadNotifications(new Set(JSON.parse(readIds)));
            }
        } catch (error) {
            console.error('Error loading read notifications:', error);
        }
    };

    // Fetch notifications from Firebase
    useEffect(() => {
        const q = query(
            collection(db, 'notifications'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs: Notification[] = [];
            snapshot.forEach((doc) => {
                notifs.push({ id: doc.id, ...doc.data() } as Notification);
            });
            setNotifications(notifs);
            setLoading(false);
            setRefreshing(false);
        }, (error) => {
            console.error('Error fetching notifications:', error);
            setLoading(false);
            setRefreshing(false);
        });

        return () => unsubscribe();
    }, []);

    // Mark notification as read (locally only)
    const markAsRead = async (notificationId: string) => {
        try {
            const newReadSet = new Set(readNotifications);
            newReadSet.add(notificationId);
            setReadNotifications(newReadSet);
            
            // Save to AsyncStorage
            await AsyncStorage.setItem('readNotifications', JSON.stringify(Array.from(newReadSet)));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Handle refresh
    const onRefresh = () => {
        setRefreshing(true);
    };

    // Check if notification is read
    const isNotificationRead = (notificationId: string) => {
        return readNotifications.has(notificationId);
    };

    // Filter notifications
    const getFilteredNotifications = () => {
        switch (activeFilter) {
            case 'Read':
                return notifications.filter(notification => isNotificationRead(notification.id));
            case 'Unread':
                return notifications.filter(notification => !isNotificationRead(notification.id));
            default:
                return notifications;
        }
    };

    // Get first sentence of a message
    const getFirstSentence = (message: string) => {
        const firstSentence = message.split('.')[0];
        return firstSentence + (message.includes('.') ? '.' : '');
    };

    // Toggle expanded state for a notification
    const toggleExpanded = (notificationId: string) => {
        setExpandedNotifications(prev => ({
            ...prev,
            [notificationId]: !prev[notificationId]
        }));
    };

    // Format date
    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        try {
            const date = timestamp.toDate();
            const options: Intl.DateTimeFormatOptions = { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            return date.toLocaleDateString('en-GB', options).replace(',', ' at');
        } catch (error) {
            return '';
        }
    };

    // Get icon based on notification type
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'warning':
                return { name: 'warning' as const, color: '#DC2626' };
            case 'alert':
            default:
                return { name: 'alert-circle' as const, color: '#d60000ff' };
        }
    };

    const filteredNotifications = getFilteredNotifications();
    const unreadCount = notifications.filter(n => !isNotificationRead(n.id)).length;

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
                <ActivityIndicator size="large" color="#EC4899" />
                <Text className="text-gray-500 mt-4">Loading notifications...</Text>
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
                        className="p-2"
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#4B5563" />
                    </TouchableOpacity>
                    <View className="flex-1 ml-4">
                        <Text className="text-xl font-semibold text-gray-700">
                            Notifications
                        </Text>
                        {unreadCount > 0 && (
                            <Text className="text-xs text-gray-500 mt-0.5">
                                {unreadCount} unread
                            </Text>
                        )}
                    </View>
                    <View className="w-8" />
                </View>

                {/* Filter Tabs */}
                <View className="flex-row mt-6 mb-2">
                    <TouchableOpacity 
                        className={`rounded-full px-6 py-2 mr-3 ${activeFilter === 'All' ? 'bg-pink-500' : 'bg-gray-200'}`}
                        onPress={() => setActiveFilter('All')}
                    >
                        <Text className={`font-medium ${activeFilter === 'All' ? 'text-white' : 'text-gray-600'}`}>
                            All {notifications.length > 0 && `(${notifications.length})`}
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
                            Unread {unreadCount > 0 && `(${unreadCount})`}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Notifications List */}
            <ScrollView 
                className="flex-1 px-4 pt-4"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#EC4899"
                        colors={['#EC4899']}
                    />
                }
            >
                {filteredNotifications.length === 0 ? (
                    <View className="flex-1 items-center justify-center mt-20">
                        <Ionicons name="notifications-off-outline" size={48} color="#9CA3AF" />
                        <Text className="text-gray-500 text-center mt-4 text-lg">
                            No {activeFilter.toLowerCase()} notifications
                        </Text>
                        <Text className="text-gray-400 text-center mt-2 text-sm">
                            {activeFilter === 'All' 
                                ? "You'll receive notifications from admin here"
                                : `No ${activeFilter.toLowerCase()} notifications at the moment`
                            }
                        </Text>
                    </View>
                ) : (
                    filteredNotifications.map((notification) => {
                        const isExpanded = expandedNotifications[notification.id];
                        const isUnread = !isNotificationRead(notification.id);
                        const displayMessage = isExpanded ? notification.message : getFirstSentence(notification.message);
                        const needsExpand = notification.message.length > 100;
                        const icon = getNotificationIcon(notification.type);
                        
                        return (
                            <TouchableOpacity
                                key={notification.id}
                                onPress={() => {
                                    if (isUnread) {
                                        markAsRead(notification.id);
                                    }
                                }}
                                activeOpacity={0.7}
                            >
                                <View 
                                    className={`mb-4 p-4 rounded-lg ${isUnread ? 'bg-white shadow-sm border-l-4 border-pink-500' : 'bg-gray-100'}`}
                                >
                                    <View className="flex-row items-start">
                                        <View className="mr-3 mt-1">
                                            <Ionicons name={icon.name} size={24} color={icon.color} />
                                        </View>
                                        <View className="flex-1">
                                            <View className="flex-row items-center justify-between mb-1">
                                                <Text className={`text-xs uppercase tracking-wide font-semibold ${isUnread ? 'text-pink-500' : 'text-gray-400'}`}>
                                                    {notification.type}
                                                </Text>
                                                {isUnread && (
                                                    <View className="w-2 h-2 bg-pink-500 rounded-full" />
                                                )}
                                            </View>
                                            <Text className={`font-semibold mb-2 ${isUnread ? 'text-gray-800' : 'text-gray-500'}`}>
                                                {notification.title}
                                            </Text>
                                            <Text className={`text-sm leading-5 mb-3 ${isUnread ? 'text-gray-600' : 'text-gray-400'}`}>
                                                {displayMessage}
                                            </Text>
                                            {needsExpand && (
                                                <TouchableOpacity 
                                                    onPress={() => toggleExpanded(notification.id)}
                                                    className="mb-2"
                                                >
                                                    <Text className="text-pink-500 text-sm font-medium">
                                                        {isExpanded ? '← View less' : 'View more →'}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                            <Text className={`text-xs ${isUnread ? 'text-gray-500' : 'text-gray-400'}`}>
                                                {formatDate(notification.createdAt)}
                                            </Text>
                                            {/* Button to navigate to nearest safe location */}
                                            <TouchableOpacity
                                                className="mt-3 bg-blue-500 rounded-lg py-2 px-4 flex-row items-center self-start"
                                                onPress={() => router.push('/map-navigation?nearestOnly=true&autoStart=true' as any)}
                                            >
                                                <Ionicons name="navigate" size={16} color="white" />
                                                <Text className="text-white text-sm font-medium ml-2">
                                                    Nearest Safe Location
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
                
                {/* Bottom spacing */}
                <View className="h-4" />
            </ScrollView>
        </SafeAreaView>
    );
}