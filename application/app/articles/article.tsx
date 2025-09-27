import { Text, View, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, Image } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

export default function Article() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-white">
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
                    <View className="w-10" />
                </View>
            </View>

            <ScrollView className="flex-1 px-6 py-4">
                {/* Featured Image */}
                <View className="mb-6 rounded-lg overflow-hidden">
                    <Image
                        source={require('../../assets/images/disasters/earthquake-damage-1.jpg')}
                        className="w-full h-48"
                        resizeMode="cover"
                    />
                </View>

                {/* Category Tags */}
                <View className="flex-row mb-4">
                    <View className="bg-gray-200 rounded-full px-3 py-1 mr-3">
                        <Text className="text-sm text-gray-700">Earthquakes</Text>
                    </View>
                    <View className="bg-gray-200 rounded-full px-3 py-1">
                        <Text className="text-sm text-gray-700">Preparation</Text>
                    </View>
                </View>

                {/* Article Title */}
                <Text className="text-3xl font-bold text-gray-900 mb-6 leading-tight">
                    The Science of Earthquakes Understanding Tectonic Plates and Faults
                </Text>

                {/* Author Info */}
                <View className="flex-row items-center mb-6">
                    <Image
                        source={require('../../assets/images/admin.jpg')}
                        className="w-12 h-12 rounded-full mr-3"
                    />
                    <View className="flex-1">
                        <Text className="text-lg font-semibold text-gray-900">
                            Shylla Monic
                        </Text>
                        <Text className="text-sm text-gray-600">
                            2019.01.01
                        </Text>
                    </View>
                </View>

                {/* Article Body */}
                <Text className="text-lg text-gray-700 mb-6 leading-relaxed">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                    Fusce eget convallis ex. Donec id ipsum sed augue 
                    dapibus pellentesque eu a urna. Sed vel lacus quam. 
                    Mauris magna massa, commodo eu lacus aliquet, laoreet 
                    pellentesque nisl. Aliquam a dui ullamcorper, accumsan 
                    lorem vel, eleifend nisl. Proin eu lectus egestas, posuere 
                    felis sit amet, interdum diam. Lorem ipsum dolor sit amet, 
                    consectetur adipiscing elit. Etiam condimentum orci et nisl 
                    tristique, id dictum lectus ullamcorper. Nullam ac
                </Text>

                <Text className="text-lg text-gray-700 mb-8 leading-relaxed">
                    lorem vel, eleifend nisl. Proin eu lectus egestas, posuere 
                    felis sit amet, interdum diam. Lorem ipsum dolor sit amet, 
                    consectetur adipiscing elit. Etiam condimentum orci et nisl 
                    tristique, id dictum lectus ullamcorper. Nullam ac
                </Text>

                {/* Related Badges & Achievements Section */}
                <View className="bg-gray-800 rounded-lg p-6 mb-8">
                    <Text className="text-lg font-semibold text-white mb-4">
                        Related Badges & Achievements
                    </Text>
                    
                    <View className="flex-row items-center">
                        <View className="bg-blue-500 rounded-full p-3 mr-4">
                            <View className="w-8 h-8 bg-white rounded-full items-center justify-center">
                                <Ionicons name="star" size={20} color="#3B82F6" />
                            </View>
                        </View>
                        
                        <View className="flex-1">
                            <Text className="text-lg font-semibold text-white mb-1">
                                Badge Name
                            </Text>
                            <Text className="text-sm text-gray-300 leading-relaxed">
                                Lorem ipsum dolor sit amet, consectetur adipiscing 
                                elit. Fusce eget convallis ex.
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}