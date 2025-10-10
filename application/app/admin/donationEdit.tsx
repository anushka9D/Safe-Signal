import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, TextInput,ActivityIndicator,Alert,Image,Modal} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase-config';
import * as ImagePicker from 'expo-image-picker';


export default function EditDonationRequest() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [amount, setAmount] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [newImage, setNewImage] = useState('');
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'completed'>('pending');
  const [userEmail, setUserEmail] = useState('');
  const [createdAt, setCreatedAt] = useState<any>(null);
  const [raisedAmount, setRaisedAmount] = useState(0);

  const statusOptions: Array<{value: 'pending' | 'approved' | 'rejected' | 'completed', label: string, color: string, icon: any}> = [
    { value: 'pending', label: 'Pending', color: '#F59E0B', icon: 'time' },
    { value: 'approved', label: 'Approved', color: '#10B981', icon: 'checkmark-circle' },
    { value: 'rejected', label: 'Rejected', color: '#EF4444', icon: 'close-circle' },
    { value: 'completed', label: 'Completed', color: '#3B82F6', icon: 'checkmark-done-circle' },
  ];

  useEffect(() => {
    if (id) {
      fetchDonationRequest();
    }
  }, [id]);

  const fetchDonationRequest = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'donation_request', id as string);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTitle(data.title || '');
        setDescription(data.description || '');
        setLocation(data.location || '');
        setAmount(data.amount?.toString() || '');
        setContactNo(data.contactNo || '');
        setImageUrl(data.imageUrl || '');
        setStatus(data.status || 'pending');
        setUserEmail(data.userEmail || '');
        setCreatedAt(data.createdAt || null);
        setRaisedAmount(data.raisedAmount || 0);
      } else {
        Alert.alert('Error', 'Donation request not found');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching donation:', error);
      Alert.alert('Error', 'Failed to load donation details');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setNewImage(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to pick image: ' + error.message);
    }
  };

  const uploadImage = async (uri: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'image/jpeg',
      name: 'donation_image.jpg',
    } as any);
    formData.append('upload_preset', 'safesignal');
    formData.append('cloud_name', 'dvf4qybuh');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/dvf4qybuh/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to upload image');
    }
    
    return data.secure_url;
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please enter a description');
      return false;
    }
    if (!location.trim()) {
      Alert.alert('Validation Error', 'Please enter a location');
      return false;
    }
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount');
      return false;
    }
    if (!contactNo.trim()) {
      Alert.alert('Validation Error', 'Please enter a contact number');
      return false;
    }
    return true;
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;

    try {
      setUpdating(true);

      let finalImageUrl = imageUrl;

      // Upload new image if selected
      if (newImage) {
        finalImageUrl = await uploadImage(newImage);
      }

      // Update in Firestore
      const docRef = doc(db, 'donation_request', id as string);
      await updateDoc(docRef, {
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        amount: Number(amount),
        contactNo: contactNo.trim(),
        imageUrl: finalImageUrl,
        status: status,
        updatedAt: serverTimestamp(),
      });

      Alert.alert(
        'Success',
        'Donation request has been updated successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );

    } catch (error: any) {
      console.error('Error updating request:', error);
      Alert.alert('Error', 'Failed to update request: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Request',
      'Are you sure you want to delete this donation request? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setUpdating(true);
              // Implement delete functionality if needed
              Alert.alert('Info', 'Delete functionality not implemented yet');
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete: ' + error.message);
            } finally {
              setUpdating(false);
            }
          }
        }
      ]
    );
  };

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate();
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (statusValue: string): string => {
    const option = statusOptions.find(opt => opt.value === statusValue);
    return option?.color || '#9CA3AF';
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#0b1220]">
        <StatusBar barStyle="light-content" backgroundColor="#0b1220" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-400 mt-4">Loading request...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0b1220]">
      <StatusBar barStyle="light-content" backgroundColor="#0b1220" />

      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-800">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            className="bg-gray-800 rounded-full p-2"
            onPress={() => router.back()}
            disabled={updating}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-white">
            Edit Request
          </Text>
          <TouchableOpacity
            className="bg-red-500/20 rounded-full p-2"
            onPress={handleDelete}
            disabled={updating}
          >
            <Ionicons name="trash" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-6">
          {/* Info Card */}
          <View className="bg-[#1a2332] border border-gray-700/50 rounded-2xl p-4 mb-6">
            <View className="flex-row items-start mb-3">
              <Ionicons name="information-circle" size={24} color="#3B82F6" />
              <View className="flex-1 ml-3">
                <Text className="text-blue-400 font-semibold mb-1">Request Information</Text>
                <Text className="text-gray-400 text-sm">
                  Submitted by: {userEmail}
                </Text>
                <Text className="text-gray-400 text-sm">
                  Date: {formatDate(createdAt)}
                </Text>
                <Text className="text-gray-400 text-sm">
                  Raised: {formatAmount(raisedAmount)}
                </Text>
              </View>
            </View>
          </View>

          {/* Form Container */}
          <View className="bg-[#1a2332] border border-gray-700/50 rounded-2xl p-5">
            
            {/* Status Dropdown */}
            <View className="mb-5">
              <Text className="text-gray-300 font-semibold mb-2">
                Status <Text className="text-red-500">*</Text>
              </Text>
              <TouchableOpacity
                className="bg-[#0f1825] border border-gray-700 rounded-xl px-4 py-3 flex-row items-center justify-between"
                onPress={() => setShowStatusModal(true)}
                disabled={updating}
              >
                <View className="flex-row items-center">
                  <Ionicons 
                    name={statusOptions.find(opt => opt.value === status)?.icon || 'help-circle'} 
                    size={20} 
                    color={getStatusColor(status)} 
                  />
                  <Text className="text-white ml-2 font-medium">
                    {statusOptions.find(opt => opt.value === status)?.label}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Title Input */}
            <View className="mb-5">
              <Text className="text-gray-300 font-semibold mb-2">
                Title <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="bg-[#0f1825] border border-gray-700 rounded-xl px-4 py-3 text-white"
                placeholder="e.g., Flood Relief for 50 Families"
                placeholderTextColor="#6B7280"
                value={title}
                onChangeText={setTitle}
                editable={!updating}
              />
            </View>

            {/* Description Input */}
            <View className="mb-5">
              <Text className="text-gray-300 font-semibold mb-2">
                Description <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="bg-[#0f1825] border border-gray-700 rounded-xl px-4 py-3 text-white"
                placeholder="Describe the situation..."
                placeholderTextColor="#6B7280"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                editable={!updating}
              />
            </View>

            {/* Location Input */}
            <View className="mb-5">
              <Text className="text-gray-300 font-semibold mb-2">
                Location <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="bg-[#0f1825] border border-gray-700 rounded-xl px-4 py-3 text-white"
                placeholder="e.g., Colombo, Western Province"
                placeholderTextColor="#6B7280"
                value={location}
                onChangeText={setLocation}
                editable={!updating}
              />
            </View>

            {/* Amount Input */}
            <View className="mb-5">
              <Text className="text-gray-300 font-semibold mb-2">
                Target Amount (Rs) <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="bg-[#0f1825] border border-gray-700 rounded-xl px-4 py-3 text-white"
                placeholder="e.g., 5000"
                placeholderTextColor="#6B7280"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                editable={!updating}
              />
            </View>

            {/* Contact Number Input */}
            <View className="mb-5">
              <Text className="text-gray-300 font-semibold mb-2">
                Contact Number <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="bg-[#0f1825] border border-gray-700 rounded-xl px-4 py-3 text-white"
                placeholder="e.g., +94 77 123 4567"
                placeholderTextColor="#6B7280"
                value={contactNo}
                onChangeText={setContactNo}
                keyboardType="phone-pad"
                editable={!updating}
              />
            </View>

            {/* Image Display/Upload */}
            <View className="mb-5">
              <Text className="text-gray-300 font-semibold mb-2">
                Image <Text className="text-red-500">*</Text>
              </Text>
              
              {(newImage || imageUrl) && (
                <View className="mb-3">
                  <Image
                    source={{ uri: newImage || imageUrl }}
                    className="w-full h-48 rounded-xl"
                    resizeMode="cover"
                  />
                </View>
              )}
            </View>

            {/* Update Button */}
            <TouchableOpacity
              className={`rounded-xl py-4 items-center ${
                updating ? 'bg-blue-500/50' : 'bg-blue-500'
              }`}
              onPress={handleUpdate}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="white" />
              ) : (
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={22} color="white" />
                  <Text className="text-white font-bold text-base ml-2">
                    Update Request
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Status Modal */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <TouchableOpacity 
          className="flex-1 bg-black/70 justify-center items-center px-6"
          activeOpacity={1}
          onPress={() => setShowStatusModal(false)}
        >
          <TouchableOpacity 
            className="bg-[#1a2332] rounded-2xl p-6 w-full max-w-md"
            activeOpacity={1}
          >
            <Text className="text-white text-xl font-bold mb-4">Select Status</Text>
            
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                className={`flex-row items-center p-4 rounded-xl mb-2 ${
                  status === option.value ? 'bg-gray-700' : 'bg-[#0f1825]'
                }`}
                onPress={() => {
                  setStatus(option.value);
                  setShowStatusModal(false);
                }}
              >
                <Ionicons name={option.icon} size={24} color={option.color} />
                <Text className="text-white font-medium ml-3 flex-1">
                  {option.label}
                </Text>
                {status === option.value && (
                  <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              className="bg-gray-700 rounded-xl p-4 mt-2"
              onPress={() => setShowStatusModal(false)}
            >
              <Text className="text-white font-semibold text-center">Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}