import { Text, View, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

export default function DonationDashboard() {
    const router = useRouter();

    // Mock data
    const userRank = {
        position: 12,
        name: "John Doe",
        donations: 15
    };

    const topDonors = [
        { id: 1, name: "Sarah Johnson", donations: 48 },
        { id: 2, name: "Michael Chen", donations: 42 },
        { id: 3, name: "Emma Williams", donations: 38 },
        { id: 4, name: "David Brown", donations: 35 },
        { id: 5, name: "Lisa Anderson", donations: 32 },
    ];

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
                                    {userRank.donations} donations completed
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Top 5 Donors Section */}
                <View className="px-6 pb-6">
                    <Text className="text-lg font-bold text-gray-800 mb-4">Top 5 Donors</Text>
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
                                        {donor.donations} donations
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
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