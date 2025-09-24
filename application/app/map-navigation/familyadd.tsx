import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { collection, addDoc, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase-config';
import { initializeFamilyCollection, FamilyMember } from '../../lib/familyService';
import { initializeFirebaseCollections } from '../../lib/firebaseInit';
import FooterNavigation from '../../lib/FooterNavigation';

export default function FamilyAdd() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    relationship: 'spouse',
    email: '',
  });

  const relationships = [
    { label: 'Spouse', value: 'spouse' },
    { label: 'Child', value: 'child' },
    { label: 'Parent', value: 'parent' },
    { label: 'Sibling', value: 'sibling' },
    { label: 'Relative', value: 'relative' },
    { label: 'Friend', value: 'friend' },
  ];

  useEffect(() => {
    const initializeApp = async () => {
      console.log('Initializing Firebase collections...');
      await initializeFirebaseCollections();
      await initializeFamilyCollection();
      await loadFamilyMembers();
    };
    
    initializeApp();
  }, []);

  const loadFamilyMembers = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('No user logged in');
        setFamilyMembers([]); // Clear family members if no user
        return;
      }

      console.log('Loading family members for user:', currentUser.uid);

      const familyRef = collection(db, 'family');
      // Only load family members added by the current authenticated user
      const q = query(familyRef, where('addedBy', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      
      const members: FamilyMember[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Double-check security: only include if addedBy matches current user
        if (data.addedBy === currentUser.uid) {
          members.push({ 
            id: doc.id, 
            name: data.name || '',
            phoneNumber: data.phoneNumber || '',
            relationship: data.relationship || '',
            email: data.email || '',
            status: data.status || 'safe',
            location: data.location || null,
            lastUpdated: data.lastUpdated?.toDate() || new Date(),
            userId: data.userId || '',
            addedBy: data.addedBy || ''
          } as FamilyMember);
        }
      });
      
      setFamilyMembers(members);
      console.log(`Loaded ${members.length} family members for current user only`);
    } catch (error) {
      console.error('Error loading family members:', error);
      // Don't show alert for collection not existing yet
      if (error instanceof Error && error.message?.includes('not found')) {
        console.log('Family collection not created yet');
        setFamilyMembers([]);
      } else {
        Alert.alert('Error', 'Failed to load family members.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getUserLocationByEmail = async (email: string): Promise<{ exists: boolean; location?: { latitude: number; longitude: number; address?: string } }> => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return { exists: false };
      }
      
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      console.log('User data found:', userData); // Debug log
      
      // Check if user has location data with lat and lng (from Firebase)
      if (userData.location && 
          typeof userData.location.lat === 'number' && 
          typeof userData.location.lng === 'number') {
        console.log('Location found:', userData.location); // Debug log
        return {
          exists: true,
          location: {
            latitude: userData.location.lat,  // Convert lat to latitude
            longitude: userData.location.lng, // Convert lng to longitude
            address: userData.location.address || 'Location available'
          }
        };
      }
      
      console.log('No valid location data found for user'); // Debug log
      return { exists: true }; // User exists but no valid location data
    } catch (error) {
      console.error('Error checking user:', error);
      if (error instanceof Error && error.message?.includes('not found')) {
        console.log('Users collection not found - assuming user does not exist');
        return { exists: false };
      }
      return { exists: false };
    }
  };

  const handleAddMember = async () => {
    try {
      if (!formData.name || !formData.phoneNumber || !formData.email) {
        Alert.alert('Error', 'Please fill in all required fields.');
        return;
      }

      setLoading(true);
      
      // Check if user exists and get their location
      const userInfo = await getUserLocationByEmail(formData.email);
      if (!userInfo.exists) {
        Alert.alert(
          'User Not Found',
          'The email address is not registered in our system. Please make sure the family member has registered first.'
        );
        setLoading(false);
        return;
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to add family members.');
        return;
      }

      // Add family member to Firebase
      const familyRef = collection(db, 'family');
      const newMember = {
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        relationship: formData.relationship,
        email: formData.email.toLowerCase().trim(),
        status: 'safe' as const,
        lastUpdated: new Date(),
        userId: currentUser.uid,
        addedBy: currentUser.uid,
        location: userInfo.location || null,
      };

      console.log('Adding family member:', newMember);
      await addDoc(familyRef, newMember);
      console.log('Family member added successfully');
      
      Alert.alert('Success', 'Family member added successfully!');
      
      // Reset form and close modal
      setFormData({
        name: '',
        phoneNumber: '',
        relationship: 'spouse',
        email: '',
      });
      setShowAddForm(false);
      
      // Reload family members
      await loadFamilyMembers();
      
    } catch (error) {
      console.error('Error adding family member:', error);
      Alert.alert('Error', 'Failed to add family member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'safe' ? '#10B981' : '#EF4444';
  };

  const getStatusIcon = (status: string) => {
    return status === 'safe' ? 'checkmark-circle' : 'warning';
  };

  const handleViewOnMap = (member: FamilyMember) => {
    if (member.location) {
      // Navigate to map page to show this specific member's location
      router.push('/map-navigation' as any);
    } else {
      Alert.alert('No Location', 'This family member does not have location data available.');
    }
  };

  if (loading && familyMembers.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-500 justify-center items-center">
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text className="mt-4 text-white">Loading family members...</Text>
      </SafeAreaView>
    );
  }

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
            Family Members
          </Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView className="flex-1 px-4 py-4 pb-20">
        {/* Emergency Alert Section - Only show if there are members in danger */}
        {familyMembers.filter(m => m.status === 'in_danger').length > 0 && (
          <View className="bg-red-500 rounded-xl p-4 mb-4 border border-red-400">
            <View className="flex-row items-center mb-2">
              <Ionicons name="warning" size={20} color="white" />
              <Text className="text-white font-bold ml-2">
                {familyMembers.filter(m => m.status === 'in_danger').length} family member(s) need help
              </Text>
            </View>
            {familyMembers.filter(m => m.status === 'in_danger').map((member) => (
              <Text key={member.id} className="text-white text-sm mb-2">
                {member.name} is in danger
              </Text>
            ))}
            <TouchableOpacity className="bg-red-600 rounded-lg py-2 px-4 self-start">
              <Text className="text-white font-semibold">Help</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Status Summary */}
        <View className="flex-row mb-4">
          <View className="flex-1 bg-gray-600 rounded-xl p-4 mr-2 items-center">
            <Ionicons name="checkmark-circle" size={32} color="#10B981" />
            <Text className="text-white font-bold mt-2">Safe</Text>
            <Text className="text-gray-300 text-sm">
              {familyMembers.filter(m => m.status === 'safe').length}
            </Text>
          </View>
          <View className="flex-1 bg-gray-600 rounded-xl p-4 ml-2 items-center">
            <Ionicons name="warning" size={32} color="#EF4444" />
            <Text className="text-white font-bold mt-2">In Danger</Text>
            <Text className="text-gray-300 text-sm">
              {familyMembers.filter(m => m.status === 'in_danger').length}
            </Text>
          </View>
        </View>

        {/* Add Family Member Button */}
        <TouchableOpacity
          className="bg-gray-600 rounded-xl p-4 mb-4 flex-row items-center justify-center"
          onPress={() => setShowAddForm(true)}
        >
          <Ionicons name="add" size={24} color="white" />
          <Text className="text-white font-semibold ml-2">Add Family Member</Text>
        </TouchableOpacity>

        {/* Emergency Contacts Section */}
        <View className="mb-4">
          <View className="flex-row items-center mb-3">
            <Ionicons name="warning" size={20} color="#EF4444" />
            <Text className="text-white font-bold ml-2">Emergency Contacts</Text>
          </View>

          {familyMembers.map((member) => (
            <View key={member.id} className="bg-gray-600 rounded-xl p-4 mb-3">
              <View className="flex-row items-center mb-2">
                <View className="bg-gray-500 rounded-full p-2 mr-3">
                  <Ionicons name="person" size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold text-lg">{member.name}</Text>
                  <Text className="text-gray-300 capitalize">{member.relationship}</Text>
                  {member.location && (
                    <Text className="text-gray-400 text-sm">
                      {member.location.address || 'Location available'}
                    </Text>
                  )}
                </View>
                <View className="items-center">
                  <Ionicons 
                    name={getStatusIcon(member.status)} 
                    size={24} 
                    color={getStatusColor(member.status)} 
                  />
                </View>
              </View>
              
              <View className="flex-row">
                <TouchableOpacity className="bg-red-500 rounded-lg py-2 px-4 flex-row items-center mr-2">
                  <Ionicons name="call" size={16} color="white" />
                  <Text className="text-white ml-1">Call</Text>
                </TouchableOpacity>
                <TouchableOpacity className="bg-gray-500 rounded-lg py-2 px-4 flex-row items-center mr-2">
                  <Ionicons name="chatbubble" size={16} color="white" />
                </TouchableOpacity>
                <TouchableOpacity 
                  className={`rounded-lg py-2 px-4 flex-row items-center ${
                    member.location ? 'bg-gray-500' : 'bg-gray-700'
                  }`}
                  onPress={() => handleViewOnMap(member)}
                  disabled={!member.location}
                >
                  <Ionicons 
                    name="navigate" 
                    size={16} 
                    color={member.location ? "white" : "#6B7280"} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {familyMembers.length === 0 && (
            <View className="bg-gray-600 rounded-xl p-8 items-center">
              <Ionicons name="people-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-300 text-center mt-2">
                No family members added yet
              </Text>
              <Text className="text-gray-400 text-center text-sm mt-1">
                Add family members to track their safety status
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Family Member Modal */}
      {showAddForm && (
        <View className="absolute inset-0 bg-black bg-opacity-50 justify-center px-4" style={{ zIndex: 1000 }}>
          <View className="bg-gray-700 rounded-xl p-6">
            <Text className="text-white text-xl font-bold mb-4 text-center">
              Add family member
            </Text>
            
            <TextInput
              className="bg-gray-600 text-white rounded-lg p-3 mb-3"
              placeholder="Full name"
              placeholderTextColor="#9CA3AF"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            
            <TextInput
              className="bg-gray-600 text-white rounded-lg p-3 mb-3"
              placeholder="Phone Number"
              placeholderTextColor="#9CA3AF"
              value={formData.phoneNumber}
              onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
              keyboardType="phone-pad"
            />
            
            <TextInput
              className="bg-gray-600 text-white rounded-lg p-3 mb-3"
              placeholder="Email Address"
              placeholderTextColor="#9CA3AF"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <View className="bg-gray-600 rounded-lg mb-4">
              <Picker
                selectedValue={formData.relationship}
                onValueChange={(value: string) => setFormData({ ...formData, relationship: value })}
                style={{ color: 'white' }}
              >
                {relationships.map((rel) => (
                  <Picker.Item key={rel.value} label={rel.label} value={rel.value} />
                ))}
              </Picker>
            </View>
            
            <View className="flex-row">
              <TouchableOpacity
                className="flex-1 bg-red-500 rounded-lg py-3 mr-2"
                onPress={handleAddMember}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold text-center">Add Member</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                className="flex-1 bg-gray-500 rounded-lg py-3 ml-2"
                onPress={() => setShowAddForm(false)}
              >
                <Text className="text-white font-semibold text-center">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Footer Navigation */}
      <FooterNavigation activeTab="family" />
    </SafeAreaView>
  );
}