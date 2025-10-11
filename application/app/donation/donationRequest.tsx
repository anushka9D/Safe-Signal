import React, { useState } from 'react';
import { Text, View, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, TextInput, ActivityIndicator, Alert,Image} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../../config/firebase-config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase-config';

export default function DonationRequest() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    
    // Form fields
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [amount, setAmount] = useState('');
    const [contactNo, setContactNo] = useState('');
    const [image, setImage] = useState('');

    // Character limits
    const MAX_TITLE = 100;
    const MAX_DESCRIPTION = 500;

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });

            if (!result.canceled) {
                setImage(result.assets[0].uri);
            }
        } catch (error: any) {
            Alert.alert('Error', 'Failed to pick image: ' + error.message);
        }
    };

    const uploadImage = async (uri: string)=> {
        const formData = new FormData();
        formData.append('file', {
            uri,
            type: 'image/jpeg',
            name: 'donation_image.jpg',
        }as any);
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
        
        return data.secure_url; // image URL
    };

    const validateForm = () => {
        if (!title.trim()) {
            Alert.alert('Validation Error', 'Please enter a title');
            return false;
        }
        if (title.length > MAX_TITLE) {
            Alert.alert('Validation Error', `Title must be ${MAX_TITLE} characters or less`);
            return false;
        }
        if (!description.trim()) {
            Alert.alert('Validation Error', 'Please enter a description');
            return false;
        }
        if (description.length > MAX_DESCRIPTION) {
            Alert.alert('Validation Error', `Description must be ${MAX_DESCRIPTION} characters or less`);
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
        if (!image) {
            Alert.alert('Validation Error', 'Please upload an image');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        
        const user = auth.currentUser;
        if (!user) {
            Alert.alert('Error', 'You must be logged in to submit a request');
            return;
        }

        try {
            setLoading(true);

            // Upload image first
            const imageUrl = await uploadImage(image);

            // Prepare data for Firestore
            const donationData = {
                title: title.trim(),
                description: description.trim(),
                location: location.trim(),
                amount: Number(amount),
                contactNo: contactNo.trim(),
                imageUrl: imageUrl,
                status: 'pending',
                userId: user.uid,
                userEmail: user.email,
                createdAt: serverTimestamp(),
                raisedAmount: 0,
            };

            // Add to Firestore
            await addDoc(collection(db, 'donation_request'), donationData);

            Alert.alert(
                'Success', 
                'Your donation request has been submitted and is pending approval.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.back()
                    }
                ]
            );

        } catch (error: any) {
            console.error('Error submitting request:', error);
            Alert.alert('Error', 'Failed to submit request: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const disabled = loading;

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            {/* Header */}
            <View className="bg-white shadow-sm px-6 py-4 pt-12">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                        className="bg-gray-100 rounded-full p-2 mt-8"
                        onPress={() => router.back()}
                        disabled={loading}
                    >
                        <Ionicons name="arrow-back" size={24} color="#4B5563" />
                    </TouchableOpacity>
                    <Text className="text-2xl font-bold text-gray-800 mt-8">
                        Request Donation
                    </Text>
                    <View className="w-10" />
                </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="p-6">
                    {/* Info Card */}
                    <View className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-100">
                        <View className="flex-row items-start">
                            <Ionicons name="information-circle" size={24} color="#3B82F6" />
                            <Text className="text-blue-700 text-sm ml-3 flex-1">
                                Fill out this form to request financial assistance for disaster relief. 
                                Your request will be reviewed before being published.
                            </Text>
                        </View>
                    </View>

                    {/* Form Container */}
                    <View className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
                        
                        {/* Title Input */}
                        <View className="mb-5">
                            <Text className="text-gray-700 font-semibold mb-2">
                                Title <Text className="text-red-500">*</Text>
                            </Text>
                            <TextInput
                                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                                placeholder="e.g., Flood Relief for 50 Families"
                                value={title}
                                onChangeText={setTitle}
                                maxLength={MAX_TITLE}
                                editable={!loading}
                            />
                            <Text className="text-gray-400 text-xs mt-1 text-right">
                                {title.length}/{MAX_TITLE}
                            </Text>
                        </View>

                        {/* Description Input */}
                        <View className="mb-5">
                            <Text className="text-gray-700 font-semibold mb-2">
                                Description <Text className="text-red-500">*</Text>
                            </Text>
                            <TextInput
                                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                                placeholder="Describe the situation and how the funds will be used..."
                                value={description}
                                onChangeText={setDescription}
                                maxLength={MAX_DESCRIPTION}
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                                editable={!loading}
                            />
                            <Text className="text-gray-400 text-xs mt-1 text-right">
                                {description.length}/{MAX_DESCRIPTION}
                            </Text>
                        </View>

                        {/* Location Input */}
                        <View className="mb-5">
                            <Text className="text-gray-700 font-semibold mb-2">
                                Location <Text className="text-red-500">*</Text>
                            </Text>
                            <TextInput
                                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                                placeholder="e.g., Colombo, Western Province"
                                value={location}
                                onChangeText={setLocation}
                                editable={!loading}
                            />
                        </View>

                        {/* Amount Input */}
                        <View className="mb-5">
                            <Text className="text-gray-700 font-semibold mb-2">
                                Target Amount (Rs) <Text className="text-red-500">*</Text>
                            </Text>
                            <TextInput
                                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                                placeholder="e.g., 5000"
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="numeric"
                                editable={!loading}
                            />
                        </View>

                        {/* Contact Number Input */}
                        <View className="mb-5">
                            <Text className="text-gray-700 font-semibold mb-2">
                                Contact Number <Text className="text-red-500">*</Text>
                            </Text>
                            <TextInput
                                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                                placeholder="e.g., +94 77 123 4567"
                                value={contactNo}
                                onChangeText={setContactNo}
                                keyboardType="phone-pad"
                                editable={!loading}
                            />
                        </View>

                        {/* Image Upload */}
                        <View className="mb-5">
                            <Text className="text-gray-700 font-semibold mb-2">
                                Upload Image <Text className="text-red-500">*</Text>
                            </Text>
                            
                            {image ? (
                                <View className="relative">
                                    <Image
                                        source={{ uri: image }}
                                        className="w-full h-48 rounded-xl"
                                        resizeMode="cover"
                                    />
                                    <TouchableOpacity
                                        className="absolute top-2 right-2 bg-red-500 rounded-full p-2"
                                        onPress={() => setImage}
                                        disabled={loading}
                                    >
                                        <Ionicons name="close" size={20} color="white" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 items-center justify-center"
                                    onPress={pickImage}
                                    disabled={loading}
                                >
                                    <Ionicons name="cloud-upload-outline" size={48} color="#9CA3AF" />
                                    <Text className="text-gray-500 mt-2 font-medium">
                                        Tap to upload image
                                    </Text>
                                    <Text className="text-gray-400 text-xs mt-1">
                                        JPG, PNG (Max 10MB)
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            className={`rounded-xl py-4 items-center ${
                                disabled ? 'bg-orange-300' : 'bg-orange-500'
                            }`}
                            onPress={handleSubmit}
                            disabled={disabled}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <View className="flex-row items-center">
                                    <Ionicons name="send" size={20} color="white" />
                                    <Text className="text-white font-bold text-base ml-2">
                                        Submit Request
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}