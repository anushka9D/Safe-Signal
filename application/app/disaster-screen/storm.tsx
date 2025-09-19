import { Text, View, TouchableOpacity, SafeAreaView, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

export default function Storm() {
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
                        Storm Dashboard
                    </Text>
                    <View className="w-10" />
                </View>
            </View>


            {/* Navigation Buttons */}
            <View className="flex-1 justify-center">
                <View className="flex-1 flex-row flex-wrap justify-between p-4">

                    <TouchableOpacity
                        className="bg-gray-800 rounded-xl py-5 px-6 shadow-lg m-1 w-[100%] h-[20%] justify-center"
                        onPress={() => router.push('/locations/location-english')}
                    >
                        <Text className="text-white text-lg font-semibold text-center">
                            Safe Locations
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="bg-gray-800 rounded-xl py-5 px-6 shadow-lg m-1 w-[100%] h-[10%] justify-center"
                        onPress={() => router.push('/articles/english/storm-article-1-english')}
                    >
                        <Text className="text-white text-lg font-semibold text-center">
                            Article 01
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="bg-gray-800 rounded-xl py-5 px-6 shadow-lg m-1 w-[100%] h-[10%] justify-center"
                        onPress={() => router.push('/articles/english/storm-article-2-english')}
                    >
                        <Text className="text-white text-lg font-semibold text-center">
                            Article 02
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="bg-gray-800 rounded-xl py-5 px-6 shadow-lg m-1 w-[100%] h-[10%] justify-center"
                        onPress={() => router.push('/articles/english/storm-article-3-english')}
                    >
                        <Text className="text-white text-lg font-semibold text-center">
                            Article 03
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="bg-gray-800 rounded-xl py-5 px-6 shadow-lg m-1 w-[100%] h-[20%] justify-center"
                        onPress={() => router.push('/contacts/english/storm-contacts-english')}
                    >
                        <Text className="text-white text-lg font-semibold text-center">
                            Contact Numbers
                        </Text>
                    </TouchableOpacity>

                </View>
            </View>

        </SafeAreaView>
    );
}