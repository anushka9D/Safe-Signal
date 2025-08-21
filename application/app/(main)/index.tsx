import { Text, View, TouchableOpacity, SafeAreaView, StatusBar } from "react-native";
import { useRouter } from "expo-router";

export default function Index() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100">
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            <View className="flex-1 items-center justify-center px-6 pt-8">

                <View className="items-center mb-12">
                    <Text className="text-4xl font-bold text-gray-800 mb-6 text-center">
                        Safe Signal 
                    </Text>
                    <Text className="text-lg text-gray-600 text-center leading-6">
                        Choose your preferred language to continue
                    </Text>
                </View>

                {/* Navigation Buttons */}
                <View className="w-full max-w-xs space-y-4">
                    
                    {/* Sinhala Button */}
                    <TouchableOpacity
                        className="bg-gray-800 rounded-xl py-5 px-6 shadow-lg mb-8"
                        onPress={() => router.push('/location-select-sinhala')}
                    >
                        <Text className="text-white text-xl font-semibold text-center">
                            සිංහල
                        </Text>
                    </TouchableOpacity>

                    {/* English Button */}
                    <TouchableOpacity
                        className="bg-gray-800 rounded-xl py-5 px-6 shadow-lg"
                        onPress={() => router.push('/location-select-english')}
                    >
                        <Text className="text-white text-xl font-semibold text-center">
                            English
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}