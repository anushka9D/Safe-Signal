import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { doc, getDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { auth, db } from '../../config/firebase-config'

interface DisasterScores {
  flood: number
  earthquake: number
  storm: number
  landslide: number
}

interface AssessmentData {
  overallScore: number
  disasterScores: DisasterScores
  primaryRisk: string
  vulnerabilities: string[]
  strengths: string[]
  completedAt: any
}

export default function RiskAssessmentSummary() {
  const [assessment, setAssessment] = useState<AssessmentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAssessment()
  }, [])

  const loadAssessment = async () => {
    try {
      setLoading(true)
      const uid = auth.currentUser?.uid
      if (!uid) {
        setLoading(false)
        return
      }

      const userDoc = await getDoc(doc(db, 'users', uid))
      if (userDoc.exists() && userDoc.data().riskAssessment) {
        setAssessment(userDoc.data().riskAssessment)
      } else {
        setAssessment(null)
      }
    } catch (error) {
      console.error('Error loading assessment:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'N/A'
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch {
      return 'N/A'
    }
  }

  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'text-green-400'
    if (score >= 70) return 'text-yellow-400'
    if (score >= 50) return 'text-orange-400'
    return 'text-red-400'
  }

  const getScoreLabel = (score: number): string => {
    if (score >= 85) return 'Excellent'
    if (score >= 70) return 'Good'
    if (score >= 50) return 'Moderate'
    return 'At Risk'
  }

  const getDisasterIcon = (disaster: string): any => {
    switch (disaster) {
      case 'flood': return 'water'
      case 'earthquake': return 'pulse'
      case 'storm': return 'thunderstorm'
      case 'landslide': return 'trending-down'
      default: return 'warning'
    }
  }

  const getDisasterColor = (disaster: string): string => {
    switch (disaster) {
      case 'flood': return 'bg-cyan-500'
      case 'earthquake': return 'bg-orange-500'
      case 'storm': return 'bg-purple-500'
      case 'landslide': return 'bg-amber-500'
      default: return 'bg-gray-500'
    }
  }

  const formatDisasterName = (disaster: string): string => {
    return disaster.charAt(0).toUpperCase() + disaster.slice(1)
  }

  const getTopSuggestion = (disaster: string, score: number): string => {
    if (score >= 85) return 'Maintain current safety measures'

    const suggestions: Record<string, string> = {
      flood: 'Elevate utilities and improve drainage systems',
      earthquake: 'Retrofit with seismic reinforcement',
      storm: 'Install storm shutters and secure roof',
      landslide: 'Install retaining walls and plant vegetation'
    }

    return suggestions[disaster] || 'Consult a professional for assessment'
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0b1220]">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-6">
        <TouchableOpacity
          className="bg-gray-800 rounded-full p-2"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-white">Risk Assessment Summary</Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerClassName="p-5 flex-grow pb-20">
        {loading ? (
          <View className="bg-gray-700 rounded-2xl p-6 items-center">
            <ActivityIndicator color="#fff" size="large" />
            <Text className="text-gray-300 mt-2">Loading assessment...</Text>
          </View>
        ) : assessment ? (
          <>
            {/* Overall Score Card */}
            <View className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 items-center mb-6">
              <Text className="text-white text-lg font-semibold mb-2">Overall Resilience Score</Text>
              <Text className="text-white text-6xl font-extrabold mb-2">{assessment.overallScore}%</Text>
              <Text className="text-white text-lg font-medium mb-3">
                {getScoreLabel(assessment.overallScore)}
              </Text>
              {assessment.completedAt && (
                <Text className="text-white text-xs opacity-80">
                  Assessed on {formatDate(assessment.completedAt)}
                </Text>
              )}
            </View>

            {/* Primary Risk Alert */}
            <View className="bg-red-900 border-2 border-red-500 rounded-2xl p-4 mb-6">
              <View className="flex-row items-center mb-2">
                <Ionicons name="warning" size={24} color="#FCA5A5" />
                <Text className="text-red-200 font-bold text-lg ml-2">
                  Primary Risk
                </Text>
              </View>
              <Text className="text-white text-xl font-bold mb-1">
                {formatDisasterName(assessment.primaryRisk)}
              </Text>
              <Text className="text-red-200 text-sm">
                Focus your improvement efforts here
              </Text>
            </View>

            {/* Quick Stats Grid */}
            <View className="flex-row flex-wrap justify-between mb-6">
              {Object.entries(assessment.disasterScores).map(([disaster, score]) => (
                <View key={disaster} className="bg-gray-700 rounded-xl p-3 mb-2 w-[48%]">
                  <View className="flex-row items-center justify-between">
                    <View className={`${getDisasterColor(disaster)} rounded-full p-2 w-10 h-10 items-center justify-center`}>
                      <Ionicons name={getDisasterIcon(disaster)} size={20} color="white" />
                    </View>
                    <Text className={`text-2xl font-bold ${getScoreColor(score)}`}>
                      {score}%
                    </Text>
                  </View>
                  <Text className="text-white font-bold text-base mt-1">
                    {formatDisasterName(disaster)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Key Recommendations */}
            {assessment.vulnerabilities && assessment.vulnerabilities.length > 0 && (
              <View className="bg-gray-700 rounded-2xl p-6 mb-6">
                <View className="flex-row items-center mb-4">
                  <Ionicons name="bulb-outline" size={24} color="#FBBF24" />
                  <Text className="text-yellow-400 font-bold text-lg ml-2">
                    Priority Actions
                  </Text>
                </View>
                {assessment.vulnerabilities.slice(0, 2).map((vulnerability, index) => {
                  const score = assessment.disasterScores[vulnerability as keyof DisasterScores]
                  return (
                    <View key={index} className="mb-3 last:mb-0">
                      <View className="flex-row items-center mb-1">
                        <View className={`${getDisasterColor(vulnerability)} rounded-full p-1 mr-2`}>
                          <Ionicons name={getDisasterIcon(vulnerability)} size={14} color="white" />
                        </View>
                        <Text className="text-white font-semibold">
                          {formatDisasterName(vulnerability)}
                        </Text>
                      </View>
                      <Text className="text-gray-300 text-sm ml-6">
                        {getTopSuggestion(vulnerability, score)}
                      </Text>
                    </View>
                  )
                })}
              </View>
            )}

            {/* Action Buttons */}
            <TouchableOpacity
              className="bg-blue-600 rounded-2xl p-5 mb-3"
              onPress={() => router.push('/quiz/riskAssessmentResults')}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="document-text" size={24} color="white" />
                <Text className="text-white text-xl font-bold ml-2">
                  View Detailed Report
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-orange-500 rounded-2xl p-5 mb-12"
              onPress={() => router.push('/quiz/riskAssessmentQuiz')}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="refresh" size={24} color="white" />
                <Text className="text-white text-xl font-bold ml-2">
                  Retake Assessment
                </Text>
              </View>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View className="bg-gray-700 rounded-2xl p-6 items-center mb-6">
              <Ionicons name="help-circle-outline" size={64} color="#9CA3AF" />
              <Text className="text-white font-semibold mt-4 text-center text-lg">
                No Assessment Taken
              </Text>
              <Text className="text-gray-400 text-sm text-center mt-2">
                Take the risk assessment to calculate your home's resilience score.
              </Text>
            </View>

            {/* Information Cards */}
            <View className="bg-gray-700 rounded-2xl p-5 mb-4">
              <View className="flex-row items-center mb-3">
                <Ionicons name="information-circle" size={24} color="#60A5FA" />
                <Text className="text-blue-400 font-bold text-lg ml-2">
                  What You'll Learn
                </Text>
              </View>
              <View className="flex-row mb-2">
                <Text className="text-blue-400 mr-2">•</Text>
                <Text className="text-white flex-1">
                  Your home's resilience to floods, earthquakes, storms, and landslides
                </Text>
              </View>
              <View className="flex-row mb-2">
                <Text className="text-blue-400 mr-2">•</Text>
                <Text className="text-white flex-1">
                  Specific vulnerabilities that need attention
                </Text>
              </View>
              <View className="flex-row mb-2">
                <Text className="text-blue-400 mr-2">•</Text>
                <Text className="text-white flex-1">
                  Actionable recommendations to improve safety
                </Text>
              </View>
              <View className="flex-row">
                <Text className="text-blue-400 mr-2">•</Text>
                <Text className="text-white flex-1">
                  Your strongest protection areas
                </Text>
              </View>
            </View>

            <View className="bg-gray-700 rounded-2xl p-5 mb-6">
              <View className="flex-row items-center mb-3">
                <Ionicons name="time" size={24} color="#FBBF24" />
                <Text className="text-yellow-400 font-bold text-lg ml-2">
                  Quick & Easy
                </Text>
              </View>
              <Text className="text-white text-sm">
                The assessment takes only 5-10 minutes to complete. Answer 15 questions about your home's location, structure, and features to get a comprehensive resilience report.
              </Text>
            </View>

            <TouchableOpacity
              className="bg-orange-500 rounded-2xl p-5 mb-12"
              onPress={() => router.push('/quiz/riskAssessmentQuiz')}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="play-circle" size={24} color="white" />
                <Text className="text-white font-bold text-xl ml-2">
                  Start Assessment
                </Text>
              </View>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}