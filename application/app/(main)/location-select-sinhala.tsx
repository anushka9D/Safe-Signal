import { Text, View, TouchableOpacity, ScrollView, SafeAreaView, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

export default function LocationSelectSinhala() {
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
                        ප්‍රදේශය තෝරන්න
                    </Text>
                    <View className="w-10" />
                </View>
                <Text className="text-gray-600 text-center mt-2">
                    ඔබේ ප්‍රදේශය තෝරා ගන්න
                </Text>
            </View>

            {/* Navigation Button */}
            <View className="flex-1 items-center justify-center">
                <TouchableOpacity
                    className="bg-gray-800 rounded-xl py-5 px-6 w-1/2"
                    onPress={() => router.push('/dashboards/dashboard-sinhala')}
                >
                    <Text className="text-white text-xl font-semibold text-center">
                        ප්‍රධාන පිටුවට
                    </Text>
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
}