import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    updateDoc
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../config/firebase-config';

interface QuizQuestion {
  id: string;
  questionId: number;
  question: string;
  options: Array<{ id: string; text: string }>;
  correctAnswer: string;
  category: string;
  isRiskAssessment?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export default function QuizManagement() {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);

  // Form state
  const [questionId, setQuestionId] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [category, setCategory] = useState('common');
  const [correctAnswer, setCorrectAnswer] = useState('A');
  const [isRiskAssessment, setIsRiskAssessment] = useState(false);
  const [options, setOptions] = useState([
    { id: 'A', text: '' },
    { id: 'B', text: '' },
    { id: 'C', text: '' },
    { id: 'D', text: '' },
    { id: 'E', text: '' },
  ]);

  const categories = [
    { label: 'Common', value: 'common' },
    { label: 'Flood', value: 'flood' },
    { label: 'Earthquake', value: 'earthquake' },
    { label: 'Landslide', value: 'landslide' },
    { label: 'Storm', value: 'storm' },
  ];

  useEffect(() => {
    loadQuestions();
  }, []);

  const resetForm = () => {
    setQuestionId('');
    setQuestionText('');
    setCategory('common');
    setCorrectAnswer('A');
    setIsRiskAssessment(false);
    setOptions([
      { id: 'A', text: '' },
      { id: 'B', text: '' },
      { id: 'C', text: '' },
      { id: 'D', text: '' },
      { id: 'E', text: '' },
    ]);
    setShowAddForm(false);
    setEditingQuestion(null);
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const questionsQuery = query(
        collection(db, 'quiz_questions'),
        orderBy('questionId', 'asc')
      );
      const snapshot = await getDocs(questionsQuery);
      const questionsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as QuizQuestion[];
      setQuestions(questionsList);
    } catch (error) {
      console.error('Error loading questions:', error);
      Alert.alert('Error', 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!questionId.trim() || isNaN(Number(questionId))) {
      Alert.alert('Validation Error', 'Question ID must be a valid number');
      return false;
    }
    if (!questionText.trim()) {
      Alert.alert('Validation Error', 'Question text is required');
      return false;
    }
    
    // Check if at least 2 options are filled (for risk assessment with 4 options)
    const filledOptions = options.filter(opt => opt.text.trim().length > 0);
    if (filledOptions.length < 2) {
      Alert.alert('Validation Error', 'At least 2 options are required');
      return false;
    }

    return true;
  };

  const handleAddQuestion = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Filter out empty options
      const validOptions = options.filter(opt => opt.text.trim().length > 0);

      const questionData = {
        questionId: Number(questionId),
        question: questionText.trim(),
        options: validOptions,
        correctAnswer,
        category,
        isRiskAssessment: isRiskAssessment,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (editingQuestion) {
        // Update existing question
        await updateDoc(doc(db, 'quiz_questions', editingQuestion.id), {
          ...questionData,
          createdAt: editingQuestion.createdAt, // Keep original createdAt
        });
        Alert.alert('Success', 'Question updated successfully!');
      } else {
        // Add new question
        await addDoc(collection(db, 'quiz_questions'), questionData);
        Alert.alert('Success', 'Question added successfully!');
      }

      resetForm();
      loadQuestions();
    } catch (error) {
      console.error('Error saving question:', error);
      Alert.alert('Error', 'Failed to save question');
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuestion = (question: QuizQuestion) => {
    setEditingQuestion(question);
    setQuestionId(String(question.questionId));
    setQuestionText(question.question);
    setCategory(question.category);
    setCorrectAnswer(question.correctAnswer);
    setIsRiskAssessment(question.isRiskAssessment || false);
    
    // Fill options, padding with empty ones if needed
    const paddedOptions = [...question.options];
    while (paddedOptions.length < 5) {
      paddedOptions.push({ id: String.fromCharCode(65 + paddedOptions.length), text: '' });
    }
    setOptions(paddedOptions.slice(0, 5));
    
    setShowAddForm(true);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    Alert.alert(
      'Delete Question',
      'Are you sure you want to delete this question?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'quiz_questions', questionId));
              Alert.alert('Success', 'Question deleted successfully');
              loadQuestions();
            } catch (error) {
              console.error('Error deleting question:', error);
              Alert.alert('Error', 'Failed to delete question');
            }
          }
        }
      ]
    );
  };

  const updateOption = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index].text = text;
    setOptions(newOptions);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'common': return 'bg-blue-500';
      case 'flood': return 'bg-cyan-500';
      case 'earthquake': return 'bg-orange-500';
      case 'landslide': return 'bg-amber-500';
      case 'storm': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0b1220]">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView className="flex-1 p-5" keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View className="flex-row mb-6 justify-between items-center">
            <Text className="text-white text-2xl font-bold">Quiz Questions</Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={loadQuestions}
                className="bg-blue-500 px-4 py-2 rounded-lg"
                disabled={loading}
              >
                <Text className="text-white font-semibold">Refresh</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (showAddForm) {
                    resetForm();
                  } else {
                    setShowAddForm(true);
                  }
                }}
                className="bg-orange-500 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-semibold">
                  {showAddForm ? 'Cancel' : 'Add Question'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Add/Edit Question Form */}
          {showAddForm && (
            <View className="bg-white/10 rounded-xl p-4 mb-6">
              <Text className="text-white text-lg font-bold mb-4">
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </Text>

              {/* Question ID */}
              <TextInput
                className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white mb-3"
                placeholder="Question ID (e.g., 1, 2, 3...)"
                placeholderTextColor="#cbd5e1"
                value={questionId}
                onChangeText={setQuestionId}
                keyboardType="numeric"
              />

              {/* Question Text */}
              <TextInput
                className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white mb-3"
                placeholder="Question Text"
                placeholderTextColor="#cbd5e1"
                value={questionText}
                onChangeText={setQuestionText}
                multiline
                numberOfLines={3}
              />

              {/* Category Selection */}
              <View className="mb-3">
                <Text className="text-white mb-2">Category</Text>
                <View className="bg-white/10 border border-white/15 rounded-xl">
                  <Picker
                    selectedValue={category}
                    onValueChange={(value) => setCategory(value)}
                    style={{ color: 'white' }}
                    dropdownIconColor="white"
                  >
                    {categories.map((cat) => (
                      <Picker.Item key={cat.value} label={cat.label} value={cat.value} />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Risk Assessment Toggle */}
              <View className="mb-3">
                <Pressable
                  onPress={() => setIsRiskAssessment(!isRiskAssessment)}
                  className={`px-4 py-3 rounded-xl border flex-row items-center ${
                    isRiskAssessment
                      ? 'bg-orange-500 border-orange-500'
                      : 'bg-white/10 border-white/15'
                  }`}
                >
                  <Ionicons 
                    name={isRiskAssessment ? "checkbox" : "square-outline"} 
                    size={24} 
                    color="white" 
                  />
                  <Text className="text-white font-semibold ml-2">
                    Risk Assessment Question (First Question)
                  </Text>
                </Pressable>
              </View>

              {/* Options */}
              <Text className="text-white mb-2">Options</Text>
              {options.map((option, index) => (
                <View key={option.id} className="flex-row items-center mb-3">
                  <View className="bg-white/20 rounded-lg px-3 py-2 mr-2">
                    <Text className="text-white font-bold">{option.id}</Text>
                  </View>
                  <TextInput
                    className="flex-1 bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white"
                    placeholder={`Option ${option.id}`}
                    placeholderTextColor="#cbd5e1"
                    value={option.text}
                    onChangeText={(text) => updateOption(index, text)}
                  />
                </View>
              ))}

              {/* Correct Answer Selection */}
              <View className="mb-3">
                <Text className="text-white mb-2">Correct Answer</Text>
                <View className="bg-white/10 border border-white/15 rounded-xl">
                  <Picker
                    selectedValue={correctAnswer}
                    onValueChange={(value) => setCorrectAnswer(value)}
                    style={{ color: 'white' }}
                    dropdownIconColor="white"
                  >
                    {options
                      .filter(opt => opt.text.trim().length > 0)
                      .map((opt) => (
                        <Picker.Item key={opt.id} label={`Option ${opt.id}`} value={opt.id} />
                      ))}
                  </Picker>
                </View>
              </View>

              {/* Submit Button */}
              <Pressable
                onPress={handleAddQuestion}
                disabled={loading}
                className={`rounded-xl px-4 py-3 items-center ${
                  loading ? 'bg-orange-500/60' : 'bg-orange-500'
                }`}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-extrabold">
                    {editingQuestion ? 'Update Question' : 'Add Question'}
                  </Text>
                )}
              </Pressable>
            </View>
          )}

          {/* Questions List */}
          <View>
            <Text className="text-white text-lg font-bold mb-4">
              All Questions ({questions.length})
            </Text>

            {questions.length === 0 && !loading ? (
              <View className="bg-white/10 rounded-xl p-6 items-center">
                <Ionicons name="help-circle-outline" size={48} color="#cbd5e1" />
                <Text className="text-white text-center mt-2">
                  No questions yet. Click "Add Question" to create your first question.
                </Text>
              </View>
            ) : (
              questions.map((question) => (
                <View key={question.id} className="bg-white/10 rounded-xl p-4 mb-4">
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1 mr-3">
                      <View className="flex-row items-center mb-2">
                        <View className="bg-white/20 rounded-lg px-2 py-1 mr-2">
                          <Text className="text-white font-bold">Q{question.questionId}</Text>
                        </View>
                        <View className={`${getCategoryColor(question.category)} rounded-full px-3 py-1`}>
                          <Text className="text-white text-xs font-semibold uppercase">
                            {question.category}
                          </Text>
                        </View>
                        {question.isRiskAssessment && (
                          <View className="bg-orange-500 rounded-full px-3 py-1 ml-2">
                            <Text className="text-white text-xs font-semibold">RISK</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-white font-bold text-base mb-2">
                        {question.question}
                      </Text>
                      <View className="mt-2">
                        {question.options.map((opt) => (
                          <Text
                            key={opt.id}
                            className={`text-sm mb-1 ${
                              opt.id === question.correctAnswer
                                ? 'text-green-400 font-semibold'
                                : 'text-gray-400'
                            }`}
                          >
                            {opt.id}. {opt.text}
                            {opt.id === question.correctAnswer && ' ✓'}
                          </Text>
                        ))}
                      </View>
                    </View>
                  </View>

                  <View className="flex-row justify-end items-center mt-3 pt-3 border-t border-white/10 gap-2">
                    <Pressable
                      onPress={() => handleEditQuestion(question)}
                      className="bg-blue-500/20 px-3 py-2 rounded-lg flex-row items-center"
                    >
                      <Ionicons name="pencil" size={16} color="#60A5FA" />
                      <Text className="text-blue-400 text-sm font-semibold ml-1">Edit</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDeleteQuestion(question.id)}
                      className="bg-red-500/20 px-3 py-2 rounded-lg flex-row items-center"
                    >
                      <Ionicons name="trash" size={16} color="#EF4444" />
                      <Text className="text-red-400 text-sm font-semibold ml-1">Delete</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>

          {loading && questions.length === 0 && (
            <View className="items-center justify-center py-8">
              <ActivityIndicator size="large" color="#f97316" />
              <Text className="text-white mt-2">Loading questions...</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}