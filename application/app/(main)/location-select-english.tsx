import { Text, View, TouchableOpacity, ScrollView, SafeAreaView, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

export default function LocationSelectEnglish() {
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
                        Select Location
                    </Text>
                    <View className="w-10" />
                </View>
                <Text className="text-gray-600 text-center mt-2">
                    Choose your preferred location
                </Text>
            </View>

            {/* Navigation Button */}
            <View className="flex-1 items-center justify-center">
                <TouchableOpacity
                    className="bg-gray-800 rounded-xl py-5 px-6 w-1/2"
                    onPress={() => router.push('/dashboard/dashboard-english')}
                >
                    <Text className="text-white text-xl font-semibold text-center">
                        Goto Dashboard
                    </Text>
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
}