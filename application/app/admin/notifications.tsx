import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View, TouchableOpacity, ScrollView, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

export default function Notifications() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "🌊 Flood Warning",
      message: "River levels rising rapidly in Zone 4. Immediate evacuation recommended.",
      type: "emergency",
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      priority: "high"
    },
    {
      id: 2,
      title: "🌍 Earthquake Alert",
      message: "6.2 magnitude earthquake detected 12km from your location.",
      type: "emergency",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      priority: "high"
    },
    {
      id: 3,
      title: "🌤️ Weather Update",
      message: "Sunny weather expected tomorrow with temperatures reaching 28°C.",
      type: "weather",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      priority: "low"
    },
    {
      id: 4,
      title: "📱 System Maintenance",
      message: "Scheduled maintenance will occur tonight from 2AM to 4AM.",
      type: "system",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      priority: "medium"
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'general',
    priority: 'medium'
  });
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Filter notifications based on selected filter
  const filteredNotifications = notifications.filter(notification => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'notifications') return notification.type !== 'emergency';
    if (selectedFilter === 'alerts') return notification.type === 'emergency';
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
      return n.timestamp.toDateString() === today.toDateString() && n.type === 'emergency';
    }).length
  };

  // Format timestamp
  const formatTime = (timestamp:number) => {
    const now = new Date().getTime();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  // Get priority color
  const getPriorityColor = (priority:String) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  // Get type icon
  const getTypeIcon = (type:String) => {
    switch (type) {
      case 'emergency': return 'warning';
      case 'weather': return 'partly-sunny';
      case 'system': return 'settings';
      default: return 'notifications';
    }
  };

  // Add new notification
  const handleAddNotification = () => {
    if (!newNotification.title.trim() || !newNotification.message.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const notification = {
      id: Date.now(),
      ...newNotification,
      timestamp: new Date()
    };

    setNotifications(prev => [notification, ...prev]);
    setNewNotification({ title: '', message: '', type: 'general', priority: 'medium' });
    setShowAddModal(false);
    Alert.alert('Success', 'Notification added successfully!');
  };

  // Send emergency alert
  const handleEmergencyAlert = () => {
    Alert.alert(
      'Send Emergency Alert',
      'This will send an immediate emergency notification to all users. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Alert',
          style: 'destructive',
          onPress: () => {
            const emergencyNotification = {
              id: Date.now(),
              title: '🚨 Emergency Alert',
              message: 'Emergency situation detected. Please follow safety protocols and stay alert.',
              type: 'emergency',
              priority: 'high',
              timestamp: new Date()
            };
            setNotifications(prev => [emergencyNotification, ...prev]);
            Alert.alert('Emergency Alert Sent', 'Emergency notification has been broadcast to all users.');
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
            <Text className="text-gray-400 text-xs">Total Notifications</Text>
            <Text className="text-white text-lg font-bold">{stats.total}</Text>
          </View>
          <View className="bg-[#1e293b] p-3 rounded-lg flex-1 mx-1">
            <Text className="text-gray-400 text-xs">Today Total</Text>
            <Text className="text-blue-400 text-lg font-bold">{stats.todayTotal}</Text>
          </View>
          <View className="bg-[#1e293b] p-3 rounded-lg flex-1 ml-2">
            <Text className="text-gray-400 text-xs">Today Alerts</Text>
            <Text className="text-red-400 text-lg font-bold">{stats.todayAlerts}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row space-x-3 mb-4">
          <TouchableOpacity
            className="flex-1 bg-[#3b82f6] p-4 rounded-lg flex-row items-center justify-center"
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add-circle" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Add Notification</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="flex-1 bg-[#dc2626] p-4 rounded-lg flex-row items-center justify-center"
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
              { key: 'notifications', label: 'Notifications', count: notifications.filter(n => n.type !== 'emergency').length },
              { key: 'alerts', label: 'Alerts', count: notifications.filter(n => n.type === 'emergency').length }
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
        {filteredNotifications.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="notifications-off" size={64} color="#374151" />
            <Text className="text-gray-400 text-lg mt-4">No notifications found</Text>
            <Text className="text-gray-500 text-sm mt-2">Try adjusting your filters</Text>
          </View>
        ) : (
          filteredNotifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              className="bg-[#1e293b] p-4 rounded-lg mb-3  border-l-4 border-[#3b82f6]">
                
              <View className="flex-row items-start">
                <View 
                  className="w-3 h-3 rounded-full mr-3 mt-2"
                  style={{ backgroundColor: getPriorityColor(notification.priority) }}
                />
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="font-semibold text-white text-gray-300">
                      {notification.title}
                    </Text>
                    <View className="flex-row items-center">
                      <Ionicons 
                        name={getTypeIcon(notification.type)} 
                        size={16} 
                        color="#9ca3af" 
                      />
                      <Text className="text-gray-400 text-xs ml-2">
                        {formatTime(notification.timestamp.getTime())}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-sm leading-5  text-gray-200 text-gray-400">
                    {notification.message}
                  </Text>
                  <View className="flex-row items-center justify-between mt-3">
                    <View className="flex-row items-center">
                      <View className={`px-2 py-1 rounded-full ${
                        notification.priority === 'high' ? 'bg-red-900' :
                        notification.priority === 'medium' ? 'bg-yellow-900' : 'bg-green-900'
                      }`}>
                        <Text className={`text-xs font-medium ${
                          notification.priority === 'high' ? 'text-red-300' :
                          notification.priority === 'medium' ? 'text-yellow-300' : 'text-green-300'
                        }`}>
                          {notification.priority.toUpperCase()}
                        </Text>
                      </View>
                      <View className="px-2 py-1 rounded-full bg-gray-800 ml-2">
                        <Text className="text-gray-400 text-xs font-medium">
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

      {/* Add Notification Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-[#1e293b] rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white text-xl font-bold">Add Notification</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View className="space-y-4">
              <View>
                <Text className="text-gray-300 mb-2">Title</Text>
                <TextInput
                  className="bg-[#374151] text-white p-3 rounded-lg"
                  value={newNotification.title}
                  onChangeText={(text) => setNewNotification(prev => ({ ...prev, title: text }))}
                  placeholder="Enter notification title"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View>
                <Text className="text-gray-300 mb-2">Message</Text>
                <TextInput
                  className="bg-[#374151] text-white p-3 rounded-lg"
                  value={newNotification.message}
                  onChangeText={(text) => setNewNotification(prev => ({ ...prev, message: text }))}
                  placeholder="Enter notification message"
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View className="flex-row space-x-4">
                <View className="flex-1">
                  <Text className="text-gray-300 mb-2">Type</Text>
                  <View className="flex-row space-x-2">
                    {['general', 'emergency', 'weather', 'system'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        className={`px-3 py-2 rounded-lg ${
                          newNotification.type === type ? 'bg-[#3b82f6]' : 'bg-[#374151]'
                        }`}
                        onPress={() => setNewNotification(prev => ({ ...prev, type }))}
                      >
                        <Text className={`text-sm ${
                          newNotification.type === type ? 'text-white' : 'text-gray-300'
                        }`}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View>
                <Text className="text-gray-300 mb-2">Priority</Text>
                <View className="flex-row space-x-2">
                  {['low', 'medium', 'high'].map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      className={`px-4 py-2 rounded-lg ${
                        newNotification.priority === priority ? 'bg-[#3b82f6]' : 'bg-[#374151]'
                      }`}
                      onPress={() => setNewNotification(prev => ({ ...prev, priority }))}
                    >
                      <Text className={`text-sm ${
                        newNotification.priority === priority ? 'text-white' : 'text-gray-300'
                      }`}>
                        {priority}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <TouchableOpacity
              className="bg-[#3b82f6] p-4 rounded-lg mt-6"
              onPress={handleAddNotification}
            >
              <Text className="text-white font-semibold text-center">Add Notification</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
              <View className="flex-row justify-between">
                <Text className="text-gray-300">Total Notifications</Text>
                <Text className="text-white font-bold">{stats.total}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-300">Today Total Notifications</Text>
                <Text className="text-blue-400 font-bold">{stats.todayTotal}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-300">Today Total Alerts</Text>
                <Text className="text-red-400 font-bold">{stats.todayAlerts}</Text>
              </View>
              <View className="h-px bg-gray-600 my-2" />
              <View className="flex-row justify-between">
                <Text className="text-gray-300">Regular Notifications</Text>
                <Text className="text-green-400 font-bold">
                  {notifications.filter(n => n.type !== 'emergency').length}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-300">Emergency Alerts</Text>
                <Text className="text-orange-400 font-bold">
                  {notifications.filter(n => n.type === 'emergency').length}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}