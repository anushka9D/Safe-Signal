import { Text, View, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, Image } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

export default function Storm() {
    const router = useRouter();

    const safeLocations = [
        {
            name: "Asgiriya Raja Maha Viharaya",
            location: "Asgiriya, Gampaha",
            distance: "1 Km Away"
        },
        {
            name: "District General Hospital",
            location: "Gampaha",
            distance: "3 Km Away"
        }
    ];

    const articles = [
        {
            title: "The Science of Storms Understanding Weather Patterns and Climate",
            author: "Shivani Vora",
            date: "July 05, 2021",
            image: require('../../assets/images/disasters/storm-damage-2.jpg')
        },
        {
            title: "The Science of Storms Understanding Weather Patterns and Climate",
            author: "Shivani Vora", 
            date: "July 05, 2021",
            image: require('../../assets/images/disasters/storm-damage-3.jpg')
        },
        {
            title: "The Science of Storms Understanding Weather Patterns and Climate",
            author: "Shivani Vora",
            date: "July 05, 2021", 
            image: require('../../assets/images/disasters/storm-damage-4.jpg')
        }
    ];

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Hero Header */}
                <View className="relative h-48">
                    <Image 
                        source={require('../../assets/images/disasters/storm-damage-1.jpg')}
                        className="absolute inset-0 w-full h-full"
                        resizeMode="cover"
                    />
                    
                    {/* Overlay */}
                    <View className="absolute inset-0 bg-black/40" />
                    
                    {/* Header Content */}
                    <View className="absolute top-12 left-0 right-0 px-6 py-4 mt-8">
                        <View className="flex-row items-center justify-between">
                            <TouchableOpacity
                                className="bg-white/20 rounded-full p-2"
                                onPress={() => router.back()}
                            >
                                <Ionicons name="arrow-back" size={24} color="white" />
                            </TouchableOpacity>
                            <Text className="text-white text-3xl font-bold flex-1 text-center">
                                Storms
                            </Text>
                            <View className="w-10" />
                        </View>
                    </View>
                </View>

                {/* Nearest Safe Locations */}
                <View className="bg-gray-700 mx-4 mt-6 rounded-2xl p-4">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-white font-semibold text-lg">
                            Nearest Safe Locations
                        </Text>
                        <TouchableOpacity onPress={() => router.push('/locations/location')}>
                            <Text className="text-gray-300 text-sm">
                                See All
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View className="space-y-3 gap-3">
                        {safeLocations.map((location, index) => (
                            <TouchableOpacity 
                                key={index}
                                className="bg-white rounded-xl p-4"
                                onPress={() => router.push('/')}
                            >
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-1">
                                        <Text className="font-semibold text-gray-800 text-base">
                                            {location.name}
                                        </Text>
                                        <Text className="text-gray-600 text-sm mt-1">
                                            {location.location}
                                        </Text>
                                    </View>
                                    <Text className="text-gray-500 text-sm font-medium">
                                        {location.distance}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Feature Articles */}
                <View className="px-4 mt-8 mb-6">
                    <Text className="text-xl font-bold text-gray-800 mb-4">
                        Feature Articles
                    </Text>
                    
                    <View className="space-y-4">
                        {articles.map((article, index) => (
                            <TouchableOpacity 
                                key={index}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                                onPress={() => router.push('/articles/article')}
                            >
                                <View className="flex-row">
                                    {/* Article Image */}
                                    <Image 
                                        source={article.image}
                                        className="w-24 h-full"
                                        resizeMode="cover"
                                    />
                                    
                                    {/* Article Content */}
                                    <View className="flex-1 p-3">
                                        <Text className="font-semibold text-gray-800 text-sm leading-5 mb-2">
                                            {article.title}
                                        </Text>
                                        
                                        <View className="flex-row items-center">
                                            <View className="w-6 h-6 bg-orange-500 rounded-full mr-2 items-center justify-center">
                                                <Text className="text-white text-xs font-bold">S</Text>
                                            </View>
                                            <View>
                                                <Text className="text-gray-600 text-xs">
                                                    {article.author}
                                                </Text>
                                                <Text className="text-gray-400 text-xs">
                                                    {article.date}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Emergency Contacts */}
                <TouchableOpacity 
                    className="bg-black mx-4 rounded-2xl p-4 mb-8"
                    onPress={() => router.push('/contacts/contacts')}
                >
                    <Text className="text-white text-xl font-bold text-center">
                        Emergency Contacts
                    </Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}