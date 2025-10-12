import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { auth, db } from '../../config/firebase-config'

interface RiskMapping {
  flood: number
  earthquake: number
  storm: number
  landslide: number
}

interface RiskQuestion {
  id: number
  question: string
  options: string[]
  category: string
  riskMapping: Record<string, RiskMapping>
}

const RISK_ASSESSMENT_QUESTIONS: RiskQuestion[] = [
  {
    id: 1,
    question: 'What is your house located in or near?',
    options: [
      'River valley or flood plain',
      'Steep hillside or slope',
      'Coastal area (within 5km of sea)',
      'Flat urban/suburban area'
    ],
    category: 'location',
    riskMapping: {
      'River valley or flood plain': { flood: 3, storm: 2, landslide: 1, earthquake: 0 },
      'Steep hillside or slope': { landslide: 3, earthquake: 2, flood: 1, storm: 1 },
      'Coastal area (within 5km of sea)': { flood: 3, storm: 3, earthquake: 1, landslide: 0 },
      'Flat urban/suburban area': { earthquake: 1, flood: 1, storm: 1, landslide: 0 }
    }
  },
  {
    id: 2,
    question: 'What is the elevation of your property?',
    options: [
      'Low-lying (prone to water accumulation)',
      'Moderate elevation',
      'High elevation on stable ground',
      'On a slope or hillside'
    ],
    category: 'location',
    riskMapping: {
      'Low-lying (prone to water accumulation)': { flood: 3, storm: 2, earthquake: 0, landslide: 0 },
      'Moderate elevation': { flood: 1, storm: 1, earthquake: 0, landslide: 0 },
      'High elevation on stable ground': { flood: 0, storm: 1, earthquake: 0, landslide: 0 },
      'On a slope or hillside': { landslide: 3, flood: 1, earthquake: 2, storm: 1 }
    }
  },
  {
    id: 3,
    question: 'What type of foundation does your house have?',
    options: [
      'No proper foundation / weak foundation',
      'Shallow foundation on soft soil',
      'Deep foundation with reinforcement',
      'Foundation on bedrock'
    ],
    category: 'structure',
    riskMapping: {
      'No proper foundation / weak foundation': { earthquake: 3, flood: 2, landslide: 3, storm: 2 },
      'Shallow foundation on soft soil': { earthquake: 2, flood: 2, landslide: 2, storm: 1 },
      'Deep foundation with reinforcement': { earthquake: 0, flood: 1, landslide: 0, storm: 0 },
      'Foundation on bedrock': { earthquake: 0, flood: 0, landslide: 0, storm: 0 }
    }
  },
  {
    id: 4,
    question: 'What is the primary building material of your house?',
    options: [
      'Unreinforced brick or concrete blocks',
      'Reinforced concrete',
      'Wood or timber frame',
      'Mixed materials (brick + concrete)'
    ],
    category: 'structure',
    riskMapping: {
      'Unreinforced brick or concrete blocks': { earthquake: 3, storm: 2, flood: 1, landslide: 2 },
      'Reinforced concrete': { earthquake: 0, storm: 0, flood: 0, landslide: 0 },
      'Wood or timber frame': { earthquake: 1, storm: 2, flood: 3, landslide: 1 },
      'Mixed materials (brick + concrete)': { earthquake: 1, storm: 1, flood: 1, landslide: 1 }
    }
  },
  {
    id: 5,
    question: 'How many stories is your building?',
    options: [
      'Single story',
      '2 stories',
      '3 or more stories',
      'Multi-story with no structural reinforcement'
    ],
    category: 'structure',
    riskMapping: {
      'Single story': { earthquake: 0, storm: 1, flood: 2, landslide: 1 },
      '2 stories': { earthquake: 1, storm: 1, flood: 1, landslide: 1 },
      '3 or more stories': { earthquake: 2, storm: 2, flood: 0, landslide: 2 },
      'Multi-story with no structural reinforcement': { earthquake: 3, storm: 3, flood: 1, landslide: 3 }
    }
  },
  {
    id: 6,
    question: 'Does your building have structural reinforcement?',
    options: [
      'No reinforcement',
      'Minimal reinforcement (some columns)',
      'Moderate reinforcement (columns + beams)',
      'Full reinforcement with seismic design'
    ],
    category: 'structure',
    riskMapping: {
      'No reinforcement': { earthquake: 3, storm: 3, flood: 2, landslide: 3 },
      'Minimal reinforcement (some columns)': { earthquake: 2, storm: 2, flood: 1, landslide: 2 },
      'Moderate reinforcement (columns + beams)': { earthquake: 1, storm: 1, flood: 0, landslide: 1 },
      'Full reinforcement with seismic design': { earthquake: 0, storm: 0, flood: 0, landslide: 0 }
    }
  },
  {
    id: 7,
    question: 'What type of roof does your house have?',
    options: [
      'Lightweight metal sheets (not anchored)',
      'Clay/concrete tiles (heavy)',
      'Lightweight metal properly anchored',
      'Reinforced concrete slab'
    ],
    category: 'roof',
    riskMapping: {
      'Lightweight metal sheets (not anchored)': { storm: 3, earthquake: 1, flood: 0, landslide: 1 },
      'Clay/concrete tiles (heavy)': { earthquake: 2, storm: 2, flood: 0, landslide: 1 },
      'Lightweight metal properly anchored': { storm: 1, earthquake: 0, flood: 0, landslide: 0 },
      'Reinforced concrete slab': { storm: 0, earthquake: 0, flood: 0, landslide: 0 }
    }
  },
  {
    id: 8,
    question: 'Are the walls properly connected to the foundation and roof?',
    options: [
      'No proper connections',
      'Walls connected to foundation only',
      'Walls connected to roof only',
      'Fully connected (foundation, walls, and roof)'
    ],
    category: 'roof',
    riskMapping: {
      'No proper connections': { earthquake: 3, storm: 3, flood: 2, landslide: 3 },
      'Walls connected to foundation only': { earthquake: 2, storm: 2, flood: 1, landslide: 2 },
      'Walls connected to roof only': { earthquake: 2, storm: 2, flood: 1, landslide: 2 },
      'Fully connected (foundation, walls, and roof)': { earthquake: 0, storm: 0, flood: 0, landslide: 0 }
    }
  },
  {
    id: 9,
    question: 'What is the elevation of your lowest floor relative to potential flood levels?',
    options: [
      'Below potential flood level',
      'At the same level as potential flooding',
      'Slightly elevated (0.5-1m above)',
      'Well elevated (1.5m+ above flood level)'
    ],
    category: 'flood',
    riskMapping: {
      'Below potential flood level': { flood: 3, storm: 2, earthquake: 0, landslide: 0 },
      'At the same level as potential flooding': { flood: 3, storm: 2, earthquake: 0, landslide: 0 },
      'Slightly elevated (0.5-1m above)': { flood: 1, storm: 1, earthquake: 0, landslide: 0 },
      'Well elevated (1.5m+ above flood level)': { flood: 0, storm: 0, earthquake: 0, landslide: 0 }
    }
  },
  {
    id: 10,
    question: 'Does your property have proper drainage systems?',
    options: [
      'No drainage system',
      'Basic natural drainage',
      'Constructed drains and gutters',
      'Advanced drainage with flood barriers'
    ],
    category: 'flood',
    riskMapping: {
      'No drainage system': { flood: 3, storm: 3, earthquake: 0, landslide: 2 },
      'Basic natural drainage': { flood: 2, storm: 2, earthquake: 0, landslide: 1 },
      'Constructed drains and gutters': { flood: 1, storm: 1, earthquake: 0, landslide: 0 },
      'Advanced drainage with flood barriers': { flood: 0, storm: 0, earthquake: 0, landslide: 0 }
    }
  },
  {
    id: 11,
    question: 'Where are your electrical outlets and appliances located?',
    options: [
      'All at ground level',
      'Mix of ground and elevated',
      'Most elevated above 1 meter',
      'All elevated with waterproof installations'
    ],
    category: 'utilities',
    riskMapping: {
      'All at ground level': { flood: 3, storm: 2, earthquake: 0, landslide: 0 },
      'Mix of ground and elevated': { flood: 2, storm: 1, earthquake: 0, landslide: 0 },
      'Most elevated above 1 meter': { flood: 1, storm: 0, earthquake: 0, landslide: 0 },
      'All elevated with waterproof installations': { flood: 0, storm: 0, earthquake: 0, landslide: 0 }
    }
  },
  {
    id: 12,
    question: 'How old is your building?',
    options: [
      'More than 30 years (no renovations)',
      'More than 30 years (with renovations)',
      '10-30 years old',
      'Less than 10 years old'
    ],
    category: 'general',
    riskMapping: {
      'More than 30 years (no renovations)': { earthquake: 3, flood: 2, storm: 2, landslide: 2 },
      'More than 30 years (with renovations)': { earthquake: 1, flood: 1, storm: 1, landslide: 1 },
      '10-30 years old': { earthquake: 1, flood: 1, storm: 1, landslide: 1 },
      'Less than 10 years old': { earthquake: 0, flood: 0, storm: 0, landslide: 0 }
    }
  },
  {
    id: 13,
    question: 'Is there evidence of soil movement or cracks around your property?',
    options: [
      'Yes, visible cracks and soil movement',
      'Some minor cracks',
      'No visible issues',
      'Reinforced with retaining walls'
    ],
    category: 'landslide',
    riskMapping: {
      'Yes, visible cracks and soil movement': { landslide: 3, earthquake: 2, flood: 1, storm: 1 },
      'Some minor cracks': { landslide: 2, earthquake: 1, flood: 0, storm: 0 },
      'No visible issues': { landslide: 0, earthquake: 0, flood: 0, storm: 0 },
      'Reinforced with retaining walls': { landslide: 0, earthquake: 0, flood: 0, storm: 0 }
    }
  },
  {
    id: 14,
    question: 'What is the vegetation cover around your property?',
    options: [
      'No vegetation (bare soil)',
      'Minimal vegetation',
      'Moderate grass and plants',
      'Dense vegetation with deep-rooted trees'
    ],
    category: 'landslide',
    riskMapping: {
      'No vegetation (bare soil)': { landslide: 3, flood: 2, storm: 1, earthquake: 0 },
      'Minimal vegetation': { landslide: 2, flood: 1, storm: 1, earthquake: 0 },
      'Moderate grass and plants': { landslide: 1, flood: 0, storm: 0, earthquake: 0 },
      'Dense vegetation with deep-rooted trees': { landslide: 0, flood: 0, storm: 0, earthquake: 0 }
    }
  },
  {
    id: 15,
    question: 'What type of windows does your house have?',
    options: [
      'Regular glass (no protection)',
      'Regular glass with shutters',
      'Impact-resistant or laminated glass',
      'Storm shutters installed'
    ],
    category: 'windows',
    riskMapping: {
      'Regular glass (no protection)': { storm: 3, earthquake: 1, flood: 0, landslide: 0 },
      'Regular glass with shutters': { storm: 1, earthquake: 1, flood: 0, landslide: 0 },
      'Impact-resistant or laminated glass': { storm: 0, earthquake: 0, flood: 0, landslide: 0 },
      'Storm shutters installed': { storm: 0, earthquake: 0, flood: 0, landslide: 0 }
    }
  }
]

interface DisasterScores {
  flood: number
  earthquake: number
  storm: number
  landslide: number
}

export default function RiskAssessmentQuiz() {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [loading, setLoading] = useState(false)

  const question = RISK_ASSESSMENT_QUESTIONS[currentQuestion]
  const isLast = currentQuestion === RISK_ASSESSMENT_QUESTIONS.length - 1

  const selectOption = (option: string) => {
    setAnswers(prev => ({ ...prev, [question.id]: option }))
  }

  const nextQuestion = () => {
    if (!answers[question.id]) {
      Alert.alert('Please select an answer')
      return
    }
    if (isLast) submitAssessment()
    else setCurrentQuestion(currentQuestion + 1)
  }

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const calculateDisasterScores = (userAnswers: Record<number, string>) => {
    const riskScores: DisasterScores = {
      flood: 0,
      earthquake: 0,
      storm: 0,
      landslide: 0
    }

    const maxPossibleRisk: DisasterScores = {
      flood: 0,
      earthquake: 0,
      storm: 0,
      landslide: 0
    }

    RISK_ASSESSMENT_QUESTIONS.forEach(q => {
      const selectedOption = userAnswers[q.id]
      if (selectedOption && q.riskMapping) {
        const risks = q.riskMapping[selectedOption]
        
        Object.keys(risks).forEach(disaster => {
          const riskValue = risks[disaster as keyof DisasterScores]
          riskScores[disaster as keyof DisasterScores] += riskValue
          
          const maxRisk = Math.max(
            ...Object.values(q.riskMapping).map(r => r[disaster as keyof DisasterScores])
          )
          maxPossibleRisk[disaster as keyof DisasterScores] += maxRisk
        })
      }
    })

    const disasterScores: DisasterScores = {
      flood: maxPossibleRisk.flood > 0 
        ? Math.round((1 - riskScores.flood / maxPossibleRisk.flood) * 100) 
        : 100,
      earthquake: maxPossibleRisk.earthquake > 0 
        ? Math.round((1 - riskScores.earthquake / maxPossibleRisk.earthquake) * 100) 
        : 100,
      storm: maxPossibleRisk.storm > 0 
        ? Math.round((1 - riskScores.storm / maxPossibleRisk.storm) * 100) 
        : 100,
      landslide: maxPossibleRisk.landslide > 0 
        ? Math.round((1 - riskScores.landslide / maxPossibleRisk.landslide) * 100) 
        : 100
    }

    const overallScore = Math.round(
      (disasterScores.flood + disasterScores.earthquake + disasterScores.storm + disasterScores.landslide) / 4
    )

    const primaryRisk = Object.entries(disasterScores)
      .reduce((a, b) => a[1] < b[1] ? a : b)[0]

    const vulnerabilities = Object.entries(disasterScores)
      .filter(([_, score]) => score < 70)
      .map(([disaster, _]) => disaster)

    const strengths = Object.entries(disasterScores)
      .filter(([_, score]) => score >= 85)
      .map(([disaster, _]) => disaster)

    return {
      overallScore,
      disasterScores,
      primaryRisk,
      vulnerabilities,
      strengths
    }
  }

  const submitAssessment = async () => {
    try {
      setLoading(true)
      const uid = auth.currentUser?.uid
      if (!uid) {
        Alert.alert('Error', 'User not logged in')
        return
      }

      const results = calculateDisasterScores(answers)

      await updateDoc(doc(db, 'users', uid), {
        riskAssessment: {
          overallScore: results.overallScore,
          disasterScores: results.disasterScores,
          primaryRisk: results.primaryRisk,
          vulnerabilities: results.vulnerabilities,
          strengths: results.strengths,
          answers,
          completedAt: serverTimestamp(),
        },
        riskAssessmentCompleted: true
      })

      Alert.alert(
        'Assessment Complete', 
        `Your Overall Resilience Score: ${results.overallScore}%\n\nPrimary Risk Area: ${results.primaryRisk.toUpperCase()}`,
        [
          { text: 'View Detailed Results', onPress: () => router.replace('/quiz/riskAssessmentResults') },
        ]
      )
    } catch (e) {
      console.error('Error saving assessment:', e)
      Alert.alert('Error', 'Failed to save assessment')
    } finally {
      setLoading(false)
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'location': return 'bg-blue-100'
      case 'structure': return 'bg-green-100'
      case 'roof': return 'bg-orange-100'
      case 'flood': return 'bg-cyan-100'
      case 'utilities': return 'bg-yellow-100'
      case 'general': return 'bg-gray-100'
      case 'landslide': return 'bg-amber-100'
      case 'windows': return 'bg-purple-100'
      default: return 'bg-gray-100'
    }
  }

  const getCategoryTextColor = (category: string) => {
    switch (category) {
      case 'location': return 'text-blue-700'
      case 'structure': return 'text-green-700'
      case 'roof': return 'text-orange-700'
      case 'flood': return 'text-cyan-700'
      case 'utilities': return 'text-yellow-700'
      case 'general': return 'text-gray-700'
      case 'landslide': return 'text-amber-700'
      case 'windows': return 'text-purple-700'
      default: return 'text-gray-700'
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0b1220]">
      <ScrollView contentContainerClassName="p-5">
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
        {/* Progress Indicators */}
        <View className="flex-row flex-wrap justify-center mb-6">
          {RISK_ASSESSMENT_QUESTIONS.map((_, index) => (
            <View
              key={index}
              className={`w-8 h-8 rounded-full items-center justify-center m-1 ${
                index < currentQuestion
                  ? 'bg-green-500'
                  : index === currentQuestion
                  ? 'bg-orange-500'
                  : 'bg-gray-400'
              }`}
            >
              <Text className="text-white text-xs font-bold">{index + 1}</Text>
            </View>
          ))}
        </View>

        <View className="bg-gray-700 rounded-2xl p-6">
          {/* Category Badge */}
          <View className="items-center mb-4">
            <View className={`px-4 py-2 rounded-full ${getCategoryColor(question.category)}`}>
              <Text className={`text-xs font-bold ${getCategoryTextColor(question.category)}`}>
                {question.category.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text className="text-white text-xl font-bold mb-6 text-center">{question.question}</Text>
          
          {question.options.map((opt, idx) => (
            <Pressable
              key={idx}
              onPress={() => selectOption(opt)}
              className={`p-4 mb-3 rounded-xl border-2 ${
                answers[question.id] === opt
                  ? 'bg-orange-500 border-orange-500'
                  : 'bg-slate-100 border-slate-200'
              }`}
            >
              <Text
                className={`font-medium text-center ${
                  answers[question.id] === opt ? 'text-white' : 'text-slate-800'
                }`}
              >
                {opt}
              </Text>
            </Pressable>
          ))}

          {/* Navigation Buttons */}
          <View className="flex-row justify-between mt-6">
            <Pressable
              onPress={previousQuestion}
              disabled={currentQuestion === 0}
              className={`px-6 py-3 rounded-xl ${
                currentQuestion === 0 ? 'bg-gray-400' : 'bg-slate-600'
              }`}
            >
              <Text className="text-white font-bold">Previous</Text>
            </Pressable>

            <Pressable
              onPress={nextQuestion}
              disabled={loading}
              className={`px-6 py-3 rounded-xl ${loading ? 'bg-slate-400' : 'bg-orange-500'}`}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-center">
                  {isLast ? 'Submit' : 'Next'}
                </Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* Progress */}
        <Text className="text-gray-400 text-center mt-4">
          Question {currentQuestion + 1} of {RISK_ASSESSMENT_QUESTIONS.length}
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}