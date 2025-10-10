import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '../../config/firebase-config';

interface Donation {
    id: string;
    title: string;
    payAmount: number;
    paymentDate: any;
    requestId: string;
}

export default function DonationHistory() {
    const router = useRouter();
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalDonated, setTotalDonated] = useState(0);

    useEffect(() => {
        fetchDonationHistory();
    }, []);

    const fetchDonationHistory = async () => {
        const user = auth.currentUser;
        
        if (!user) {
            Alert.alert('Error', 'You must be logged in to view donation history');
            router.back();
            return;
        }

        try {
            setLoading(true);
            
            // Query donations for current user, ordered by date
            const donationsRef = collection(db, 'donation');
            const q = query(
                donationsRef,
                where('userId', '==', user.uid),
                orderBy('paymentDate', 'desc')
            );
            
            const querySnapshot = await getDocs(q);
            const donationsList: Donation[] = [];
            let total = 0;

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                donationsList.push({
                    id: doc.id,
                    title: data.title,
                    payAmount: data.payAmount,
                    paymentDate: data.paymentDate,
                    requestId: data.requestId
                });
                total += data.payAmount;
            });

            setDonations(donationsList);
            setTotalDonated(total);
        } catch (error: any) {
            console.error('Error fetching donations:', error);
            Alert.alert('Error', 'Failed to load donation history');
        } finally {
            setLoading(false);
        }
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        
        // Handle Firestore Timestamp
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#EF4444" />
                    <Text className="text-gray-500 mt-4">Loading your donations...</Text>
                </View>
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
                        className="bg-gray-100 rounded-full p-2 mt-8"
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#4B5563" />
                    </TouchableOpacity>
                    <Text className="text-2xl font-bold text-gray-800 mt-8">
                        Donation History
                    </Text>
                    <View className="w-10" />
                </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Summary Card */}
                <View className="px-6 py-6">
                    <View className="bg-orange-500 rounded-2xl shadow-lg p-6">
                        <View className="flex-row items-center mb-3">
                            <View className="bg-white rounded-full p-3 mr-4" style={{ opacity: 0.3 }}>
                                <Ionicons name="heart" size={28} color="white" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-white text-sm mb-1" style={{ opacity: 0.9 }}>
                                    Total Donated
                                </Text>
                                <Text className="text-white font-bold text-3xl">
                                    {formatAmount(totalDonated)}
                                </Text>
                            </View>
                        </View>
                        <View className="bg-white my-3" style={{ height: 1, opacity: 0.2 }} />
                        <View className="flex-row items-center">
                            <Ionicons name="gift" size={18} color="white" />
                            <Text className="text-white text-sm ml-2" style={{ opacity: 0.9 }}>
                                {donations.length} {donations.length === 1 ? 'donation' : 'donations'} made
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Donations List */}
                <View className="px-6 pb-6">
                    {donations.length === 0 ? (
                        <View className="bg-white rounded-2xl shadow-md p-8 items-center">
                            <View className="bg-gray-100 rounded-full p-4 mb-4">
                                <Ionicons name="heart-dislike-outline" size={48} color="#9CA3AF" />
                            </View>
                            <Text className="text-gray-800 font-bold text-lg mb-2">
                                No Donations Yet
                            </Text>
                            <Text className="text-gray-500 text-center text-sm">
                                Your donation history will appear here once you make your first contribution.
                            </Text>
                        </View>
                    ) : (
                        <>
                            {donations.map((donation, index) => (
                                <View 
                                    key={donation.id}
                                    className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 mb-3"
                                >
                                    <View className="p-4">
                                        {/* Header with Icon and Amount */}
                                        <View className="flex-row items-start justify-between mb-3">
                                            <View className="flex-row items-start flex-1">
                                                <View className="bg-green-100 rounded-full p-2 mr-3">
                                                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                                </View>
                                                <View className="flex-1">
                                                    <Text className="text-gray-800 font-bold text-base mb-1">
                                                        {donation.title}
                                                    </Text>
                                                    <View className="flex-row items-center">
                                                        <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                                                        <Text className="text-gray-500 text-xs ml-1">
                                                            {formatDate(donation.paymentDate)}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                            <View className="bg-green-50 rounded-lg px-3 py-2">
                                                <Text className="text-green-600 font-bold text-lg">
                                                    {formatAmount(donation.payAmount)}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Divider */}
                                        <View className="bg-gray-100 my-3" style={{ height: 1 }} />

                                        {/* Footer */}
                                        <View className="flex-row items-center justify-between">
                                            <View className="flex-row items-center">
                                                <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                                                <Text className="text-gray-500 text-xs ml-1">
                                                    Payment successful
                                                </Text>
                                            </View>
                                            <Text className="text-gray-400 text-xs">
                                                #{index + 1}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </>
                    )}
                </View>

                <View className="h-6" />
            </ScrollView>
        </SafeAreaView>
    );
}