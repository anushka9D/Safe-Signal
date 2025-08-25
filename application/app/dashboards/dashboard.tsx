import { Text, View, TouchableOpacity, SafeAreaView, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

export default function Dashboard() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-gradient-to-br">
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
                    <Text className="text-2xl font-bold text-gray-800">
                        Dashboard
                    </Text>
                    <View className="w-10" />
                </View>
            </View>


            {/* Navigation Buttons */}
            <View className="flex-1 justify-center">
                <View className="flex-1 flex-row flex-wrap justify-between p-4">

                    <TouchableOpacity
                        className="bg-gray-800 rounded-xl py-5 px-6 shadow-lg m-1 w-[45%] h-[20%] justify-center"
                        onPress={() => router.push('/disaster-screen/english/flood-english')}
                    >
                        <Text className="text-white text-lg font-semibold text-center">
                            Flood
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="bg-gray-800 rounded-xl py-5 px-6 shadow-lg m-1 w-[45%] h-[20%] justify-center"
                        onPress={() => router.push('/disaster-screen/english/land-slides-english')}
                    >
                        <Text className="text-white text-lg font-semibold text-center">
                            Land Slides
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="bg-gray-800 rounded-xl py-5 px-6 shadow-lg m-1 w-[45%] h-[20%] justify-center"
                        onPress={() => router.push('/disaster-screen/english/earthquake-english')}
                    >
                        <Text className="text-white text-lg font-semibold text-center">
                            Earthquake
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="bg-gray-800 rounded-xl py-5 px-6 shadow-lg m-1 w-[45%] h-[20%] justify-center"
                        onPress={() => router.push('/disaster-screen/english/storm-english')}
                    >
                        <Text className="text-white text-lg font-semibold text-center">
                            Storms
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="bg-gray-800 rounded-xl py-5 px-6 shadow-lg m-1 w-[100%] h-[10%] justify-center"
                        onPress={() => router.push('/settings/settings-english')}
                    >
                        <Text className="text-white text-lg font-semibold text-center">
                            Settings
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="bg-gray-800 rounded-xl py-5 px-6 shadow-lg m-1 w-[100%] h-[10%] justify-center"
                        onPress={() => router.push('/notifications/notifications-english')}
                    >
                        <Text className="text-white text-lg font-semibold text-center">
                            Notifications
                        </Text>
                    </TouchableOpacity>

                </View>
            </View>

        </SafeAreaView>
    );
}