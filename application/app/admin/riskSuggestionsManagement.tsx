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

interface Suggestion {
  id: string;
  disasterType: string;
  scoreRange: string; // 'low', 'moderate', 'good'
  suggestions: string[];
  createdAt?: any;
  updatedAt?: any;
}

export default function RiskSuggestionsManagement() {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSuggestion, setEditingSuggestion] = useState<Suggestion | null>(null);

  // Form state
  const [disasterType, setDisasterType] = useState('flood');
  const [scoreRange, setScoreRange] = useState('low');
  const [suggestionItems, setSuggestionItems] = useState<string[]>(['', '', '']);

  const disasterTypes = [
    { label: 'Flood', value: 'flood' },
    { label: 'Earthquake', value: 'earthquake' },
    { label: 'Storm', value: 'storm' },
    { label: 'Landslide', value: 'landslide' },
  ];

  const scoreRanges = [
    { label: 'Low (Score < 70)', value: 'low' },
    { label: 'Moderate (Score 70-84)', value: 'moderate' },
    { label: 'Good (Score ≥ 85)', value: 'good' },
  ];

  useEffect(() => {
    loadSuggestions();
  }, []);

  const resetForm = () => {
    setDisasterType('flood');
    setScoreRange('low');
    setSuggestionItems(['', '', '']);
    setShowAddForm(false);
    setEditingSuggestion(null);
  };

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const suggestionsQuery = query(
        collection(db, 'risk_suggestions'),
        orderBy('disasterType', 'asc')
      );
      const snapshot = await getDocs(suggestionsQuery);
      const suggestionsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Suggestion[];
      setSuggestions(suggestionsList);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      Alert.alert('Error', 'Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const validSuggestions = suggestionItems.filter(s => s.trim().length > 0);
    if (validSuggestions.length === 0) {
      Alert.alert('Validation Error', 'At least one suggestion is required');
      return false;
    }
    return true;
  };

  const handleAddSuggestion = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const validSuggestions = suggestionItems.filter(s => s.trim().length > 0);

      const suggestionData = {
        disasterType,
        scoreRange,
        suggestions: validSuggestions,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (editingSuggestion) {
        await updateDoc(doc(db, 'risk_suggestions', editingSuggestion.id), {
          ...suggestionData,
          createdAt: editingSuggestion.createdAt,
        });
        Alert.alert('Success', 'Suggestions updated successfully!');
      } else {
        await addDoc(collection(db, 'risk_suggestions'), suggestionData);
        Alert.alert('Success', 'Suggestions added successfully!');
      }

      resetForm();
      loadSuggestions();
    } catch (error) {
      console.error('Error saving suggestions:', error);
      Alert.alert('Error', 'Failed to save suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSuggestion = (suggestion: Suggestion) => {
    setEditingSuggestion(suggestion);
    setDisasterType(suggestion.disasterType);
    setScoreRange(suggestion.scoreRange);
    
    const paddedSuggestions = [...suggestion.suggestions];
    while (paddedSuggestions.length < 3) {
      paddedSuggestions.push('');
    }
    setSuggestionItems(paddedSuggestions);
    
    setShowAddForm(true);
  };

  const handleDeleteSuggestion = async (suggestionId: string) => {
    Alert.alert(
      'Delete Suggestion Set',
      'Are you sure you want to delete this suggestion set?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'risk_suggestions', suggestionId));
              Alert.alert('Success', 'Suggestion set deleted successfully');
              loadSuggestions();
            } catch (error) {
              console.error('Error deleting suggestions:', error);
              Alert.alert('Error', 'Failed to delete suggestions');
            }
          }
        }
      ]
    );
  };

  const updateSuggestionItem = (index: number, text: string) => {
    const newItems = [...suggestionItems];
    newItems[index] = text;
    setSuggestionItems(newItems);
  };

  const addMoreSuggestion = () => {
    setSuggestionItems([...suggestionItems, '']);
  };

  const removeSuggestion = (index: number) => {
    const newItems = suggestionItems.filter((_, i) => i !== index);
    setSuggestionItems(newItems);
  };

  const getDisasterColor = (disaster: string) => {
    switch (disaster) {
      case 'flood': return 'bg-cyan-500';
      case 'earthquake': return 'bg-orange-500';
      case 'storm': return 'bg-purple-500';
      case 'landslide': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  const getScoreRangeColor = (range: string) => {
    switch (range) {
      case 'low': return 'bg-red-500';
      case 'moderate': return 'bg-yellow-500';
      case 'good': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getScoreRangeLabel = (range: string) => {
    switch (range) {
      case 'low': return '< 70%';
      case 'moderate': return '70-84%';
      case 'good': return '≥ 85%';
      default: return range;
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
                onPress={loadSuggestions}
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
                  {showAddForm ? 'Cancel' : 'Add Suggestions'}
                </Text>
              </Pressable>
            </View>
          </View>

          {showAddForm && (
            <View className="bg-white/10 rounded-xl p-4 mb-6">
              <Text className="text-white text-lg font-bold mb-4">
                {editingSuggestion ? 'Edit Suggestions' : 'Add New Suggestions'}
              </Text>

              <View className="mb-3">
                <Text className="text-white mb-2">Disaster Type</Text>
                <View className="bg-white/10 border border-white/15 rounded-xl">
                  <Picker
                    selectedValue={disasterType}
                    onValueChange={(value) => setDisasterType(value)}
                    style={{ color: 'white' }}
                    dropdownIconColor="white"
                  >
                    {disasterTypes.map((type) => (
                      <Picker.Item key={type.value} label={type.label} value={type.value} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View className="mb-3">
                <Text className="text-white mb-2">Score Range</Text>
                <View className="bg-white/10 border border-white/15 rounded-xl">
                  <Picker
                    selectedValue={scoreRange}
                    onValueChange={(value) => setScoreRange(value)}
                    style={{ color: 'white' }}
                    dropdownIconColor="white"
                  >
                    {scoreRanges.map((range) => (
                      <Picker.Item key={range.value} label={range.label} value={range.value} />
                    ))}
                  </Picker>
                </View>
              </View>

              <Text className="text-white mb-2 font-semibold">Suggestions</Text>
              {suggestionItems.map((item, index) => (
                <View key={index} className="flex-row items-center mb-3">
                  <TextInput
                    className="flex-1 bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white mr-2"
                    placeholder={`Suggestion ${index + 1}`}
                    placeholderTextColor="#cbd5e1"
                    value={item}
                    onChangeText={(text) => updateSuggestionItem(index, text)}
                    multiline
                  />
                  {suggestionItems.length > 1 && (
                    <Pressable
                      onPress={() => removeSuggestion(index)}
                      className="bg-red-500/20 p-2 rounded-lg"
                    >
                      <Ionicons name="trash" size={20} color="#EF4444" />
                    </Pressable>
                  )}
                </View>
              ))}

              <Pressable
                onPress={addMoreSuggestion}
                className="bg-blue-500/20 px-4 py-2 rounded-lg flex-row items-center justify-center mb-4"
              >
                <Ionicons name="add-circle" size={20} color="#60A5FA" />
                <Text className="text-blue-400 font-semibold ml-2">Add More Suggestion</Text>
              </Pressable>

              <Pressable
                onPress={handleAddSuggestion}
                disabled={loading}
                className={`rounded-xl px-4 py-3 items-center ${
                  loading ? 'bg-orange-500/60' : 'bg-orange-500'
                }`}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-extrabold">
                    {editingSuggestion ? 'Update Suggestions' : 'Add Suggestions'}
                  </Text>
                )}
              </Pressable>
            </View>
          )}

          <View>
            <Text className="text-white text-lg font-bold mb-4">
              All Suggestion Sets ({suggestions.length})
            </Text>

            {suggestions.length === 0 && !loading ? (
              <View className="bg-white/10 rounded-xl p-6 items-center">
                <Ionicons name="bulb-outline" size={48} color="#cbd5e1" />
                <Text className="text-white text-center mt-2">
                  No suggestions yet. Click "Add Suggestions" to create your first set.
                </Text>
              </View>
            ) : (
              suggestions.map((suggestion) => (
                <View key={suggestion.id} className="bg-white/10 rounded-xl p-4 mb-4">
                  <View className="flex-row items-center mb-3">
                    <View className={`${getDisasterColor(suggestion.disasterType)} rounded-full px-3 py-1 mr-2`}>
                      <Text className="text-white text-xs font-semibold uppercase">
                        {suggestion.disasterType}
                      </Text>
                    </View>
                    <View className={`${getScoreRangeColor(suggestion.scoreRange)} rounded-full px-3 py-1`}>
                      <Text className="text-white text-xs font-semibold">
                        {getScoreRangeLabel(suggestion.scoreRange)}
                      </Text>
                    </View>
                  </View>
                  
                  <View className="mt-2">
                    <Text className="text-gray-400 text-xs mb-2">Suggestions:</Text>
                    {suggestion.suggestions.map((item, idx) => (
                      <View key={idx} className="flex-row mb-2">
                        <Text className="text-yellow-400 mr-2">•</Text>
                        <Text className="text-white flex-1 text-sm">{item}</Text>
                      </View>
                    ))}
                  </View>

                  <View className="flex-row justify-end items-center mt-3 pt-3 border-t border-white/10 gap-2">
                    <Pressable
                      onPress={() => handleEditSuggestion(suggestion)}
                      className="bg-blue-500/20 px-3 py-2 rounded-lg flex-row items-center"
                    >
                      <Ionicons name="pencil" size={16} color="#60A5FA" />
                      <Text className="text-blue-400 text-sm font-semibold ml-1">Edit</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDeleteSuggestion(suggestion.id)}
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

          {loading && suggestions.length === 0 && (
            <View className="items-center justify-center py-8">
              <ActivityIndicator size="large" color="#f97316" />
              <Text className="text-white mt-2">Loading suggestions...</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}