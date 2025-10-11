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

export default function RiskAssessmentResults() {
  const [assessment, setAssessment] = useState<AssessmentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadResults()
  }, [])

  const loadResults = async () => {
    try {
      setLoading(true)
      const uid = auth.currentUser?.uid
      if (!uid) {
        setLoading(false)
        return
      }

      const userDoc = await getDoc(doc(db, 'users', uid))
      if (userDoc.exists() && userDoc.data().riskAssessment) {
        const data = userDoc.data().riskAssessment
        setAssessment(data)
      } else {
        setAssessment(null)
      }
    } catch (error) {
      console.error('Error loading assessment results:', error)
    } finally {
      setLoading(false)
    }
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

  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'text-green-400'
    if (score >= 70) return 'text-yellow-400'
    if (score >= 50) return 'text-orange-400'
    return 'text-red-400'
  }

  const getScoreBgColor = (score: number): string => {
    if (score >= 85) return 'bg-green-500'
    if (score >= 70) return 'bg-yellow-500'
    if (score >= 50) return 'bg-orange-500'
    return 'bg-red-500'
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

  const generateSuggestions = (assessment: AssessmentData): Record<string, string[]> => {
    const suggestions: Record<string, string[]> = {}

    // Flood suggestions
    if (assessment.disasterScores.flood < 70) {
      suggestions.flood = [
        'Elevate your home or critical utilities above potential flood levels',
        'Install flood barriers or sandbags around entry points',
        'Improve drainage systems with proper gutters and downspouts',
        'Move electrical outlets and appliances to higher levels',
        'Consider flood-resistant building materials for lower floors',
        'Create emergency evacuation plan and flood emergency kit'
      ]
    } else if (assessment.disasterScores.flood < 85) {
      suggestions.flood = [
        'Maintain and clean drainage systems regularly',
        'Keep emergency supplies and important documents in waterproof containers',
        'Review and update your flood insurance coverage'
      ]
    }

    // Earthquake suggestions
    if (assessment.disasterScores.earthquake < 70) {
      suggestions.earthquake = [
        'Retrofit your home with seismic reinforcement and anchor bolts',
        'Secure heavy furniture and appliances to walls',
        'Strengthen connections between foundation, walls, and roof',
        'Replace unreinforced masonry with reinforced materials',
        'Install flexible utility connections to prevent gas leaks',
        'Consult a structural engineer for professional assessment'
      ]
    } else if (assessment.disasterScores.earthquake < 85) {
      suggestions.earthquake = [
        'Secure hanging objects and heavy items on shelves',
        'Practice earthquake drills with your family',
        'Keep emergency supplies and tools accessible'
      ]
    }

    // Storm suggestions
    if (assessment.disasterScores.storm < 70) {
      suggestions.storm = [
        'Install storm shutters or impact-resistant windows',
        'Secure roof with hurricane straps and reinforced anchoring',
        'Trim trees and remove dead branches near your home',
        'Reinforce garage doors and entry doors',
        'Ensure proper roof maintenance and seal any vulnerabilities',
        'Create a safe room or identify shelter area in your home'
      ]
    } else if (assessment.disasterScores.storm < 85) {
      suggestions.storm = [
        'Inspect and maintain roof regularly for loose materials',
        'Keep emergency supplies including flashlights and batteries',
        'Clear gutters and drainage to prevent water damage'
      ]
    }

    // Landslide suggestions
    if (assessment.disasterScores.landslide < 70) {
      suggestions.landslide = [
        'Install retaining walls to stabilize slopes around your property',
        'Plant deep-rooted vegetation to prevent soil erosion',
        'Improve drainage to direct water away from slopes',
        'Monitor and repair cracks in soil or foundations immediately',
        'Avoid construction or heavy landscaping on steep slopes',
        'Consult a geotechnical engineer for slope stability assessment'
      ]
    } else if (assessment.disasterScores.landslide < 85) {
      suggestions.landslide = [
        'Monitor your property for signs of soil movement',
        'Maintain vegetation and drainage systems',
        'Be alert during heavy rainfall for unusual ground changes'
      ]
    }

    return suggestions
  }

  const renderDisasterScoreCard = (disaster: string, score: number) => (
    <View key={disaster} className="bg-gray-800 rounded-xl p-4 mb-3">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View className={`${getDisasterColor(disaster)} rounded-full p-2 mr-3`}>
            <Ionicons name={getDisasterIcon(disaster)} size={24} color="white" />
          </View>
          <View>
            <Text className="text-white font-bold text-lg">
              {formatDisasterName(disaster)}
            </Text>
            <Text className="text-gray-400 text-sm">
              {getScoreLabel(score)} Resilience
            </Text>
          </View>
        </View>
        <Text className={`text-3xl font-bold ${getScoreColor(score)}`}>
          {score}%
        </Text>
      </View>
      
      {/* Progress Bar */}
      <View className="bg-gray-700 rounded-full h-3 overflow-hidden">
        <View 
          className={`h-full ${getScoreBgColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </View>
    </View>
  )

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#0b1220]">
        <View className="bg-white shadow-sm px-6 py-4 pt-12">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              className="bg-gray-100 rounded-full p-2 mt-8"
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#4B5563" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-gray-800">
              Assessment Results
            </Text>
            <View className="w-10" />
          </View>
        </View>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#f97316" />
          <Text className="text-gray-300 mt-4">Loading results...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!assessment) {
    return (
      <SafeAreaView className="flex-1 bg-[#0b1220]">
        <View className="bg-white shadow-sm px-6 py-4 pt-12">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              className="bg-gray-100 rounded-full p-2 mt-8"
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#4B5563" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-gray-800">
              Assessment Results
            </Text>
            <View className="w-10" />
          </View>
        </View>
        <ScrollView contentContainerClassName="p-5">
          <View className="bg-gray-700 rounded-2xl p-6 items-center">
            <Ionicons name="help-circle-outline" size={64} color="#9CA3AF" />
            <Text className="text-white font-semibold mt-4 text-center text-lg">
              No Assessment Data Found
            </Text>
            <Text className="text-gray-400 text-sm text-center mt-2">
              Please complete the risk assessment quiz to see your results.
            </Text>
            <TouchableOpacity
              className="bg-orange-500 rounded-xl px-6 py-3 mt-6"
              onPress={() => router.push('/quiz/riskAssessmentQuiz')}
            >
              <Text className="text-white font-bold">Take Assessment</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  const suggestions = generateSuggestions(assessment)

  return (
    <SafeAreaView className="flex-1 bg-[#0b1220]">
       {/* Header */}
        <View className="flex-row items-center justify-between mb-6 mt-4">
          <TouchableOpacity 
            className="bg-gray-800 rounded-full p-2" 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-white">Risk Assessment</Text>
          <View className="w-10" />
        </View>

      <ScrollView contentContainerClassName="p-5 pb-20">
        {/* Overall Score Section */}
        <View className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 items-center mb-6">
          <Text className="text-white text-lg font-semibold mb-2">
            Overall Resilience Score
          </Text>
          <Text className="text-white text-6xl font-extrabold mb-2">
            {assessment.overallScore}%
          </Text>
          <Text className="text-white text-lg font-medium mb-4">
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
              Primary Risk Area
            </Text>
          </View>
          <Text className="text-white text-xl font-bold">
            {formatDisasterName(assessment.primaryRisk)}
          </Text>
          <Text className="text-red-200 text-sm mt-1">
            Your home shows the lowest resilience to this disaster type. 
            Focus on improvements in this area.
          </Text>
        </View>

        {/* Individual Disaster Scores */}
        <View className="mb-6">
          <Text className="text-white text-xl font-bold mb-4">
            Disaster Resilience Breakdown
          </Text>
          {Object.entries(assessment.disasterScores).map(([disaster, score]) =>
            renderDisasterScoreCard(disaster, score)
          )}
        </View>

        {/* Vulnerabilities Section */}
        {assessment.vulnerabilities && assessment.vulnerabilities.length > 0 && (
          <View className="bg-gray-700 rounded-2xl p-6 mb-6">
            <View className="flex-row items-center mb-4">
              <Ionicons name="shield-checkmark-outline" size={24} color="#FCA5A5" />
              <Text className="text-red-300 font-bold text-lg ml-2">
                Areas Needing Improvement
              </Text>
            </View>
            {assessment.vulnerabilities.map((vulnerability, index) => (
              <View key={index} className="mb-4 last:mb-0">
                <Text className="text-white font-semibold text-base mb-2">
                  {formatDisasterName(vulnerability)}
                </Text>
                {suggestions[vulnerability]?.map((suggestion, idx) => (
                  <View key={idx} className="flex-row mb-2">
                    <Text className="text-orange-400 mr-2">•</Text>
                    <Text className="text-gray-300 flex-1 text-sm">{suggestion}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Strengths Section */}
        {assessment.strengths && assessment.strengths.length > 0 && (
          <View className="bg-green-900 border-2 border-green-500 rounded-2xl p-6 mb-6">
            <View className="flex-row items-center mb-3">
              <Ionicons name="checkmark-circle" size={24} color="#86EFAC" />
              <Text className="text-green-200 font-bold text-lg ml-2">
                Strong Protection Areas
              </Text>
            </View>
            <Text className="text-white mb-2">
              Your home shows excellent resilience to:
            </Text>
            {assessment.strengths.map((strength, index) => (
              <View key={index} className="flex-row items-center mt-1">
                <Ionicons name="shield-checkmark" size={18} color="#86EFAC" />
                <Text className="text-green-100 ml-2 font-medium">
                  {formatDisasterName(strength)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* General Recommendations */}
        <View className="bg-gray-700 rounded-2xl p-6 mb-6">
          <View className="flex-row items-center mb-3">
            <Ionicons name="bulb-outline" size={24} color="#FBBF24" />
            <Text className="text-yellow-400 font-bold text-lg ml-2">
              General Recommendations
            </Text>
          </View>
          <View className="flex-row mb-2">
            <Text className="text-yellow-400 mr-2">•</Text>
            <Text className="text-white flex-1">
              Keep emergency supplies stocked (water, food, first aid, flashlight)
            </Text>
          </View>
          <View className="flex-row mb-2">
            <Text className="text-yellow-400 mr-2">•</Text>
            <Text className="text-white flex-1">
              Develop and practice a family emergency plan
            </Text>
          </View>
          <View className="flex-row mb-2">
            <Text className="text-yellow-400 mr-2">•</Text>
            <Text className="text-white flex-1">
              Review and update your insurance coverage regularly
            </Text>
          </View>
          <View className="flex-row mb-2">
            <Text className="text-yellow-400 mr-2">•</Text>
            <Text className="text-white flex-1">
              Stay informed about local disaster warnings and alerts
            </Text>
          </View>
          <View className="flex-row">
            <Text className="text-yellow-400 mr-2">•</Text>
            <Text className="text-white flex-1">
              Schedule annual home inspections to identify new vulnerabilities
            </Text>
          </View>
        </View>

        {/* Retake Button */}
        <TouchableOpacity
          className="bg-orange-500 rounded-2xl p-5 mb-6"
          onPress={() => router.push('/quiz/riskAssessmentQuiz')}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="refresh" size={24} color="white" />
            <Text className="text-white text-xl font-bold ml-2">
              Retake Assessment
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}