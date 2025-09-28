import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { useState } from 'react'
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native'
import { auth, db } from '../../config/firebase-config'

const QUIZ_QUESTIONS = [
	// Common Questions (3)
	{
		id: 1,
		question: "Which natural disaster poses the highest risk in your area? - static",
		options: [
			{ id: 'A', text: 'Floods' },
			{ id: 'B', text: 'Earthquakes' },
			{ id: 'C', text: 'Landslides' },
			{ id: 'D', text: 'Storms' }
		],
		correctAnswer: 'A', // This is just a placeholder - all answers are considered "correct"
		category: 'common',
		isRiskAssessment: true // Special flag to identify this question
	},
	{
		id: 2,
		question: "How long should an emergency kit sustain your family?",
		options: [
			{ id: 'A', text: '24 hours' },
			{ id: 'B', text: '48 hours' },
			{ id: 'C', text: '72 hours (3 days)' },
			{ id: 'D', text: '1 week' },
			{ id: 'E', text: '2 weeks' }
		],
		correctAnswer: 'C',
		category: 'common'
	},
	{
		id: 3,
		question: "What should you include in a family emergency plan?",
		options: [
			{ id: 'A', text: 'Meeting points only' },
			{ id: 'B', text: 'Emergency contacts only' },
			{ id: 'C', text: 'Evacuation routes only' },
			{ id: 'D', text: 'All of the above' },
			{ id: 'E', text: 'Insurance information only' }
		],
		correctAnswer: 'D',
		category: 'common'
	},

	// Flood Questions (3)
	{
		id: 4,
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
		id: 5,
		question: "What should you do if you encounter flood water while driving?",
		options: [
			{ id: 'A', text: 'Drive through it quickly' },
			{ id: 'B', text: 'Turn around and find another route' },
			{ id: 'C', text: 'Test the depth with your car' },
			{ id: 'D', text: 'Drive slowly through it' },
			{ id: 'E', text: 'Wait in the car for help' }
		],
		correctAnswer: 'B',
		category: 'flood'
	},
	{
		id: 6,
		question: "How much moving water can knock you off your feet?",
		options: [
			{ id: 'A', text: '1 inch (2.5 cm)' },
			{ id: 'B', text: '6 inches (15 cm)' },
			{ id: 'C', text: '12 inches (30 cm)' },
			{ id: 'D', text: '18 inches (45 cm)' },
			{ id: 'E', text: '24 inches (60 cm)' }
		],
		correctAnswer: 'B',
		category: 'flood'
	},

	// Earthquake Questions (3)
	{
		id: 7,
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
		id: 8,
		question: "After an earthquake, what should you do first?",
		options: [
			{ id: 'A', text: 'Check for injuries and hazards' },
			{ id: 'B', text: 'Post on social media' },
			{ id: 'C', text: 'Go back inside immediately' },
			{ id: 'D', text: 'Drive away from the area' },
			{ id: 'E', text: 'Take photos of damage' }
		],
		correctAnswer: 'A',
		category: 'earthquake'
	},
	{
		id: 9,
		question: "What is the 'Triangle of Life' theory in earthquake safety?",
		options: [
			{ id: 'A', text: 'A validated safety technique' },
			{ id: 'B', text: 'A debunked myth - do not use it' },
			{ id: 'C', text: 'Only for commercial buildings' },
			{ id: 'D', text: 'Only for residential homes' },
			{ id: 'E', text: 'A technique for aftershocks only' }
		],
		correctAnswer: 'B',
		category: 'earthquake'
	},

	// Landslide Questions (3)
	{
		id: 10,
		question: "What is the main trigger for landslides in Sri Lanka?",
		options: [
			{ id: 'A', text: 'Earthquakes' },
			{ id: 'B', text: 'Heavy rainfall' },
			{ id: 'C', text: 'Wind storms' },
			{ id: 'D', text: 'Ocean waves' },
			{ id: 'E', text: 'Temperature changes' }
		],
		correctAnswer: 'B',
		category: 'landslide'
	},
	{
		id: 11,
		question: "What warning sign indicates a potential landslide?",
		options: [
			{ id: 'A', text: 'Cloudy weather' },
			{ id: 'B', text: 'Cracks in the ground or pavement' },
			{ id: 'C', text: 'Strong winds' },
			{ id: 'D', text: 'Birds flying away' },
			{ id: 'E', text: 'Temperature drop' }
		],
		correctAnswer: 'B',
		category: 'landslide'
	},
	{
		id: 12,
		question: "If you're caught in a landslide while driving, what should you do?",
		options: [
			{ id: 'A', text: 'Stay in the vehicle' },
			{ id: 'B', text: 'Abandon vehicle and move uphill' },
			{ id: 'C', text: 'Drive faster through it' },
			{ id: 'D', text: 'Call emergency services and wait' },
			{ id: 'E', text: 'Move to lower ground' }
		],
		correctAnswer: 'B',
		category: 'landslide'
	},

	// Storm Questions (3)
	{
		id: 13,
		question: "What wind speed defines a tropical cyclone?",
		options: [
			{ id: 'A', text: 'Above 50 km/h' },
			{ id: 'B', text: 'Above 63 km/h' },
			{ id: 'C', text: 'Above 88 km/h' },
			{ id: 'D', text: 'Above 118 km/h' },
			{ id: 'E', text: 'Above 150 km/h' }
		],
		correctAnswer: 'D',
		category: 'storm'
	},
	{
		id: 14,
		question: "During a thunderstorm, where is the safest place indoors?",
		options: [
			{ id: 'A', text: 'Near windows to watch the storm' },
			{ id: 'B', text: 'In the bathroom away from plumbing' },
			{ id: 'C', text: 'In an interior room away from windows' },
			{ id: 'D', text: 'In the garage' },
			{ id: 'E', text: 'Near electronic devices' }
		],
		correctAnswer: 'C',
		category: 'storm'
	},
	{
		id: 15,
		question: "What is the '30-30 rule' for lightning safety?",
		options: [
			{ id: 'A', text: 'Stay indoors for 30 minutes after the storm' },
			{ id: 'B', text: 'Seek shelter when thunder is 30 seconds after lightning, wait 30 min after last thunder' },
			{ id: 'C', text: 'Lightning strikes within 30 miles' },
			{ id: 'D', text: 'Storm lasts 30 minutes' },
			{ id: 'E', text: 'Stay 30 feet from trees' }
		],
		correctAnswer: 'B',
		category: 'storm'
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
		let userRiskArea: string | null = null

		QUIZ_QUESTIONS.forEach(question => {
			const userAnswer = selectedAnswers[question.id]

			// Special handling for risk assessment question
			if (question.isRiskAssessment && userAnswer) {
				// Map user's answer to the corresponding category
				const riskMapping: Record<string, string> = {
					'A': 'flood',      // Floods
					'B': 'earthquake',  // Earthquakes
					'C': 'landslide',   // Landslides
					'D': 'storm'        // Storms
				}
				userRiskArea = riskMapping[userAnswer]
				// Mark as correct (since it's a personal assessment, not a right/wrong answer)
				correctAnswers++
			} else {
				// Regular question scoring
				const isCorrect = userAnswer === question.correctAnswer
				if (isCorrect) correctAnswers++
			}

			// Track category performance (excluding the risk assessment question)
			if (!question.isRiskAssessment) {
				if (!categoryScores[question.category]) {
					categoryScores[question.category] = { correct: 0, total: 0 }
				}
				categoryScores[question.category].total++
				if (userAnswer === question.correctAnswer) {
					categoryScores[question.category].correct++
				}
			}
		})

		const overallScore = Math.round((correctAnswers / QUIZ_QUESTIONS.length) * 100)

		// Determine knowledge level based on 15 questions
		let knowledgeLevel: string
		if (overallScore >= 80) knowledgeLevel = 'advanced'      // 12+ correct (80%)
		else if (overallScore >= 60) knowledgeLevel = 'intermediate'  // 9-11 correct (60-79%)
		else knowledgeLevel = 'beginner'                          // 0-8 correct (<60%)

		// Identify weak areas (less than 67% in category - i.e., 0-1 correct out of 3)
		const weakAreas = Object.entries(categoryScores)
			.filter(([_, scores]) => (scores.correct / scores.total) < 0.67)
			.map(([category]) => category)

		// IMPORTANT: Add user's identified risk area to weak areas if not already there
		if (userRiskArea && !weakAreas.includes(userRiskArea)) {
			weakAreas.push(userRiskArea)
		}

		// Identify strong areas (100% in category - all 3 correct)
		const strongAreas = Object.entries(categoryScores)
			.filter(([_, scores]) => (scores.correct / scores.total) === 1.0)
			.map(([category]) => category)

		// Remove user's risk area from strong areas (they need to focus on their local threat)
		const filteredStrongAreas = strongAreas.filter(area => area !== userRiskArea)

		// Get detailed category breakdown for user feedback
		const categoryBreakdown: Record<string, number> = {}
		Object.entries(categoryScores).forEach(([category, scores]) => {
			categoryBreakdown[category] = Math.round((scores.correct / scores.total) * 100)
		})

		return {
			overallScore,
			knowledgeLevel,
			weakAreas,
			strongAreas: filteredStrongAreas,
			categoryScores,
			categoryBreakdown,
			totalCorrect: correctAnswers,
			totalQuestions: QUIZ_QUESTIONS.length,
			userRiskArea // Include this for reference
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
				categoryBreakdown: results.categoryBreakdown,
				quizAnswers: selectedAnswers,
				totalCorrect: results.totalCorrect,
				totalQuestions: results.totalQuestions,
				userRiskArea: results.userRiskArea // Store user's identified risk area
			})

			// Show results to user
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

			const riskAreaText = results.userRiskArea
				? `\n\nYour Primary Risk Area: ${formatCategoryName(results.userRiskArea)}\nContent will be personalized based on this risk.`
				: ''

			const strongAreasFormatted = results.strongAreas.map(formatCategoryName).join(', ')
			const weakAreasFormatted = results.weakAreas.map(formatCategoryName).join(', ')

			const resultMessage = `
				QUIZ RESULTS

				Score: ${results.overallScore}% (${results.totalCorrect} out of ${results.totalQuestions} correct)
				Knowledge Level: ${results.knowledgeLevel.toUpperCase()}
				${riskAreaText}

				${results.strongAreas.length > 0 ? `\nStrong Knowledge Areas:\n${strongAreasFormatted}` : ''}
				${results.weakAreas.length > 0 ? `\n\nRecommended Focus Areas:\n${weakAreasFormatted}\n\nWe recommend reviewing materials on these topics to improve your disaster preparedness.` : ''}
			`.trim()

			Alert.alert('Assessment Complete', resultMessage, [
				{ text: 'Continue to Dashboard', onPress: () => router.replace('/user/dashboard') }
			])

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
										<Text className={`font-bold ${index <= currentQuestion ? 'text-white' : 'text-slate-600'}`}>
											{index + 1}
										</Text>
									</View>
								</View>
							))}
						</View>

						{/* Category Badge */}
						<View className="items-center mb-4">
							<View className={`px-4 py-2 rounded-full ${currentQ.category === 'common' ? 'bg-blue-100' :
									currentQ.category === 'flood' ? 'bg-cyan-100' :
										currentQ.category === 'earthquake' ? 'bg-orange-100' :
											currentQ.category === 'landslide' ? 'bg-amber-100' :
												'bg-purple-100'
								}`}>
								<Text className={`text-sm font-semibold ${currentQ.category === 'common' ? 'text-blue-700' :
										currentQ.category === 'flood' ? 'text-cyan-700' :
											currentQ.category === 'earthquake' ? 'text-orange-700' :
												currentQ.category === 'landslide' ? 'text-amber-700' :
													'text-purple-700'
									}`}>
									{currentQ.category.toUpperCase()}
								</Text>
							</View>
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
								<Text className={`text-xl ${currentQuestion === 0 ? 'text-slate-400' : 'text-white'}`}>
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
								<Text className={`text-xl ${!hasSelectedAnswer || loading ? 'text-slate-400' : 'text-white'}`}>
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