import { Text, View, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db, auth } from '../../config/firebase-config';

export default function DonationDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [userRank, setUserRank] = useState({
        position: 0,
        name: "",
        donations: 0,
        totalAmount: 0
    });
    const [topDonors, setTopDonors] = useState<any[]>([]);

    useEffect(() => {
        fetchDonationData();
    }, []);

    const fetchDonationData = async () => {
        try {
            setLoading(true);
            const user = auth.currentUser;
            
            if (!user) {
                console.log('No user logged in');
                setLoading(false);
                return;
            }

            // Fetch all donations
            const donationsRef = collection(db, 'donation');
            const donationsSnapshot = await getDocs(donationsRef);
            
            // Group donations by userId and calculate totals
            const donorStats: any = {};
            
            donationsSnapshot.forEach((doc) => {
                const data = doc.data();
                const userId = data.userId;
                
                if (!donorStats[userId]) {
                    donorStats[userId] = {
                        userId: userId,
                        count: 0,
                        totalAmount: 0,
                        name: data.userName || 'Anonymous'
                    };
                }
                
                donorStats[userId].count += 1;
                donorStats[userId].totalAmount += (data.payAmount || 0);
            });

            // Convert to array and sort by donation count
            const sortedDonors = Object.values(donorStats).sort((a: any, b: any) => b.count - a.count);

            // Get top 5 donors
            const top5 = sortedDonors.slice(0, 5).map((donor: any, index) => ({
                id: index + 1,
                userId: donor.userId,
                name: donor.name,
                donations: donor.count,
                totalAmount: donor.totalAmount
            }));

            setTopDonors(top5);

            // Find current user's rank
            const userIndex = sortedDonors.findIndex((donor: any) => donor.userId === user.uid);
            
            if (userIndex !== -1) {
                const userData: any = sortedDonors[userIndex];
                setUserRank({
                    position: userIndex + 1,
                    name: userData.name || user.displayName || 'You',
                    donations: userData.count,
                    totalAmount: userData.totalAmount
                });
            } else {
                // User has no donations yet
                setUserRank({
                    position: sortedDonors.length + 1,
                    name: user.displayName || 'You',
                    donations: 0,
                    totalAmount: 0
                });
            }

        } catch (error) {
            console.error('Error fetching donation data:', error);
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

    const getRankColor = (position: number) => {
        if (position === 1) return "bg-yellow-500";
        if (position === 2) return "bg-gray-400";
        if (position === 3) return "bg-orange-600";
        return "bg-blue-500";
    };

    const getRankIcon = (position: number) => {
        if (position === 1) return "trophy";
        if (position === 2) return "medal";
        if (position === 3) return "medal";
        return "ribbon";
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#EF4444" />
                    <Text className="text-gray-500 mt-4">Loading dashboard...</Text>
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
                        Donation Dashboard
                    </Text>
                    <View className="w-10" />
                </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* User Rank Section */}
                <View className="px-6 py-6">
                    <Text className="text-lg font-bold text-gray-800 mb-4">Your Rank</Text>
                    <View className="bg-white rounded-2xl shadow-md p-5 border border-gray-100">
                        <View className="flex-row items-center">
                            <View className={`${getRankColor(userRank.position)} rounded-full w-16 h-16 items-center justify-center mr-4`}>
                                <Ionicons name={getRankIcon(userRank.position) as any} size={28} color="white" />
                            </View>
                            <View className="flex-1">
                                <View className="flex-row items-center mb-1">
                                    <Text className="text-3xl font-bold text-gray-800 mr-2">
                                        #{userRank.position}
                                    </Text>
                                </View>
                                <Text className="text-gray-600 font-medium mb-1">{userRank.name}</Text>
                                <Text className="text-gray-500 text-sm">
                                    {userRank.donations} donations • {formatAmount(userRank.totalAmount)} contributed
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Top 5 Donors Section */}
                <View className="px-6 pb-6">
                    <Text className="text-lg font-bold text-gray-800 mb-4">Top 5 Donors</Text>
                    {topDonors.length > 0 ? (
                        <View className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
                            {topDonors.map((donor, index) => (
                                <View
                                    key={donor.id}
                                    className={`flex-row items-center p-4 ${
                                        index !== topDonors.length - 1 ? 'border-b border-gray-100' : ''
                                    }`}
                                >
                                    <View className={`${getRankColor(index + 1)} rounded-full w-12 h-12 items-center justify-center mr-4`}>
                                        <Text className="text-white font-bold text-lg">{index + 1}</Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-800 font-semibold text-base mb-1">
                                            {donor.name}
                                        </Text>
                                        <Text className="text-gray-500 text-sm">
                                            {donor.donations} donations • {formatAmount(donor.totalAmount)}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View className="bg-white rounded-2xl shadow-md p-8 items-center border border-gray-100">
                            <Ionicons name="people-outline" size={48} color="#D1D5DB" />
                            <Text className="text-gray-500 mt-3 text-center">
                                No donors yet. Be the first to donate!
                            </Text>
                        </View>
                    )}
                </View>

                {/* Action Buttons */}
                <View className="px-6 pb-8">
                    <Text className="text-lg font-bold text-gray-800 mb-4">Quick Actions</Text>
                    
                    {/* Donate Button */}
                    <TouchableOpacity
                        className="bg-red-500 rounded-2xl p-5 mb-4 shadow-md flex-row items-center"
                        onPress={() => router.push('/donation/donate')}
                        activeOpacity={0.8}
                    >
                        <View className="bg-red-600 rounded-full p-3 mr-4">
                            <Ionicons name="heart" size={24} color="white" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-white font-bold text-lg mb-1">Donate</Text>
                            <Text className="text-red-100 text-sm">Find donation centers near you</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="white" />
                    </TouchableOpacity>

                    {/* Request Donation Button */}
                    <TouchableOpacity
                        className="bg-blue-500 rounded-2xl p-5 mb-4 shadow-md flex-row items-center"
                        onPress={() => router.push('/donation/donationRequest')}
                        activeOpacity={0.8}
                    >
                        <View className="bg-blue-600 rounded-full p-3 mr-4">
                            <Ionicons name="medkit" size={24} color="white" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-white font-bold text-lg mb-1">Request Donation</Text>
                            <Text className="text-blue-100 text-sm">Create a donation request</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="white" />
                    </TouchableOpacity>

                    {/* Donation History Button */}
                    <TouchableOpacity
                        className="bg-gray-700 rounded-2xl p-5 shadow-md flex-row items-center"
                        onPress={() => router.push('/donation/donationHistory')}
                        activeOpacity={0.8}
                    >
                        <View className="bg-gray-800 rounded-full p-3 mr-4">
                            <Ionicons name="list" size={24} color="white" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-white font-bold text-lg mb-1">Donation History</Text>
                            <Text className="text-gray-300 text-sm">View your past donations</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}