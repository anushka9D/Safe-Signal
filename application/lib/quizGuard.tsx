import { useEffect, useState } from 'react'
import { router } from 'expo-router'
import { auth, db } from '../config/firebase-config'
import { doc, getDoc } from 'firebase/firestore'
import { ActivityIndicator, View, Text } from 'react-native'

interface QuizGuardProps {
  children: React.ReactNode
  redirectTo?: string
}

export function QuizGuard({ children, redirectTo = '/quiz/onboarding' }: QuizGuardProps) {
  const [loading, setLoading] = useState(true)
  const [quizCompleted, setQuizCompleted] = useState(false)

  useEffect(() => {
    checkQuizStatus()
  }, [])

  const checkQuizStatus = async () => {
    try {
      if (!auth.currentUser) {
        // If no user is authenticated, redirect to auth
        router.replace('/auth/login')
        return
      }

      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid))
      
      if (!userDoc.exists()) {
        // User document doesn't exist, redirect to quiz
        router.replace('/quiz/onboarding')
        return
      }

      const userData = userDoc.data()
      const hasCompletedQuiz = userData.quizCompleted === true

      if (!hasCompletedQuiz) {
        // Quiz not completed, redirect to quiz
        router.replace('/quiz/onboarding')
        return
      }

      // Quiz completed, allow access
      setQuizCompleted(true)
    } catch (error) {
      console.error('Error checking quiz status:', error)
      // On error, redirect to quiz to be safe
      router.replace('/quiz/onboarding')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View className="flex-1 bg-[#0b1220] items-center justify-center">
        <ActivityIndicator size="large" color="#f97316" />
        <Text className="text-white mt-4 text-lg">Loading...</Text>
      </View>
    )
  }

  if (!quizCompleted) {
    // This shouldn't render since we redirect above, but just in case
    return (
      <View className="flex-1 bg-[#0b1220] items-center justify-center">
        <ActivityIndicator size="large" color="#f97316" />
        <Text className="text-white mt-4 text-lg">Redirecting to quiz...</Text>
      </View>
    )
  }

  return <>{children}</>
}

// Helper function to get user's quiz data
export async function getUserQuizData(uid: string) {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid))
    if (!userDoc.exists()) return null
    
    const userData = userDoc.data()
    return {
      quizCompleted: userData.quizCompleted || false,
      quizScore: userData.quizScore || 0,
      knowledgeLevel: userData.knowledgeLevel || 'beginner',
      weakAreas: userData.weakAreas || [],
      strongAreas: userData.strongAreas || [],
      quizCompletedAt: userData.quizCompletedAt
    }
  } catch (error) {
    console.error('Error fetching user quiz data:', error)
    return null
  }
}