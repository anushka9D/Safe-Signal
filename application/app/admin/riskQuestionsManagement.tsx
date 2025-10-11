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

interface RiskMapping {
  flood: number;
  earthquake: number;
  storm: number;
  landslide: number;
}

interface RiskQuestion {
  id: string;
  questionId: number;
  question: string;
  options: string[];
  category: string;
  riskMapping: Record<string, RiskMapping>;
  createdAt?: any;
  updatedAt?: any;
}

export default function RiskQuestionsManagement() {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<RiskQuestion[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<RiskQuestion | null>(null);

  // Form state
  const [questionId, setQuestionId] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [category, setCategory] = useState('location');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [riskMappings, setRiskMappings] = useState<Record<string, RiskMapping>>({});

  const categories = [
    { label: 'Location', value: 'location' },
    { label: 'Structure', value: 'structure' },
    { label: 'Roof', value: 'roof' },
    { label: 'Flood', value: 'flood' },
    { label: 'Utilities', value: 'utilities' },
    { label: 'General', value: 'general' },
    { label: 'Landslide', value: 'landslide' },
    { label: 'Windows', value: 'windows' },
  ];

  useEffect(() => {
    loadQuestions();
  }, []);

  const resetForm = () => {
    setQuestionId('');
    setQuestionText('');
    setCategory('location');
    setOptions(['', '', '', '']);
    setRiskMappings({});
    setShowAddForm(false);
    setEditingQuestion(null);
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const questionsQuery = query(
        collection(db, 'risk_assessment_questions'),
        orderBy('questionId', 'asc')
      );
      const snapshot = await getDocs(questionsQuery);
      const questionsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RiskQuestion[];
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
    
    const filledOptions = options.filter(opt => opt.trim().length > 0);
    if (filledOptions.length < 2) {
      Alert.alert('Validation Error', 'At least 2 options are required');
      return false;
    }

    // Validate risk mappings for filled options
    for (const option of filledOptions) {
      if (!riskMappings[option]) {
        Alert.alert('Validation Error', `Risk mapping missing for option: ${option}`);
        return false;
      }
    }

    return true;
  };

  const handleAddQuestion = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const validOptions = options.filter(opt => opt.trim().length > 0);
      const validRiskMappings: Record<string, RiskMapping> = {};
      
      validOptions.forEach(opt => {
        if (riskMappings[opt]) {
          validRiskMappings[opt] = riskMappings[opt];
        }
      });

      const questionData = {
        questionId: Number(questionId),
        question: questionText.trim(),
        options: validOptions,
        category,
        riskMapping: validRiskMappings,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (editingQuestion) {
        await updateDoc(doc(db, 'risk_assessment_questions', editingQuestion.id), {
          ...questionData,
          createdAt: editingQuestion.createdAt,
        });
        Alert.alert('Success', 'Question updated successfully!');
      } else {
        await addDoc(collection(db, 'risk_assessment_questions'), questionData);
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

  const handleEditQuestion = (question: RiskQuestion) => {
    setEditingQuestion(question);
    setQuestionId(String(question.questionId));
    setQuestionText(question.question);
    setCategory(question.category);
    
    const paddedOptions = [...question.options];
    while (paddedOptions.length < 4) {
      paddedOptions.push('');
    }
    setOptions(paddedOptions.slice(0, 4));
    setRiskMappings(question.riskMapping);
    
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
              await deleteDoc(doc(db, 'risk_assessment_questions', questionId));
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
    const oldOption = newOptions[index];
    newOptions[index] = text;
    setOptions(newOptions);

    // Update risk mapping key
    if (oldOption && riskMappings[oldOption]) {
      const newMappings = { ...riskMappings };
      delete newMappings[oldOption];
      if (text.trim()) {
        newMappings[text] = riskMappings[oldOption];
      }
      setRiskMappings(newMappings);
    }
  };

  const updateRiskMapping = (option: string, disaster: keyof RiskMapping, value: string) => {
    const newMappings = { ...riskMappings };
    if (!newMappings[option]) {
      newMappings[option] = { flood: 0, earthquake: 0, storm: 0, landslide: 0 };
    }
    newMappings[option][disaster] = Number(value) || 0;
    setRiskMappings(newMappings);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'location': return 'bg-blue-500';
      case 'structure': return 'bg-green-500';
      case 'roof': return 'bg-orange-500';
      case 'flood': return 'bg-cyan-500';
      case 'utilities': return 'bg-yellow-500';
      case 'general': return 'bg-gray-500';
      case 'landslide': return 'bg-amber-500';
      case 'windows': return 'bg-purple-500';
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
          <View className="flex-row mb-6 justify-end">
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

          {showAddForm && (
            <View className="bg-white/10 rounded-xl p-4 mb-6">
              <Text className="text-white text-lg font-bold mb-4">
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </Text>

              <TextInput
                className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white mb-3"
                placeholder="Question ID (e.g., 1, 2, 3...)"
                placeholderTextColor="#cbd5e1"
                value={questionId}
                onChangeText={setQuestionId}
                keyboardType="numeric"
              />

              <TextInput
                className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white mb-3"
                placeholder="Question Text"
                placeholderTextColor="#cbd5e1"
                value={questionText}
                onChangeText={setQuestionText}
                multiline
                numberOfLines={3}
              />

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

              <Text className="text-white mb-2 font-semibold">Options & Risk Mapping</Text>
              {options.map((option, index) => (
                <View key={index} className="mb-4 bg-white/5 rounded-xl p-3">
                  <TextInput
                    className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white mb-2"
                    placeholder={`Option ${index + 1}`}
                    placeholderTextColor="#cbd5e1"
                    value={option}
                    onChangeText={(text) => updateOption(index, text)}
                  />
                  
                  {option.trim() && (
                    <View className="mt-2">
                      <Text className="text-gray-400 text-xs mb-2">Risk Values (0-3)</Text>
                      <View className="flex-row flex-wrap gap-2">
                        {(['flood', 'earthquake', 'storm', 'landslide'] as const).map((disaster) => (
                          <View key={disaster} className="flex-1 min-w-[45%]">
                            <Text className="text-gray-300 text-xs mb-1 capitalize">{disaster}</Text>
                            <TextInput
                              className="bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-white"
                              placeholder="0-3"
                              placeholderTextColor="#cbd5e1"
                              value={String(riskMappings[option]?.[disaster] ?? '')}
                              onChangeText={(val) => updateRiskMapping(option, disaster, val)}
                              keyboardType="numeric"
                            />
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              ))}

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
                  <View className="flex-row items-center mb-2">
                    <View className="bg-white/20 rounded-lg px-2 py-1 mr-2">
                      <Text className="text-white font-bold">Q{question.questionId}</Text>
                    </View>
                    <View className={`${getCategoryColor(question.category)} rounded-full px-3 py-1`}>
                      <Text className="text-white text-xs font-semibold uppercase">
                        {question.category}
                      </Text>
                    </View>
                  </View>
                  
                  <Text className="text-white font-bold text-base mb-3">
                    {question.question}
                  </Text>
                  
                  <View className="mt-2">
                    {question.options.map((opt, idx) => (
                      <View key={idx} className="mb-2">
                        <Text className="text-gray-300 text-sm mb-1">• {opt}</Text>
                        <View className="flex-row ml-4 gap-2">
                          <Text className="text-cyan-400 text-xs">F:{question.riskMapping[opt]?.flood ?? 0}</Text>
                          <Text className="text-orange-400 text-xs">E:{question.riskMapping[opt]?.earthquake ?? 0}</Text>
                          <Text className="text-purple-400 text-xs">S:{question.riskMapping[opt]?.storm ?? 0}</Text>
                          <Text className="text-amber-400 text-xs">L:{question.riskMapping[opt]?.landslide ?? 0}</Text>
                        </View>
                      </View>
                    ))}
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