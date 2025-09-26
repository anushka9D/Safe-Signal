import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, Text, View, TouchableOpacity } from 'react-native'
import { KeyboardAvoidingView, Platform, ScrollView, SafeAreaView, StatusBar } from 'react-native'
import { auth, db } from '../../config/firebase-config'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { Ionicons } from '@expo/vector-icons';

const QUIZ_QUESTIONS = [
	{
		id: 1,
		question: "What should be your first priority during an earthquake?",
		options: [
			{ id: 'A', text: 'Run outside immediately' },
			{ id: 'B', text: 'Hide under a table or desk' },
			{ id: 'C', text: 'Drop, Cover, and Hold On' },
			{ id: 'D', text: 'Call for help' },
			{ id: 'E', text: 'Stand in a doorway' }
		],
		correctAnswer: 'C',
		category: 'earthquake'
	},
	{
		id: 2,
		question: "How much water should you store per person per day for emergencies?",
		options: [
			{ id: 'A', text: '1 liter' },
			{ id: 'B', text: '2 liters' },
			{ id: 'C', text: '3 liters' },
			{ id: 'D', text: '4 liters' },
			{ id: 'E', text: '5 liters' }
		],
		correctAnswer: 'D',
		category: 'preparedness'
	},
	{
		id: 3,
		question: "What is the safest place during a flood?",
		options: [
			{ id: 'A', text: 'Ground floor of your house' },
			{ id: 'B', text: 'Higher ground or upper floors' },
			{ id: 'C', text: 'Near windows for visibility' },
			{ id: 'D', text: 'In your car' },
			{ id: 'E', text: 'In the basement' }
		],
		correctAnswer: 'B',
		category: 'flood'
	},
	{
		id: 4,
		question: "How long should an emergency kit sustain your family?",
		options: [
			{ id: 'A', text: '24 hours' },
			{ id: 'B', text: '48 hours' },
			{ id: 'C', text: '72 hours (3 days)' },
			{ id: 'D', text: '1 week' },
			{ id: 'E', text: '2 weeks' }
		],
		correctAnswer: 'C',
		category: 'preparedness'
	},
	{
		id: 5,
		question: "What should you do if caught in a fire?",
		options: [
			{ id: 'A', text: 'Run as fast as possible' },
			{ id: 'B', text: 'Stay low and crawl' },
			{ id: 'C', text: 'Stand upright and walk' },
			{ id: 'D', text: 'Hide in the bathroom' },
			{ id: 'E', text: 'Jump from windows' }
		],
		correctAnswer: 'B',
		category: 'fire'
	},
	{
		id: 6,
		question: "How often should you test your smoke detectors?",
		options: [
			{ id: 'A', text: 'Every month' },
			{ id: 'B', text: 'Every 3 months' },
			{ id: 'C', text: 'Every 6 months' },
			{ id: 'D', text: 'Once a year' },
			{ id: 'E', text: 'Never, they test themselves' }
		],
		correctAnswer: 'A',
		category: 'fire'
	},
	{
		id: 7,
		question: "What is the universal emergency number in most countries?",
		options: [
			{ id: 'A', text: '911' },
			{ id: 'B', text: '112' },
			{ id: 'C', text: '999' },
			{ id: 'D', text: 'It varies by country' },
			{ id: 'E', text: '119' }
		],
		correctAnswer: 'D',
		category: 'communication'
	},
	{
		id: 8,
		question: "What should you include in a family emergency plan?",
		options: [
			{ id: 'A', text: 'Meeting points only' },
			{ id: 'B', text: 'Emergency contacts only' },
			{ id: 'C', text: 'Evacuation routes only' },
			{ id: 'D', text: 'All of the above' },
			{ id: 'E', text: 'Insurance information only' }
		],
		correctAnswer: 'D',
		category: 'preparedness'
	},
	{
		id: 9,
		question: "How should you turn off utilities during an emergency?",
		options: [
			{ id: 'A', text: 'Only if instructed by authorities' },
			{ id: 'B', text: 'Always turn off everything' },
			{ id: 'C', text: 'Never turn off utilities' },
			{ id: 'D', text: 'Only turn off electricity' },
			{ id: 'E', text: 'Only turn off water' }
		],
		correctAnswer: 'A',
		category: 'preparedness'
	},
	{
		id: 10,
		question: "What is the recommended way to stay informed during disasters?",
		options: [
			{ id: 'A', text: 'Social media only' },
			{ id: 'B', text: 'Battery/hand-crank radio' },
			{ id: 'C', text: 'Television only' },
			{ id: 'D', text: 'Word of mouth' },
			{ id: 'E', text: 'Internet only' }
		],
		correctAnswer: 'B',
		category: 'communication'
	}
]

export default function QuizOnboarding() {
	const [currentQuestion, setCurrentQuestion] = useState(0)
	const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
	const [loading, setLoading] = useState(false)

	const currentQ = QUIZ_QUESTIONS[currentQuestion]
	const isLastQuestion = currentQuestion === QUIZ_QUESTIONS.length - 1
	const hasSelectedAnswer = selectedAnswers[currentQ.id] !== undefined

	const selectAnswer = (optionId: string) => {
		setSelectedAnswers(prev => ({
			...prev,
			[currentQ.id]: optionId
		}))
	}

	const goToPreviousQuestion = () => {
		if (currentQuestion > 0) {
			setCurrentQuestion(currentQuestion - 1)
		}
	}

	const goToNextQuestion = () => {
		if (!hasSelectedAnswer) {
			Alert.alert('Please select an answer', 'You need to select an answer to continue.')
			return
		}

		if (isLastQuestion) {
			submitQuiz()
		} else {
			setCurrentQuestion(currentQuestion + 1)
		}
	}

	const calculateScore = () => {
		let correctAnswers = 0
		const categoryScores: Record<string, { correct: number; total: number }> = {}

		QUIZ_QUESTIONS.forEach(question => {
			const userAnswer = selectedAnswers[question.id]
			const isCorrect = userAnswer === question.correctAnswer

			if (isCorrect) correctAnswers++

			// category performance
			if (!categoryScores[question.category]) {
				categoryScores[question.category] = { correct: 0, total: 0 }
			}
			categoryScores[question.category].total++
			if (isCorrect) categoryScores[question.category].correct++
		})

		const overallScore = Math.round((correctAnswers / QUIZ_QUESTIONS.length) * 100)

		// knowledge level detemine
		let knowledgeLevel: string
		if (overallScore >= 71) knowledgeLevel = 'advanced'
		else if (overallScore >= 41) knowledgeLevel = 'intermediate'
		else knowledgeLevel = 'beginner'

		// identify weak areas (less than 50% in category)
		const weakAreas = Object.entries(categoryScores)
			.filter(([_, scores]) => (scores.correct / scores.total) < 0.5)
			.map(([category]) => category)

		// identify strong areas (80% or more in category)
		const strongAreas = Object.entries(categoryScores)
			.filter(([_, scores]) => (scores.correct / scores.total) >= 0.8)
			.map(([category]) => category)

		return {
			overallScore,
			knowledgeLevel,
			weakAreas,
			strongAreas,
			categoryScores
		}
	}

	const submitQuiz = async () => {
		try {
			setLoading(true)

			if (!auth.currentUser) {
				Alert.alert('Error', 'User not authenticated')
				return
			}

			const results = calculateScore()

			// Update user document with quiz results
			await updateDoc(doc(db, 'users', auth.currentUser.uid), {
				quizScore: results.overallScore,
				quizCompleted: true,
				quizCompletedAt: serverTimestamp(),
				knowledgeLevel: results.knowledgeLevel,
				weakAreas: results.weakAreas,
				strongAreas: results.strongAreas,
				quizAnswers: selectedAnswers
			})

			router.replace('/user/dashboard')

		} catch (error) {
			console.error('Error saving quiz results:', error)
			Alert.alert('Error', 'Failed to save quiz results. Please try again.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<KeyboardAvoidingView
			className="flex-1 bg-[#0b1220]"
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
		>
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
                        User Onboarding Quiz
                    </Text>
                    <View className="w-10" />
                </View>
            </View>

			<ScrollView
				className="flex-1"
				contentContainerClassName="flex-grow"
				showsVerticalScrollIndicator={false}
			>
				{/* Progress Indicators */}
				<View className="bg-white mx-5 mt-6 rounded-2xl p-6">
					<View className="flex-row justify-center items-center mb-8 flex-wrap">
						{QUIZ_QUESTIONS.map((_, index) => (
							<View key={index} className="mx-1 mb-2">
								<View
									className={`w-10 h-10 rounded-full items-center justify-center ${index < currentQuestion
											? 'bg-green-500'
											: index === currentQuestion
												? 'bg-slate-800'
												: 'bg-slate-300'
										}`}
								>
									<Text className={`font-bold ${index <= currentQuestion ? 'text-white' : 'text-slate-600'
										}`}>
										{index + 1}
									</Text>
								</View>
							</View>
						))}
					</View>

					{/* Question */}
					<Text className="text-slate-800 text-lg font-semibold mb-8 text-center">
						{currentQ.question}
					</Text>

					{/* Options */}
					<View className="gap-3 mb-8">
						{currentQ.options.map((option) => (
							<Pressable
								key={option.id}
								onPress={() => selectAnswer(option.id)}
								className={`flex-row items-center p-4 rounded-xl border-2 ${selectedAnswers[currentQ.id] === option.id
										? 'bg-slate-800 border-slate-800'
										: 'bg-slate-100 border-slate-200'
									}`}
							>
								<View
									className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${selectedAnswers[currentQ.id] === option.id
											? 'bg-white'
											: 'bg-slate-300'
										}`}
								>
									<Text className={`font-bold ${selectedAnswers[currentQ.id] === option.id
											? 'text-slate-800'
											: 'text-slate-600'
										}`}>
										{option.id}
									</Text>
								</View>
								<Text className={`flex-1 font-medium ${selectedAnswers[currentQ.id] === option.id
										? 'text-white'
										: 'text-slate-800'
									}`}>
									{option.text}
								</Text>
							</Pressable>
						))}
					</View>

					{/* Navigation Buttons */}
					<View className="flex-row justify-between items-center">
						<Pressable
							onPress={goToPreviousQuestion}
							disabled={currentQuestion === 0}
							className={`w-12 h-12 rounded-full items-center justify-center ${currentQuestion === 0 ? 'bg-slate-200' : 'bg-slate-800'
								}`}
						>
							<Text className={`text-xl ${currentQuestion === 0 ? 'text-slate-400' : 'text-white'
								}`}>
								←
							</Text>
						</Pressable>

						<Pressable
							onPress={goToNextQuestion}
							disabled={!hasSelectedAnswer || loading}
							className={`px-8 py-3 rounded-xl ${!hasSelectedAnswer || loading ? 'bg-slate-300' : 'bg-orange-500'
								}`}
						>
							{loading ? (
								<ActivityIndicator color="#fff" size="small" />
							) : (
								<Text className={`font-bold text-center ${!hasSelectedAnswer ? 'text-slate-500' : 'text-white'
									}`}>
									{isLastQuestion ? 'Submit Quiz' : 'Next'}
								</Text>
							)}
						</Pressable>

						<Pressable
							onPress={goToNextQuestion}
							disabled={!hasSelectedAnswer || loading}
							className={`w-12 h-12 rounded-full items-center justify-center ${!hasSelectedAnswer || loading ? 'bg-slate-200' : 'bg-slate-800'
								}`}
						>
							<Text className={`text-xl ${!hasSelectedAnswer || loading ? 'text-slate-400' : 'text-white'
								}`}>
								→
							</Text>
						</Pressable>
					</View>
				</View>

				{/* Progress */}
				<Text className="text-center text-slate-400 mt-4 mb-6">
					Question {currentQuestion + 1} of {QUIZ_QUESTIONS.length}
				</Text>
			</ScrollView>
			</SafeAreaView>
		</KeyboardAvoidingView>
	)
}