import { Text, View, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, Image } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase-config';
import React, { useState, useEffect } from 'react';
import { Alert, ActivityIndicator } from 'react-native';

export default function Donate() {
    const router = useRouter();

    const [donationRequests, setDonationRequests] = useState<DonationRequest[]>([]);
    const [loading, setLoading] = useState(true);

    interface DonationRequest {
        id: string;
        title: string;
        description: string;
        amount: number;
        raisedAmount: number;
        createdAt: any;
        requester?: string;
        [key: string]: any;
    }


    useEffect(() => {
        fetchDonationRequests();
    }, []);

    const fetchDonationRequests = async () => {
        try {
            setLoading(true);
            const q = query(
                collection(db, 'donation_request'),
                where('status', '==', 'approved'), // Only show approved requests
                orderBy('createdAt', 'desc')
            );
            
            const querySnapshot = await getDocs(q);
            const requests = querySnapshot.docs.map(doc => ({
                id: doc.id,
                title: doc.data().title || '',
                description: doc.data().description || '',
                amount: doc.data().amount || 0,
                raisedAmount: doc.data().raisedAmount || 0,
                createdAt: doc.data().createdAt,
                requester: doc.data().requester,
                ...doc.data()
            })) as DonationRequest[];
            
            setDonationRequests(requests);
        } catch (error) {
            console.error('Error fetching donations:', error);
            Alert.alert('Error', 'Failed to load donation requests');
        } finally {
            setLoading(false);
        }
    };

    const getTimeAgo = (timestamp: any) => {
        if (!timestamp) return 'Recently';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        
        if (diffInDays === 0) return 'Today';
        if (diffInDays === 1) return '1 day ago';
        if (diffInDays < 7) return `${diffInDays} days ago`;
        if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
        return `${Math.floor(diffInDays / 30)} months ago`;
    };

    const getProgressPercentage = (raised: number, target: number) => {
        return Math.min((raised / target) * 100, 100);
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            {/* Header */}
            <View className="bg-white shadow-sm px-6 py-4 pt-12">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                        className="bg-gray-100 rounded-full p-2 mt-8"
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#4B5563" />
                    </TouchableOpacity>
                    <Text className="text-2xl font-bold text-gray-800 mt-8">
                        Donate
                    </Text>
                    <View className="w-10" />
                </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

                {/* Image Section */}
                <View className="bg-white px-6 pt-6 pb-4">
                    <View className="rounded-2xl overflow-hidden bg-gray-200 h-48">

                        <View className="flex-1 bg-gradient-to-br from-blue-400 to-purple-500 items-center justify-center">
                            <Ionicons name="heart-circle" size={80} color="white" />
                            <Text className="text-white text-xl font-bold mt-3">Make a Difference Today</Text>
                        </View>

                        <Image
                            source={{ uri: 'https://media.istockphoto.com/id/1353332258/photo/donation-concept-the-volunteer-giving-a-donate-box-to-the-recipient-standing-against-the-wall.webp?a=1&b=1&s=612x612&w=0&k=20&c=cB-hDQ9-5V4omGUOwOAuF3fZIv7IorXsf702CIxeT1g=' }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                        
                    </View>
                </View>

                {/* Description Section */}
                <View className="px-6 py-4">
                    <View className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-5 border border-orange-100">
                        <View className="flex-row items-start mb-3">
                            <View className="bg-orange-500 rounded-full p-2 mr-3">
                                <Ionicons name="hand-right" size={24} color="white" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-800 font-bold text-lg mb-2">
                                    Your Help Matters
                                </Text>
                                <Text className="text-gray-600 text-sm leading-5">
                                    Every contribution, no matter how small, creates ripples of hope for disaster Affected communities. 
                                    Your generosity provides immediate relief and helps rebuild lives with dignity and resilience.
                                </Text>
                            </View>
                        </View>
                        <View className="bg-white rounded-lg p-3 flex-row items-center">
                            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                            <Text className="text-gray-700 text-xs ml-2 flex-1">
                                100% of your donation goes directly to those in need
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Donation Requests List */}
                <View className="px-6 pb-6">
                    <Text className="text-lg font-bold text-gray-800 mb-4">Active Relief Campaigns</Text>

                    {loading ? (
                        <View className="flex-1 items-center justify-center py-20">
                            <ActivityIndicator size="large" color="#EF4444" />
                            <Text className="text-gray-500 mt-4">Loading donations...</Text>
                        </View>
                    ) : donationRequests.length === 0 ? (
                        <View className="bg-white rounded-2xl p-8 items-center">
                            <Ionicons name="folder-open-outline" size={64} color="#D1D5DB" />
                            <Text className="text-gray-500 mt-4 text-center">
                                No active donation campaigns at the moment
                            </Text>
                        </View>
                    ) : (
                    
                    donationRequests.map((request) => (
                        <View
                            key={request.id}
                            className="bg-white rounded-2xl shadow-md p-5 mb-4 border border-gray-100"
                        >
                            {/* Header */}
                            <View className="flex-row items-start mb-3">
                                <View className="bg-red-100 rounded-full p-2 mr-3">
                                    <Ionicons name="alert-circle" size={24} color="#EF4444" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-800 font-bold text-base mb-1">
                                        {request.title}
                                    </Text>
                                    <Text className="text-gray-500 text-xs">
                                        by {request.requester || 'Anonymous'} • {getTimeAgo(request.createdAt)}
                                    </Text>
                                </View>
                            </View>

                            {/* Description */}
                            <Text className="text-gray-600 text-sm leading-5 mb-4">
                                {request.description}
                            </Text>

                            {/* Progress Bar */}
                            <View className="mb-4">
                                <View className="flex-row justify-between mb-2">
                                    <Text className="text-gray-700 font-semibold text-sm">
                                        Raised: {formatAmount(request.raisedAmount)}
                                    </Text>
                                    <Text className="text-gray-500 text-sm">
                                        Goal: {formatAmount(request.amount)}
                                    </Text>
                                </View>
                                <View className="bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <View 
                                        className="bg-green-500 h-full rounded-full"
                                        style={{ width: `${getProgressPercentage(request.raisedAmount, request.amount)}%` }}
                                    />
                                </View>
                                <Text className="text-gray-500 text-xs mt-1 text-right">
                                    {getProgressPercentage(request.raisedAmount, request.amount).toFixed(0)}% funded
                                </Text>
                            </View>

                            {/* Donate Button */}
                            <TouchableOpacity
                                className="bg-green-600 rounded-xl py-4 flex-row items-center justify-center"
                                onPress={() => {
                                    // Navigate to donation payment page with request details
                                    router.push(`/donation/donationPayment?id=${request.id}`);
                                }}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="heart" size={20} color="white" />
                                <Text className="text-white font-bold text-base ml-2">
                                    Donate Now
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )))}
                </View>

                {/* Bottom Padding */}
                <View className="h-6" />
            </ScrollView>
        </SafeAreaView>
    );
}