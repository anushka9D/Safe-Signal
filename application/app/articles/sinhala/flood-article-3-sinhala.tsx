import { Text, View, TouchableOpacity, SafeAreaView, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

export default function FloodArticleThreeSinhala() {
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
                        ගංවතුර විස්තර 03
                    </Text>
                    <View className="w-10" />
                </View>
            </View>

        </SafeAreaView>
    );
}