import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { auth, db } from '../../config/firebase-config';

interface UserData {
    quizCompleted?: boolean;
    knowledgeLevel?: string;
    riskAssessmentCompleted?: boolean;
}

interface Badge {
    id: string;
    name: string;
    description: string;
    icon: any;
    iconColor: string;
    bgColor: string;
    requirement: string;
    earned: boolean;
}

export default function Badges() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [earnedCount, setEarnedCount] = useState(0);

    useEffect(() => {
        loadBadges();
    }, []);

    const loadBadges = async () => {
        try {
            setLoading(true);
            
            if (!auth.currentUser) {
                console.log('No user authenticated');
                return;
            }

            // Get user data - only need this now!
            const userDocRef = doc(db, 'users', auth.currentUser.uid);
            const userDoc = await getDoc(userDocRef);

            let userData: UserData = {};

            if (userDoc.exists()) {
                userData = userDoc.data() as UserData;
            }

            // Define all available badges - calculated from user data
            // Progressive badge system: higher levels earn all lower level badges
            const isAdvanced = userData.knowledgeLevel === 'advanced';
            const isIntermediate = userData.knowledgeLevel === 'intermediate';
            const isBeginner = userData.knowledgeLevel === 'beginner';
            
            const allBadges: Badge[] = [
                {
                    id: 'quiz_completer',
                    name: 'Quiz Completer',
                    description: 'Completed the onboarding quiz',
                    icon: 'checkmark-circle',
                    iconColor: '#FFFFFF',
                    bgColor: 'bg-green-500',
                    requirement: 'Complete the user onboarding quiz',
                    earned: userData.quizCompleted === true // Direct check from user data!
                },
                {
                    id: 'beginner',
                    name: 'Bronze Explorer',
                    description: 'Started your disaster preparedness journey',
                    icon: 'medal',
                    iconColor: '#FFFFFF',
                    bgColor: 'bg-orange-400',
                    requirement: 'Achieve beginner knowledge level',
                    earned: isBeginner || isIntermediate || isAdvanced // All levels earn this
                },
                {
                    id: 'intermediate',
                    name: 'Silver Learner',
                    description: 'Developing strong preparedness knowledge',
                    icon: 'medal',
                    iconColor: '#FFFFFF',
                    bgColor: 'bg-gray-400',
                    requirement: 'Achieve intermediate knowledge level (60-79% quiz score)',
                    earned: isIntermediate || isAdvanced // Intermediate and Advanced earn this
                },
                {
                    id: 'advanced',
                    name: 'Gold Expert',
                    description: 'Master of disaster preparedness',
                    icon: 'medal',
                    iconColor: '#FFFFFF',
                    bgColor: 'bg-yellow-500',
                    requirement: 'Achieve advanced knowledge level (80%+ quiz score)',
                    earned: isAdvanced // Only Advanced earns this
                },
                {
                    id: 'risk_assessment',
                    name: 'Risk Assessment Complete',
                    description: 'Completed comprehensive home risk assessment',
                    icon: 'shield-checkmark',
                    iconColor: '#FFFFFF',
                    bgColor: 'bg-purple-500',
                    requirement: 'Complete the full risk assessment quiz',
                    earned: userData.riskAssessmentCompleted === true
                }
            ];

            setBadges(allBadges);
            setEarnedCount(allBadges.filter(b => b.earned).length);

        } catch (error) {
            console.error('Error loading badges:', error);
        } finally {
            setLoading(false);
        }
    };

    const earnedBadges = badges.filter(b => b.earned);
    const lockedBadges = badges.filter(b => !b.earned);

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
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
                            Badges & Achievements
                        </Text>
                        <View className="w-10" />
                    </View>
                </View>

                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text className="text-gray-600 mt-4">Loading badges...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-800">
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            {/* Header */}
            <View className="shadow-sm px-6 py-4 pt-12">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                        className="bg-gray-100 rounded-full p-2"
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#4B5563" />
                    </TouchableOpacity>
                    <Text className="text-2xl font-bold text-gray-50">
                        Badges & Achievements
                    </Text>
                    <View className="w-10" />
                </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Progress Summary Card */}
                <View className="bg-gradient-to-r from-orange-500 to-red-500 mx-6 mt-6 rounded-2xl p-6">
                    <View className="items-center">
                        <Text className="text-white text-lg font-semibold mb-2">
                            Your Progress
                        </Text>
                        <View className="flex-row items-center">
                            <Text className="text-white text-5xl font-extrabold">
                                {earnedCount}
                            </Text>
                            <Text className="text-white text-2xl font-bold ml-2">
                                / {badges.length}
                            </Text>
                        </View>
                        <Text className="text-white text-sm mt-2 opacity-90">
                            Badges Earned
                        </Text>
                    </View>
                </View>

                {/* Earned Badges Section */}
                <View className="px-6 mt-8">
                    <View className="flex-row items-center mb-4">
                        <Ionicons name="trophy" size={24} color="#10B981" />
                        <Text className="text-xl font-bold text-gray-50 ml-2">
                            Earned Badges
                        </Text>
                        <View className="bg-green-100 px-3 py-1 rounded-full ml-3">
                            <Text className="text-green-700 text-sm font-semibold">
                                {earnedCount}
                            </Text>
                        </View>
                    </View>

                    {earnedBadges.length === 0 ? (
                        <View className="bg-white rounded-2xl p-6 items-center border border-gray-200">
                            <Ionicons name="lock-closed-outline" size={48} color="#9CA3AF" />
                            <Text className="text-gray-600 text-center mt-4 font-semibold">
                                No badges earned yet
                            </Text>
                            <Text className="text-gray-500 text-sm text-center mt-2">
                                Complete challenges below to earn your first badge!
                            </Text>
                        </View>
                    ) : (
                        <View className="space-y-3 gap-3">
                            {earnedBadges.map((badge) => (
                                <View
                                    key={badge.id}
                                    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200"
                                >
                                    <View className="flex-row items-center">
                                        <View className={`${badge.bgColor} rounded-2xl p-4 mr-4`}>
                                            <Ionicons
                                                name={badge.icon}
                                                size={40}
                                                color={badge.iconColor}
                                            />
                                        </View>
                                        <View className="flex-1">
                                            <View className="flex-row items-center mb-1">
                                                <Text className="text-lg font-bold text-gray-800">
                                                    {badge.name}
                                                </Text>
                                                <Ionicons
                                                    name="checkmark-circle"
                                                    size={20}
                                                    color="#10B981"
                                                    style={{ marginLeft: 6 }}
                                                />
                                            </View>
                                            <Text className="text-gray-600 text-sm leading-5">
                                                {badge.description}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Available Badges Section */}
                <View className="px-6 mt-8 mb-16">
                    <View className="flex-row items-center mb-4">
                        <Ionicons name="gift-outline" size={24} color="#6B7280" />
                        <Text className="text-xl font-bold text-gray-50 ml-2">
                            Available Badges
                        </Text>
                        <View className="bg-gray-200 px-3 py-1 rounded-full ml-3">
                            <Text className="text-gray-700 text-sm font-semibold">
                                {lockedBadges.length}
                            </Text>
                        </View>
                    </View>

                    {lockedBadges.length === 0 ? (
                        <View className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 items-center">
                            <Ionicons name="medal" size={64} color="#FFFFFF" />
                            <Text className="text-white text-xl font-bold mt-4">
                                Congratulations!!
                            </Text>
                            <Text className="text-white text-center mt-2">
                                You've earned all available badges!
                            </Text>
                        </View>
                    ) : (
                        <View className="space-y-3 gap-3">
                            {lockedBadges.map((badge) => (
                                <View
                                    key={badge.id}
                                    className="bg-white rounded-2xl p-5 border-2 border-dashed border-gray-300 opacity-75"
                                >
                                    <View className="flex-row items-center">
                                        <View className="bg-gray-100 rounded-2xl p-4 mr-4">
                                            <Ionicons
                                                name="lock-closed"
                                                size={40}
                                                color="#9CA3AF"
                                            />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-lg font-bold text-gray-800 mb-1">
                                                {badge.name}
                                            </Text>
                                            <Text className="text-gray-600 text-sm mb-2">
                                                {badge.description}
                                            </Text>
                                            <View className="bg-gray-100 px-3 py-2 rounded-lg">
                                                <View className="flex-row items-center">
                                                    <Ionicons
                                                        name="information-circle"
                                                        size={14}
                                                        color="#6B7280"
                                                    />
                                                    <Text className="text-gray-600 text-xs font-medium ml-1">
                                                        How to earn:
                                                    </Text>
                                                </View>
                                                <Text className="text-gray-700 text-xs mt-1">
                                                    {badge.requirement}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}