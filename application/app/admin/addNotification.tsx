import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';

type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface NotificationForm {
  title: string;
  message: string;
  type: NotificationType;
}

export default function addNotification() {
  const [form, setForm] = useState<NotificationForm>({
    title: '',
    message: '',
    type: 'info'
  });

  const notificationTypes = [
    { key: 'info', label: 'Information', icon: 'ℹ', color: 'blue' },
    { key: 'success', label: 'Success', icon: '✓', color: 'green' },
    { key: 'warning', label: 'Warning', icon: '⚠', color: 'yellow' },
    { key: 'error', label: 'Error', icon: '✕', color: 'red' }
  ];

  const getTypeColors = (type: string, isSelected: boolean) => {
    const colors = {
      info: { bg: isSelected ? 'bg-blue-600' : 'bg-blue-600/20', border: 'border-blue-500', text: 'text-blue-400' },
      success: { bg: isSelected ? 'bg-green-600' : 'bg-green-600/20', border: 'border-green-500', text: 'text-green-400' },
      warning: { bg: isSelected ? 'bg-yellow-600' : 'bg-yellow-600/20', border: 'border-yellow-500', text: 'text-yellow-400' },
      error: { bg: isSelected ? 'bg-red-600' : 'bg-red-600/20', border: 'border-red-500', text: 'text-red-400' }
    };
    return colors[type as keyof typeof colors];
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      Alert.alert('Error', 'Please enter a notification title');
      return;
    }
    if (!form.message.trim()) {
      Alert.alert('Error', 'Please enter a notification message');
      return;
    }

    // Here you would typically send the notification or save it
    Alert.alert(
      'Notification Created', 
      `Title: ${form.title}\nMessage: ${form.message}\nType: ${form.type}`,
      [
        {
          text: 'OK',
          onPress: () => {
            // Reset form
            setForm({ title: '', message: '', type: 'info' });
          }
        }
      ]
    );
  };

  const isFormValid = form.title.trim() && form.message.trim();

  return (
    <SafeAreaView className="flex-1 bg-[#0b1220]">
      <ScrollView className="flex-1 p-5">
        {/* Header */}
        <Text className="text-white text-2xl font-bold mb-6">Add Notification</Text>

        {/* Title Input */}
        <View className="mb-6">
          <Text className="text-gray-300 text-base font-medium mb-3">Notification Title</Text>
          <TextInput
            className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white text-base"
            placeholder="Enter notification title..."
            placeholderTextColor="#9CA3AF"
            value={form.title}
            onChangeText={(text) => setForm(prev => ({ ...prev, title: text }))}
            maxLength={100}
          />
          <Text className="text-gray-500 text-sm mt-1">{form.title.length}/100 characters</Text>
        </View>

        {/* Message Input */}
        <View className="mb-6">
          <Text className="text-gray-300 text-base font-medium mb-3">Notification Message</Text>
          <TextInput
            className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white text-base h-24"
            placeholder="Enter notification message..."
            placeholderTextColor="#9CA3AF"
            value={form.message}
            onChangeText={(text) => setForm(prev => ({ ...prev, message: text }))}
            multiline
            textAlignVertical="top"
            maxLength={500}
          />
          <Text className="text-gray-500 text-sm mt-1">{form.message.length}/500 characters</Text>
        </View>

        {/* Notification Type */}
        <View className="mb-8">
          <Text className="text-gray-300 text-base font-medium mb-4">Notification Type</Text>
          <View className="space-y-3">
            {notificationTypes.map((type) => {
              const isSelected = form.type === type.key;
              const colors = getTypeColors(type.key, isSelected);
              
              return (
                <TouchableOpacity
                  key={type.key}
                  onPress={() => setForm(prev => ({ ...prev, type: type.key as NotificationType }))}
                  className={`${colors.bg} ${colors.border} border-2 rounded-lg p-4 flex-row items-center`}
                >
                  <View className={`w-10 h-10 ${colors.border} border rounded-full items-center justify-center mr-4`}>
                    <Text className="text-lg">{type.icon}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className={`${isSelected ? 'text-white' : colors.text} text-base font-semibold`}>
                      {type.label}
                    </Text>
                    <Text className={`${isSelected ? 'text-gray-200' : 'text-gray-400'} text-sm`}>
                      {type.key === 'info' && 'General information or updates'}
                      {type.key === 'success' && 'Positive outcomes or confirmations'}
                      {type.key === 'warning' && 'Important alerts that need attention'}
                      {type.key === 'error' && 'Critical issues or failures'}
                    </Text>
                  </View>
                  {isSelected && (
                    <View className="w-6 h-6 bg-white rounded-full items-center justify-center">
                      <Text className="text-blue-600 text-sm font-bold">✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Preview Section */}
        {(form.title || form.message) && (
          <View className="mb-6">
            <Text className="text-gray-300 text-base font-medium mb-3">Preview</Text>
            <View className={`${getTypeColors(form.type, false).bg} ${getTypeColors(form.type, false).border} border-2 rounded-lg p-4`}>
              <View className="flex-row items-center mb-3">
                <View className={`w-8 h-8 ${getTypeColors(form.type, false).border} border rounded-full items-center justify-center mr-3`}>
                  <Text className="text-sm">
                    {notificationTypes.find(t => t.key === form.type)?.icon}
                  </Text>
                </View>
                <Text className="text-gray-300 text-xs uppercase tracking-wide">
                  {form.type} notification
                </Text>
              </View>
              {form.title && (
                <Text className="text-white text-lg font-bold mb-2">{form.title}</Text>
              )}
              {form.message && (
                <Text className="text-gray-300 text-sm">{form.message}</Text>
              )}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View className="flex-row space-x-3 mb-6">
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isFormValid}
            className={`flex-1 py-4 rounded-lg ${
              isFormValid ? 'bg-blue-600' : 'bg-gray-700'
            }`}
          >
            <Text className={`text-center font-semibold text-base ${
              isFormValid ? 'text-white' : 'text-gray-400'
            }`}>
              Create Notification
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setForm({ title: '', message: '', type: 'info' })}
            className="bg-gray-700 py-4 px-6 rounded-lg"
          >
            <Text className="text-white text-center font-semibold text-base">Clear</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}