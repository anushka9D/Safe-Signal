import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { onAuthStateChanged, signOut, User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { auth, db } from '../../config/firebase-config'
import { clearLocked, setLocked } from '../../lib/biometrics'

interface QuizResults {
    quizCompleted: boolean;
    quizScore: number;
    knowledgeLevel: string;
    weakAreas: string[];
    strongAreas: string[];
    totalCorrect: number;
    totalQuestions: number;
    userRiskArea?: string;
    quizCompletedAt?: any;
}

export default function Settings() {
    const [user, setUser] = useState<User | null>(null)
    const [busy, setBusy] = useState(false)
    const [quizResults, setQuizResults] = useState<QuizResults | null>(null)
    const [loadingQuiz, setLoadingQuiz] = useState(true)

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser)
            if (currentUser) {
                loadQuizResults(currentUser.uid)
            } else {
                setLoadingQuiz(false)
            }
        })
        return unsub
    }, [])

    const loadQuizResults = async (userId: string) => {
        try {
            setLoadingQuiz(true)
            const userDocRef = doc(db, 'users', userId)
            const userDoc = await getDoc(userDocRef)

            if (userDoc.exists()) {
                const userData = userDoc.data()
                if (userData.quizCompleted) {
                    setQuizResults({
                        quizCompleted: userData.quizCompleted || false,
                        quizScore: userData.quizScore || 0,
                        knowledgeLevel: userData.knowledgeLevel || 'beginner',
                        weakAreas: userData.weakAreas || [],
                        strongAreas: userData.strongAreas || [],
                        totalCorrect: userData.totalCorrect || 0,
                        totalQuestions: userData.totalQuestions || 0,
                        userRiskArea: userData.userRiskArea,
                        quizCompletedAt: userData.quizCompletedAt
                    })
                }
            }
        } catch (error) {
            console.error('Error loading quiz results:', error)
        } finally {
            setLoadingQuiz(false)
        }
    }

    const handleLock = async () => {
        const uid = auth.currentUser?.uid
        if (!uid) return
        await setLocked(uid)
        router.replace('/auth/login')
    }

    const handleLogout = async () => {
        const uid = auth.currentUser?.uid
        try {
            setBusy(true)
            if (uid) await clearLocked(uid)
            await signOut(auth)
            router.replace('/')
        } catch (e: any) {
            Alert.alert('Logout failed', String(e?.message ?? e))
        } finally {
            setBusy(false)
        }
    }

    const getKnowledgeLevelColor = (level: string) => {
        switch (level.toLowerCase()) {
            case 'advanced':
                return 'bg-green-500'
            case 'intermediate':
                return 'bg-yellow-500'
            case 'beginner':
                return 'bg-orange-500'
            default:
                return 'bg-gray-500'
        }
    }

    const formatCategoryName = (category: string): string => {
        const names: Record<string, string> = {
            'flood': 'Floods',
            'earthquake': 'Earthquakes',
            'landslide': 'Landslides',
            'storm': 'Storms',
            'common': 'General Preparedness'
        }
        return names[category] || category
    }

    const formatDate = (timestamp: any): string => {
        if (!timestamp) return 'N/A'
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            })
        } catch {
            return 'N/A'
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-[#0b1220]">
            <ScrollView contentContainerClassName="p-5 gap-5">

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
                            Settings
                        </Text>
                        <View className="w-10" />
                    </View>
                </View>

                <Text className="text-slate-400 mx-4">{user?.email ?? '—'}</Text>

                <View className="flex-row gap-3 mx-4">
                    <Pressable onPress={handleLock} className="flex-1 bg-gray-600 rounded-2xl p-6">
                        <Text className="text-white text-xl font-bold text-center">Lock app</Text>
                    </Pressable>

                    <Pressable onPress={handleLogout} disabled={busy} className="flex-1 bg-gray-600 rounded-2xl p-6">
                        {busy ? <ActivityIndicator color="#fff" /> :
                            <Text className="text-white text-xl font-bold text-center">Logout</Text>
                        }
                    </Pressable>
                </View>

                {/* Quiz Results Summary */}
                {loadingQuiz ? (
                    <View className="bg-gray-600 mx-4 rounded-2xl p-6 items-center">
                        <ActivityIndicator color="#fff" size="small" />
                        <Text className="text-white mt-2">Loading quiz results...</Text>
                    </View>
                ) : quizResults && quizResults.quizCompleted ? (
                    <View className="bg-gray-600 mx-4 rounded-2xl p-6 mb-4">
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-white text-lg font-bold">Quiz Results Summary</Text>
                        </View>

                        {/* Score Section */}
                        <View className="bg-white/10 rounded-xl p-4 mb-3">
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-white font-semibold">Overall Score</Text>
                                <Text className="text-white text-2xl font-bold">
                                    {quizResults.quizScore}%
                                </Text>
                            </View>
                            <Text className="text-gray-300 text-sm">
                                {quizResults.totalCorrect} out of {quizResults.totalQuestions} correct
                            </Text>
                        </View>

                        {/* Knowledge Level */}
                        <View className="bg-white/10 rounded-xl p-4 mb-3">
                            <Text className="text-white font-semibold mb-2">Knowledge Level</Text>
                            <View className="flex-row items-center">
                                <View className={`${getKnowledgeLevelColor(quizResults.knowledgeLevel)} rounded-full px-3 py-1`}>
                                    <Text className="text-white font-bold uppercase text-sm">
                                        {quizResults.knowledgeLevel}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Risk Area */}
                        {quizResults.userRiskArea && (
                            <View className="bg-orange-500/20 border border-orange-500/50 rounded-xl p-4 mb-3">
                                <View className="flex-row items-center mb-1">
                                    <Ionicons name="warning" size={16} color="#FB923C" />
                                    <Text className="text-orange-300 font-semibold ml-2">
                                        Primary Risk Area
                                    </Text>
                                </View>
                                <Text className="text-white font-bold">
                                    {formatCategoryName(quizResults.userRiskArea)}
                                </Text>
                            </View>
                        )}

                        {/* Strong & Weak Areas */}
                        <View className="flex-row gap-3">
                            {quizResults.strongAreas.length > 0 && (
                                <View className="flex-1 bg-green-500/20 border border-green-500/50 rounded-xl p-3">
                                    <View className="flex-row items-center mb-2">
                                        <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                                        <Text className="text-green-300 font-semibold text-xs ml-1">
                                            Strong Areas
                                        </Text>
                                    </View>
                                    {quizResults.strongAreas.slice(0, 2).map((area, index) => (
                                        <Text key={index} className="text-white text-xs mb-1">
                                            • {formatCategoryName(area)}
                                        </Text>
                                    ))}
                                </View>
                            )}

                            {quizResults.weakAreas.length > 0 && (
                                <View className="flex-1 bg-red-500/20 border border-red-500/50 rounded-xl p-3">
                                    <View className="flex-row items-center mb-2">
                                        <Ionicons name="alert-circle" size={16} color="#EF4444" />
                                        <Text className="text-red-300 font-semibold text-xs ml-1">
                                            Focus Areas
                                        </Text>
                                    </View>
                                    {quizResults.weakAreas.slice(0, 2).map((area, index) => (
                                        <Text key={index} className="text-white text-xs mb-1">
                                            • {formatCategoryName(area)}
                                        </Text>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Completion Date */}
                        {quizResults.quizCompletedAt && (
                            <Text className="text-gray-400 text-xs text-center mt-3">
                                Completed on {formatDate(quizResults.quizCompletedAt)}
                            </Text>
                        )}
                    </View>
                ) : (
                    <View className="bg-gray-600 mx-4 rounded-2xl p-6 mb-4 items-center">
                        <Ionicons name="help-circle-outline" size={48} color="#9CA3AF" />
                        <Text className="text-white font-semibold mt-2 text-center">
                            No Quiz Results Available
                        </Text>
                        <Text className="text-gray-400 text-sm text-center mt-1">
                            Complete the onboarding quiz to see your results
                        </Text>
                    </View>
                )}

                {/* Retake Quiz Button */}
                <TouchableOpacity
                    className="bg-gray-600 mx-4 rounded-2xl p-6 mb-8"
                    onPress={() => router.push('/quiz/onboarding')}
                >
                    <View className="flex-row items-center justify-center">
                        <Ionicons 
                            name={quizResults?.quizCompleted ? "refresh" : "play-circle"} 
                            size={24} 
                            color="white" 
                        />
                        <Text className="text-white text-xl font-bold text-center ml-2">
                            {quizResults?.quizCompleted ? 'Retake Onboarding Quiz' : 'Take Onboarding Quiz'}
                        </Text>
                    </View>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    )
}