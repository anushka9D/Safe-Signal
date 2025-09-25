import { Text, View, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

                {/* Header Section */}
                <View className="bg-white px-6 py-4 pt-12 mt-4 mb-4">

                    <View className="flex-row items-center justify-between mb-6">
                        <View className="flex-1">
                            <Text className="text-xl font-bold text-gray-800">
                                Welcome
                            </Text>
                            <Text className="text-xl font-bold text-gray-800">
                                Dinuka Rathnayake
                            </Text>
                        </View>

                        <View className="flex-row space-x-5 gap-3">
                            <TouchableOpacity 
                                className="bg-gray-100 rounded-full p-2"
                                onPress={() => router.push('/')}
                            >
                                <Ionicons name="person" size={35} color="#4B5563" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                                className="bg-gray-100 rounded-full p-2"
                                onPress={() => router.push('/notifications/notifications')}
                            >
                                <Ionicons name="notifications" size={35} color="#4B5563" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                                className="bg-gray-100 rounded-full p-2"
                                onPress={() => router.push('/settings/settings')}
                            >
                                <Ionicons name="settings" size={35} color="#4B5563" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Upper Cards */}
                    <View className="flex-row space-x-4 gap-4">

                        {/* Badges */}
                        <TouchableOpacity 
                            className="bg-gray-800 rounded-2xl p-4 flex-1"
                            onPress={() => router.push('/')}
                        >
                            <Text className="text-white font-semibold text-base mb-3 text-center">
                                Your Badges
                            </Text>
                            <View className="flex-row space-x-2 gap-3">
                                <View className="bg-yellow-100 rounded-full w-11 h-11 items-center justify-center">
                                    <Text className="text-white text-lg font-bold">🏆</Text>
                                </View>
                                <View className="bg-gray-100 rounded-full w-11 h-11 items-center justify-center">
                                    <Text className="text-white text-lg font-bold">⭐</Text>
                                </View>
                                <View className="bg-yellow-100 rounded-full w-11 h-11 items-center justify-center">
                                    <Text className="text-white text-lg font-bold">🥉</Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* Saved Location */}
                        <TouchableOpacity 
                            className="bg-gray-800 rounded-2xl p-4 flex-1"
                            onPress={() => router.push('/')}
                        >
                            <Text className="text-white font-semibold text-base mb-2 text-center">
                                Saved Location
                            </Text>
                            <Text className="text-white text-lg font-bold text-center">
                                Asgiriya{'\n'}Gampaha
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Recent Notifications Section */}
                <View className="bg-gray-800 mx-4 rounded-2xl p-4 mb-6 pb-6">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-white font-semibold text-lg">
                            Recent Notifications
                        </Text>

                        <TouchableOpacity onPress={() => router.push('/notifications/notifications')}>
                            <Text className="text-gray-300 text-sm">
                                See All
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Notifications */}
                    <View className="space-y-3 gap-4">
                        <TouchableOpacity className="bg-white rounded-xl p-3 flex-row items-center">
                            <View className="bg-blue-100 rounded-full p-2 mr-3">
                                <Ionicons name="water" size={20} color="#3B82F6" />
                            </View>
                            <View className="flex-1">
                                <Text className="font-semibold text-gray-800 text-lg">Flood</Text>
                                <Text className="text-gray-600 text-md">Location : Kalutara</Text>
                            </View>

                            <Text className="text-gray-500 text-md">5 min ago</Text>
                        </TouchableOpacity>

                        <TouchableOpacity className="bg-white rounded-xl p-3 flex-row items-center">
                            <View className="bg-red-100 rounded-full p-2 mr-3">
                                <Ionicons name="thunderstorm" size={20} color="#EF4444" />
                            </View>
                            <View className="flex-1">
                                <Text className="font-semibold text-gray-800 text-lg">Tropical Cyclone</Text>
                                <Text className="text-gray-600 text-md">Location : Gampaha</Text>
                            </View>

                            <Text className="text-gray-500 text-md">24 min ago</Text>
                        </TouchableOpacity>

                        {/*
                        <TouchableOpacity className="bg-white rounded-xl p-3 flex-row items-center">
                            <View className="bg-yellow-100 rounded-full p-2 mr-3">
                                <Ionicons name="warning" size={20} color="#F59E0B" />
                            </View>
                            <View className="flex-1">
                                <Text className="font-semibold text-gray-800 text-lg">Earthquake</Text>
                                <Text className="text-gray-600 text-md">Location : Rathanapura</Text>
                            </View>

                            <Text className="text-gray-500 text-md">an hour ago</Text>
                        </TouchableOpacity>
                        */}
                    </View>
                </View>

                {/* Risk Assessment Quiz */}
                <TouchableOpacity 
                    className="bg-gray-800 mx-4 rounded-2xl p-6 mb-4"
                    onPress={() => router.push('/')}
                >
                    <Text className="text-white text-xl font-bold text-center">
                        Risk Assessment Quiz
                    </Text>
                </TouchableOpacity>

                {/* Disaster Categories Grid */}
                <View className="px-4 mb-4">
                    <View className="flex-row space-x-4 mb-4 gap-4">
                        <TouchableOpacity 
                            className="bg-gray-800 rounded-2xl p-6 flex-1 items-center justify-center h-24"
                            onPress={() => router.push('/disaster-screen/flood')}
                        >
                            <Text className="text-white text-lg font-bold">
                                Floods
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            className="bg-gray-800 rounded-2xl p-6 flex-1 items-center justify-center h-24"
                            onPress={() => router.push('/disaster-screen/earthquake')}
                        >
                            <Text className="text-white text-lg font-bold">
                                Earthquake
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row space-x-4 gap-4">
                        <TouchableOpacity 
                            className="bg-gray-800 rounded-2xl p-6 flex-1 items-center justify-center h-24"
                            onPress={() => router.push('/disaster-screen/landSlide')}
                        >
                            <Text className="text-white text-lg font-bold">
                                Landslides
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            className="bg-gray-800 rounded-2xl p-6 flex-1 items-center justify-center h-24"
                            onPress={() => router.push('/disaster-screen/storm')}
                        >
                            <Text className="text-white text-lg font-bold">
                                Storms
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Donate & Help */}
                <TouchableOpacity 
                    className="bg-gray-800 mx-4 rounded-2xl p-6 mb-8"
                    onPress={() => router.push('/')}
                >
                    <Text className="text-white text-xl font-bold text-center">
                        Donate & Help
                    </Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}