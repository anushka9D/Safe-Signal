import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase-config';
import FooterNavigation from '../../lib/FooterNavigation';

interface StatusHistory {
  id?: string;
  status: 'safe' | 'emergency';
  timestamp: Date;
  userId: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export default function StatusAdd() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<'safe' | 'emergency'>('safe');
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);

  useEffect(() => {
    loadCurrentStatus();
    loadStatusHistory();
  }, []);

  const loadCurrentStatus = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Check family collection for current user's status
      const familyRef = collection(db, 'family');
      const q = query(familyRef, where('email', '==', currentUser.email?.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        setCurrentStatus(userData.status || 'safe');
      }
    } catch (error) {
      console.error('Error loading current status:', error);
    }
  };

  const loadStatusHistory = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const historyRef = collection(db, 'status_history');
      const q = query(
        historyRef, 
        where('userId', '==', currentUser.uid)
        // Removed orderBy to avoid composite index requirement
      );
      const querySnapshot = await getDocs(q);
      
      const history: StatusHistory[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        history.push({
          id: doc.id,
          status: data.status,
          timestamp: data.timestamp?.toDate() || new Date(),
          userId: data.userId,
          location: data.location || null
        });
      });
      
      // Sort in memory instead of using Firestore orderBy
      history.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      setStatusHistory(history);
    } catch (error) {
      console.error('Error loading status history:', error);
    }
  };

  const updateStatus = async (newStatus: 'safe' | 'emergency') => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to update status.');
        return;
      }

      // Update all family collection entries where this user is listed
      const familyRef = collection(db, 'family');
      const q = query(familyRef, where('email', '==', currentUser.email?.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      const updatePromises: Promise<void>[] = [];
      querySnapshot.forEach((docSnapshot) => {
        const updatePromise = updateDoc(doc(db, 'family', docSnapshot.id), {
          status: newStatus,
          lastUpdated: new Date()
        });
        updatePromises.push(updatePromise);
      });

      await Promise.all(updatePromises);

      // Add to status history
      const historyRef = collection(db, 'status_history');
      await addDoc(historyRef, {
        status: newStatus,
        timestamp: new Date(),
        userId: currentUser.uid,
        location: null // You can add current location here if needed
      });

      setCurrentStatus(newStatus);
      
      Alert.alert(
        'Status Updated', 
        `Your status has been changed to ${newStatus === 'safe' ? 'Safe' : 'Emergency'}!`
      );

      // Reload history
      await loadStatusHistory();

    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: 'safe' | 'emergency') => {
    return status === 'safe' ? '#10B981' : '#EF4444';
  };

  const getStatusIcon = (status: 'safe' | 'emergency') => {
    return status === 'safe' ? 'checkmark-circle' : 'warning';
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleString();
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-500">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View className="bg-gray-600 shadow-sm px-6 py-4 pt-12">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            className="bg-gray-400 rounded-full p-2 mt-8"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-white">
            My Status
          </Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView className="flex-1 px-4 py-4 pb-20">
        {/* Current Status Display */}
        <View className="bg-gray-600 rounded-xl p-6 mb-4 items-center">
          <Ionicons 
            name={getStatusIcon(currentStatus)} 
            size={64} 
            color={getStatusColor(currentStatus)} 
          />
          <Text className="text-white text-2xl font-bold mt-4">
            {currentStatus === 'safe' ? 'I am Safe' : 'Emergency!'}
          </Text>
          <Text className="text-gray-300 text-center mt-2">
            {currentStatus === 'safe' 
              ? 'Your family members can see you are safe' 
              : 'Your family members have been notified of your emergency status'}
          </Text>
        </View>

        {/* Status Change Buttons */}
        <View className="mb-6">
          <Text className="text-white text-lg font-bold mb-3">Update Your Status</Text>
          
          <TouchableOpacity
            className={`rounded-xl p-4 mb-3 flex-row items-center justify-center ${
              currentStatus === 'safe' ? 'bg-green-600' : 'bg-green-500'
            }`}
            onPress={() => updateStatus('safe')}
            disabled={loading || currentStatus === 'safe'}
          >
            <Ionicons name="checkmark-circle" size={24} color="white" />
            <Text className="text-white text-lg font-semibold ml-3">
              I am Safe
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`rounded-xl p-4 mb-3 flex-row items-center justify-center ${
              currentStatus === 'emergency' ? 'bg-red-600' : 'bg-red-500'
            }`}
            onPress={() => updateStatus('emergency')}
            disabled={loading || currentStatus === 'emergency'}
          >
            <Ionicons name="warning" size={24} color="white" />
            <Text className="text-white text-lg font-semibold ml-3">
              Emergency!
            </Text>
          </TouchableOpacity>

          {loading && (
            <View className="items-center mt-2">
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text className="text-white text-sm mt-1">Updating status...</Text>
            </View>
          )}
        </View>

        {/* Status History */}
        <View className="mb-4">
          <Text className="text-white text-lg font-bold mb-3">Status History</Text>
          
          {statusHistory.length > 0 ? (
            statusHistory.map((item, index) => (
              <View key={item.id || index} className="bg-gray-600 rounded-xl p-4 mb-3">
                <View className="flex-row items-center">
                  <Ionicons 
                    name={getStatusIcon(item.status)} 
                    size={20} 
                    color={getStatusColor(item.status)} 
                  />
                  <View className="flex-1 ml-3">
                    <Text className="text-white font-semibold">
                      {item.status === 'safe' ? 'Safe' : 'Emergency'}
                    </Text>
                    <Text className="text-gray-300 text-sm">
                      {formatTimestamp(item.timestamp)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View className="bg-gray-600 rounded-xl p-6 items-center">
              <Ionicons name="time-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-300 text-center mt-2">
                No status history yet
              </Text>
              <Text className="text-gray-400 text-center text-sm mt-1">
                Your status changes will appear here
              </Text>
            </View>
          )}
        </View>

        {/* Emergency Instructions */}
        <View className="bg-red-900 rounded-xl p-4 mb-4 border border-red-600">
          <View className="flex-row items-center mb-2">
            <Ionicons name="information-circle" size={20} color="#FCA5A5" />
            <Text className="text-red-200 font-bold ml-2">Emergency Instructions</Text>
          </View>
          <Text className="text-red-100 text-sm leading-5">
            • In case of emergency, tap the Emergency button immediately{'\n'}
            • Your family members will be notified of your status{'\n'}
            • Contact emergency services: 911 or local emergency number{'\n'}
            • Share your location with trusted contacts
          </Text>
        </View>
      </ScrollView>

      {/* Footer Navigation */}
      <FooterNavigation activeTab="status" />
    </SafeAreaView>
  );
}