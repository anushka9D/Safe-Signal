import { Text, View, TouchableOpacity, SafeAreaView, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

export default function EarthquakeSinhala() {
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
                        භුමි කම්පා
                    </Text>
                    <View className="w-10" />
                </View>
            </View>


            {/* Navigation Buttons */}
            <View className="flex-1 justify-center">
                <View className="flex-1 flex-row flex-wrap justify-between p-4">

                    <TouchableOpacity
                        className="bg-gray-800 rounded-xl py-5 px-6 shadow-lg m-1 w-[100%] h-[20%] justify-center"
                        onPress={() => router.push('/locations/location-sinhala')}
                    >
                        <Text className="text-white text-lg font-semibold text-center">
                            ආරක්ෂිත ස්ථාන
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="bg-gray-800 rounded-xl py-5 px-6 shadow-lg m-1 w-[100%] h-[10%] justify-center"
                        onPress={() => router.push('/articles/sinhala/earthquake-article-1-sinhala')}
                    >
                        <Text className="text-white text-lg font-semibold text-center">
                            විස්තර පත්‍රිකා 01
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="bg-gray-800 rounded-xl py-5 px-6 shadow-lg m-1 w-[100%] h-[10%] justify-center"
                        onPress={() => router.push('/articles/sinhala/earthquake-article-2-sinhala')}
                    >
                        <Text className="text-white text-lg font-semibold text-center">
                            විස්තර පත්‍රිකා 02
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="bg-gray-800 rounded-xl py-5 px-6 shadow-lg m-1 w-[100%] h-[10%] justify-center"
                        onPress={() => router.push('/articles/sinhala/earthquake-article-3-sinhala')}
                    >
                        <Text className="text-white text-lg font-semibold text-center">
                            විස්තර පත්‍රිකා 03
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="bg-gray-800 rounded-xl py-5 px-6 shadow-lg m-1 w-[100%] h-[20%] justify-center"
                        onPress={() => router.push('/contacts/sinhala/earthquake-contacts-sinhala')}
                    >
                        <Text className="text-white text-lg font-semibold text-center">
                            සම්බන්ධතා අංක
                        </Text>
                    </TouchableOpacity>

                </View>
            </View>

        </SafeAreaView>
    );
}