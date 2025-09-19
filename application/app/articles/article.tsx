import { Text, View, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, Image } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

export default function Article() {
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
                        Sample Article
                    </Text>
                    <View className="w-10" />
                </View>
            </View>

            <ScrollView className="flex-1 px-6 py-4">
                {/* Article Title */}
                <Text className="text-3xl font-bold text-gray-800 mb-4 leading-tight">
                    The Future of Artificial Intelligence: Transforming Our Digital World
                </Text>

                {/* Featured Image */}
                <View className="mb-6 rounded-lg overflow-hidden">
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80' }}
                        className="w-full h-48"
                        resizeMode="cover"
                    />
                    <Text className="text-xs text-gray-500 mt-2 italic">
                        AI-generated artwork showcasing the future of technology
                    </Text>
                </View>

                {/* Article Body */}
                <Text className="text-lg text-gray-700 mb-4 leading-relaxed">
                    Artificial Intelligence continues to revolutionize industries across the globe,
                    from healthcare and finance to entertainment and transportation. As we move
                    deeper into 2025, the integration of AI technologies has become more seamless
                    and impactful than ever before.
                </Text>

                <Text className="text-lg text-gray-700 mb-6 leading-relaxed">
                    Recent breakthroughs in machine learning algorithms have enabled computers
                    to process and understand human language with unprecedented accuracy. This
                    advancement is transforming how we interact with technology and opening new
                    possibilities for automation and innovation.
                </Text>

                {/* Second Image */}
                <View className="mb-6 rounded-lg overflow-hidden">
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80' }}
                        className="w-full h-48"
                        resizeMode="cover"
                    />
                    <Text className="text-xs text-gray-500 mt-2 italic">
                        Modern data centers powering AI computations
                    </Text>
                </View>

                {/* Subheading */}
                <Text className="text-2xl font-bold text-gray-800 mb-4">
                    Impact on Daily Life
                </Text>

                <Text className="text-lg text-gray-700 mb-4 leading-relaxed">
                    The influence of AI extends far beyond corporate boardrooms and research
                    laboratories. Smart home devices, personalized recommendations, and
                    intelligent assistants have become integral parts of our daily routines.
                </Text>

                <Text className="text-lg text-gray-700 mb-6 leading-relaxed">
                    From voice-activated assistants that help manage our schedules to
                    recommendation algorithms that curate our entertainment choices, AI has
                    quietly woven itself into the fabric of modern life, making our interactions
                    with technology more intuitive and efficient.
                </Text>

                {/* Third Image */}
                <View className="mb-6 rounded-lg overflow-hidden">
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80' }}
                        className="w-full h-48"
                        resizeMode="cover"
                    />
                    <Text className="text-xs text-gray-500 mt-2 italic">
                        Smart devices connecting our digital ecosystem
                    </Text>
                </View>

                {/* Author and Date */}
                <View className="flex-row items-center mb-6">
                    <Text className="text-sm text-gray-600 mr-4">
                        By Sarah Johnson
                    </Text>
                    <Text className="text-sm text-gray-600">
                        September 19, 2025
                    </Text>
                </View>

                {/* Another Subheading */}
                <Text className="text-2xl font-bold text-gray-800 mb-4">
                    Looking Ahead
                </Text>

                <Text className="text-lg text-gray-700 mb-4 leading-relaxed">
                    As we look toward the future, the potential applications of artificial
                    intelligence seem limitless. Researchers are exploring everything from
                    AI-powered medical diagnostics to autonomous transportation systems that
                    could reshape urban infrastructure.
                </Text>

                <Text className="text-lg text-gray-700 mb-8 leading-relaxed">
                    The key to harnessing this potential lies in responsible development and
                    implementation, ensuring that AI technologies serve humanity's best interests
                    while addressing concerns about privacy, security, and ethical use.
                </Text>

                {/* Article Footer */}
                <View className="border-t border-gray-200 pt-6 mb-8">
                    <Text className="text-sm text-gray-600 mb-2">
                        Tags: Artificial Intelligence, Technology, Future, Innovation
                    </Text>
                    <Text className="text-xs text-gray-500">
                        Images courtesy of Unsplash.com
                    </Text>
                </View>
            </ScrollView>

        </SafeAreaView>
    );
}