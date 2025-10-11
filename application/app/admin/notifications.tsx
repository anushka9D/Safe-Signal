import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { db } from '../../config/firebase-config';
import { collection, query, onSnapshot, orderBy, Timestamp, deleteDoc, doc } from 'firebase/firestore';

type NotificationType = 'alert' | 'warning';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: Date;
  createdAt: Timestamp;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Fetch notifications from Firebase
  useEffect(() => {
    const q = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          message: data.message,
          type: data.type,
          timestamp: data.createdAt?.toDate() || new Date(),
          createdAt: data.createdAt
        } as Notification;
      });
      setNotifications(notificationsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter notifications based on selected filter
  const filteredNotifications = notifications.filter(notification => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'alerts') return notification.type === 'alert';
    if (selectedFilter === 'warnings') return notification.type === 'warning';
    return true;
  });

  // Get notification stats
  const stats = {
    total: notifications.length,
    todayTotal: notifications.filter(n => {
      const today = new Date();
      return n.timestamp.toDateString() === today.toDateString();
    }).length,
    todayAlerts: notifications.filter(n => {
      const today = new Date();
      return n.timestamp.toDateString() === today.toDateString() && n.type === 'alert';
    }).length,
    todayWarnings: notifications.filter(n => {
      const today = new Date();
      return n.timestamp.toDateString() === today.toDateString() && n.type === 'warning';
    }).length
  };

  // Format timestamp
  const formatTime = (timestamp: Date) => {
    const now = new Date().getTime();
    const diff = now - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  // Get type color
  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case 'alert': return '#eab308'; // yellow
      case 'warning': return '#ef4444'; // red
      default: return '#6b7280';
    }
  };

  // Get type icon
  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'alert': return 'warning';
      case 'warning': return 'alert-circle';
      default: return 'notifications';
    }
  };

  const handleAddNotification = () => {
    router.push('/admin/addNotification');
  };

    // Send emergency alert
    const handleEmergencyAlert = () => {
      Alert.alert('Send Emergency Alert','This will send an immediate emergency notification to all users. Continue?');
    };

  const handleDeleteNotification = (notificationId: string, notificationTitle: string) => {
    Alert.alert(
      'Delete Notification',
      `Are you sure you want to delete "${notificationTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'notifications', notificationId));
            } catch (error) {
              console.error('Error deleting notification:', error);
              Alert.alert('Error', 'Failed to delete notification');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0b1220]">
      {/* Header */}
      <View className="px-5 py-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-2xl font-bold">Notifications</Text>
          <TouchableOpacity
            className="bg-[#1e293b] p-2 rounded-lg"
            onPress={() => setShowStatsModal(true)}
          >
            <Ionicons name="stats-chart" size={20} color="#60a5fa" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View className="flex-row justify-between mb-4">
          <View className="bg-[#1e293b] p-3 rounded-lg flex-1 mr-2">
            <Text className="text-gray-400 text-xs">Total</Text>
            <Text className="text-white text-lg font-bold">{stats.total}</Text>
          </View>
          <View className="bg-[#1e293b] p-3 rounded-lg flex-1 mx-1">
            <Text className="text-gray-400 text-xs">Today Total</Text>
            <Text className="text-blue-400 text-lg font-bold">{stats.todayTotal}</Text>
          </View>
          <View className="bg-[#1e293b] p-3 rounded-lg flex-1 mx-1">
            <Text className="text-gray-400 text-xs">Today Alerts</Text>
            <Text className="text-yellow-400 text-lg font-bold">{stats.todayAlerts}</Text>
          </View>
          <View className="bg-[#1e293b] p-3 rounded-lg flex-1 ml-2">
            <Text className="text-gray-400 text-xs">Today Warnings</Text>
            <Text className="text-red-400 text-lg font-bold">{stats.todayWarnings}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row space-x-3 mb-4">
          <TouchableOpacity
            className="flex-1 bg-[#3b82f6] p-4 rounded-lg flex-row items-center justify-center"
            onPress={handleAddNotification}
          >
            <Ionicons name="add-circle" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Add Notification</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="flex-1 bg-[#dc2626] p-4 rounded-lg flex-row items-center justify-center ml-3"
            onPress={handleEmergencyAlert}
          >
            <Ionicons name="warning" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Emergency Alert</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Buttons */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <View className="flex-row space-x-2">
            {[
              { key: 'all', label: 'All', count: stats.total },
              { key: 'alerts', label: 'Alerts', count: notifications.filter(n => n.type === 'alert').length },
              { key: 'warnings', label: 'Warnings', count: notifications.filter(n => n.type === 'warning').length }
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                className={`px-4 py-2 rounded-full ${
                  selectedFilter === filter.key ? 'bg-[#3b82f6]' : 'bg-[#1e293b]'
                }`}
                onPress={() => setSelectedFilter(filter.key)}
              >
                <Text className={`font-medium ${
                  selectedFilter === filter.key ? 'text-white' : 'text-gray-300'
                }`}>
                  {filter.label} ({filter.count})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Notifications List */}
      <ScrollView className="flex-1 px-5">
        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#f97316" />
            <Text className="text-gray-400 text-lg mt-4">Loading notifications...</Text>
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="notifications-off" size={64} color="#374151" />
            <Text className="text-gray-400 text-lg mt-4">No notifications found</Text>
            <Text className="text-gray-500 text-sm mt-2">Try adjusting your filters</Text>
          </View>
        ) : (
          filteredNotifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              className="bg-[#1e293b] p-4 rounded-lg mb-3 border-l-4"
              style={{ borderLeftColor: getTypeColor(notification.type) }}
            >
              <View className="flex-row items-start">
                <View 
                  className="w-3 h-3 rounded-full mr-3 mt-2"
                  style={{ backgroundColor: getTypeColor(notification.type) }}
                />
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="font-semibold text-white">
                      {notification.title}
                    </Text>
                    <View className="flex-row items-center">
                      <TouchableOpacity
                        onPress={() => handleDeleteNotification(notification.id, notification.title)}
                        className="mr-3"
                      >
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                      <Ionicons 
                        name={getTypeIcon(notification.type)} 
                        size={16} 
                        color="#9ca3af" 
                      />
                      <Text className="text-gray-400 text-xs ml-2">
                        {formatTime(notification.timestamp)}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-sm leading-5 text-gray-400">
                    {notification.message}
                  </Text>
                  <View className="flex-row items-center justify-between mt-3">
                    <View className="flex-row items-center">
                      <View className={`px-2 py-1 rounded-full ${
                        notification.type === 'alert' ? 'bg-yellow-900' : 'bg-red-900'
                      }`}>
                        <Text className={`text-xs font-medium ${
                          notification.type === 'alert' ? 'text-yellow-300' : 'text-red-300'
                        }`}>
                          {notification.type.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Stats Modal */}
      <Modal
        visible={showStatsModal}
        animationType="slide"
        transparent={true}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-[#1e293b] rounded-2xl p-6 w-full max-w-sm">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white text-xl font-bold">Statistics</Text>
              <TouchableOpacity onPress={() => setShowStatsModal(false)}>
                <Ionicons name="close" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View className="space-y-4">
              <View className="flex-row justify-between py-2">
                <Text className="text-gray-300">Total Notifications</Text>
                <Text className="text-white font-bold">{stats.total}</Text>
              </View>
              <View className="flex-row justify-between py-2">
                <Text className="text-gray-300">Today Total</Text>
                <Text className="text-blue-400 font-bold">{stats.todayTotal}</Text>
              </View>
              <View className="h-px bg-gray-600 my-2" />
              <View className="flex-row justify-between py-2">
                <Text className="text-gray-300">Today Alerts</Text>
                <Text className="text-yellow-400 font-bold">{stats.todayAlerts}</Text>
              </View>
              <View className="flex-row justify-between py-2">
                <Text className="text-gray-300">Today Warnings</Text>
                <Text className="text-red-400 font-bold">{stats.todayWarnings}</Text>
              </View>
              <View className="h-px bg-gray-600 my-2" />
              <View className="flex-row justify-between py-2">
                <Text className="text-gray-300">Total Alerts</Text>
                <Text className="text-yellow-400 font-bold">
                  {notifications.filter(n => n.type === 'alert').length}
                </Text>
              </View>
              <View className="flex-row justify-between py-2">
                <Text className="text-gray-300">Total Warnings</Text>
                <Text className="text-red-400 font-bold">
                  {notifications.filter(n => n.type === 'warning').length}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}