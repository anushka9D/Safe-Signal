import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native'
import { auth, db } from '../../config/firebase-config'

interface QuizOption {
	id: string;
	text: string;
}

interface QuizQuestion {
	id: string;
	questionId: number;
	question: string;
	options: QuizOption[];
	correctAnswer: string;
	category: string;
	isRiskAssessment?: boolean;
}

export default function QuizOnboarding() {
	const [currentQuestion, setCurrentQuestion] = useState(0)
	const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
	const [loading, setLoading] = useState(false)
	const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
	const [loadingQuestions, setLoadingQuestions] = useState(true)

	useEffect(() => {
		loadQuizQuestions()
	}, [])

	const loadQuizQuestions = async () => {
		try {
			setLoadingQuestions(true)
			console.log('Loading quiz questions from Firebase...')

			const questionsQuery = query(
				collection(db, 'quiz_questions'),
				orderBy('questionId', 'asc')
			)
			const snapshot = await getDocs(questionsQuery)

			const questions: QuizQuestion[] = []
			snapshot.forEach((doc) => {
				const data = doc.data()
				questions.push({
					id: doc.id,
					questionId: data.questionId,
					question: data.question,
					options: data.options || [],
					correctAnswer: data.correctAnswer,
					category: data.category,
					isRiskAssessment: data.isRiskAssessment || false
				})
			})

			if (questions.length === 0) {
				Alert.alert(
					'No Questions Available',
					'No quiz questions found in the database. Please contact the administrator.',
					[{ text: 'OK', onPress: () => router.back() }]
				)
				return
			}

			setQuizQuestions(questions)
			console.log(`Loaded ${questions.length} quiz questions`)
		} catch (error) {
			console.error('Error loading quiz questions:', error)
			Alert.alert(
				'Error',
				'Failed to load quiz questions. Please try again later.',
				[{ text: 'OK', onPress: () => router.back() }]
			)
		} finally {
			setLoadingQuestions(false)
		}
	}

	const currentQ = quizQuestions[currentQuestion]
	const isLastQuestion = currentQuestion === quizQuestions.length - 1
	const hasSelectedAnswer = currentQ && selectedAnswers[currentQ.questionId] !== undefined

	const selectAnswer = (optionId: string) => {
		if (!currentQ) return
		setSelectedAnswers(prev => ({
			...prev,
			[currentQ.questionId]: optionId
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

		quizQuestions.forEach(question => {
			const userAnswer = selectedAnswers[question.questionId]

			// Special handling for risk assessment question
			if (question.isRiskAssessment && userAnswer) {
				// Map user's answer to the corresponding category
				const riskMapping: Record<string, string> = {
					'A': 'flood',
					'B': 'earthquake',
					'C': 'landslide',
					'D': 'storm'
				}
				userRiskArea = riskMapping[userAnswer]
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

		const overallScore = Math.round((correctAnswers / quizQuestions.length) * 100)

		// Determine knowledge level based on percentage
		let knowledgeLevel: string
		if (overallScore >= 80) knowledgeLevel = 'advanced'
		else if (overallScore >= 60) knowledgeLevel = 'intermediate'
		else knowledgeLevel = 'beginner'

		// Identify weak areas (less than 67% in category)
		const weakAreas = Object.entries(categoryScores)
			.filter(([_, scores]) => (scores.correct / scores.total) < 0.67)
			.map(([category]) => category)

		// Add user's identified risk area to weak areas if not already there
		if (userRiskArea && !weakAreas.includes(userRiskArea)) {
			weakAreas.push(userRiskArea)
		}

		// Identify strong areas (100% in category)
		const strongAreas = Object.entries(categoryScores)
			.filter(([_, scores]) => (scores.correct / scores.total) === 1.0)
			.map(([category]) => category)

		// Remove user's risk area from strong areas
		const filteredStrongAreas = strongAreas.filter(area => area !== userRiskArea)

		// Get detailed category breakdown
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
			totalQuestions: quizQuestions.length,
			userRiskArea
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
				userRiskArea: results.userRiskArea
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

	const getCategoryColor = (category: string) => {
		switch (category) {
			case 'common': return 'bg-blue-100';
			case 'flood': return 'bg-cyan-100';
			case 'earthquake': return 'bg-orange-100';
			case 'landslide': return 'bg-amber-100';
			case 'storm': return 'bg-purple-100';
			default: return 'bg-gray-100';
		}
	}

	const getCategoryTextColor = (category: string) => {
		switch (category) {
			case 'common': return 'text-blue-700';
			case 'flood': return 'text-cyan-700';
			case 'earthquake': return 'text-orange-700';
			case 'landslide': return 'text-amber-700';
			case 'storm': return 'text-purple-700';
			default: return 'text-gray-700';
		}
	}

	// Loading state while fetching questions
	if (loadingQuestions) {
		return (
			<SafeAreaView className="flex-1 bg-[#0b1220]">
				<StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
				<View className="flex-1 justify-center items-center">
					<ActivityIndicator size="large" color="#f97316" />
					<Text className="text-white text-lg mt-4">Loading Quiz Questions...</Text>
				</View>
			</SafeAreaView>
		)
	}

	// No questions available
	if (quizQuestions.length === 0) {
		return (
			<SafeAreaView className="flex-1 bg-[#0b1220]">
				<StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
				<View className="flex-1 justify-center items-center p-6">
					<Ionicons name="alert-circle-outline" size={64} color="#f97316" />
					<Text className="text-white text-xl font-bold mt-4 text-center">
						No Questions Available
					</Text>
					<Text className="text-slate-400 text-center mt-2">
						Please contact the administrator to add quiz questions.
					</Text>
					<Pressable
						onPress={() => router.back()}
						className="bg-orange-500 rounded-xl px-6 py-3 mt-6"
					>
						<Text className="text-white font-bold">Go Back</Text>
					</Pressable>
				</View>
			</SafeAreaView>
		)
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
							{quizQuestions.map((_, index) => (
								<View key={index} className="mx-1 mb-2">
									<View
										className={`w-10 h-10 rounded-full items-center justify-center ${
											index < currentQuestion
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
							<View className={`px-4 py-2 rounded-full ${getCategoryColor(currentQ.category)}`}>
								<Text className={`text-sm font-semibold ${getCategoryTextColor(currentQ.category)}`}>
									{currentQ.category.toUpperCase()}
									{currentQ.isRiskAssessment && ' - RISK ASSESSMENT'}
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
									className={`flex-row items-center p-4 rounded-xl border-2 ${
										selectedAnswers[currentQ.questionId] === option.id
											? 'bg-slate-800 border-slate-800'
											: 'bg-slate-100 border-slate-200'
									}`}
								>
									<View
										className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
											selectedAnswers[currentQ.questionId] === option.id
												? 'bg-white'
												: 'bg-slate-300'
										}`}
									>
										<Text className={`font-bold ${
											selectedAnswers[currentQ.questionId] === option.id
												? 'text-slate-800'
												: 'text-slate-600'
										}`}>
											{option.id}
										</Text>
									</View>
									<Text className={`flex-1 font-medium ${
										selectedAnswers[currentQ.questionId] === option.id
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
								className={`w-12 h-12 rounded-full items-center justify-center ${
									currentQuestion === 0 ? 'bg-slate-200' : 'bg-slate-800'
								}`}
							>
								<Text className={`text-xl ${currentQuestion === 0 ? 'text-slate-400' : 'text-white'}`}>
									←
								</Text>
							</Pressable>

							<Pressable
								onPress={goToNextQuestion}
								disabled={!hasSelectedAnswer || loading}
								className={`px-8 py-3 rounded-xl ${
									!hasSelectedAnswer || loading ? 'bg-slate-300' : 'bg-orange-500'
								}`}
							>
								{loading ? (
									<ActivityIndicator color="#fff" size="small" />
								) : (
									<Text className={`font-bold text-center ${
										!hasSelectedAnswer ? 'text-slate-500' : 'text-white'
									}`}>
										{isLastQuestion ? 'Submit Quiz' : 'Next'}
									</Text>
								)}
							</Pressable>

							<Pressable
								onPress={goToNextQuestion}
								disabled={!hasSelectedAnswer || loading}
								className={`w-12 h-12 rounded-full items-center justify-center ${
									!hasSelectedAnswer || loading ? 'bg-slate-200' : 'bg-slate-800'
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
						Question {currentQuestion + 1} of {quizQuestions.length}
					</Text>
				</ScrollView>
			</SafeAreaView>
		</KeyboardAvoidingView>
	)
}