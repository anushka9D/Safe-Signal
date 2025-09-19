import { SafeAreaView, StatusBar, View, Text, TextInput, TouchableOpacity } from "react-native";
import React, { useState } from 'react';
import { useRouter } from "expo-router";

export default function Index() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = () => {
        router.push('../dashboards/dashboard');
        console.log('Login attempt with:', { email, password });
    };

    const handleRegisterPress = () => {
        // Add navigation to registration screen here
    };

    return (
        <SafeAreaView className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100">
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            <View className="flex-1">

                <View style={{ flex: 2 }} className="items-center justify-center">
                    <Text className="text-4xl font-bold text-gray-800">
                        Safe Signal
                    </Text>
                </View>

                <View style={{ flex: 3 }} className="px-6 pt-8">
                    {/* Page Title */}
                    <View className="mb-8">
                        <Text className="text-2xl font-semibold text-gray-800 text-center">
                            Login
                        </Text>
                    </View>

                    {/* Login Form */}
                    <View className="space-y-4">
                        {/* Email Input */}
                        <View>
                            <Text className="text-sm font-medium text-gray-700 mb-2">
                                Email
                            </Text>
                            <TextInput
                                className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                                placeholder="Enter your email"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        {/* Password Input */}
                        <View className="mb-6">
                            <Text className="text-sm font-medium text-gray-700 mb-2">
                                Password
                            </Text>
                            <View className="relative">
                                <TextInput
                                    className="bg-white border border-gray-300 rounded-lg px-4 py-3 pr-12 text-gray-900"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                                <TouchableOpacity
                                    className="absolute right-3 top-3"
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    <Text className="text-gray-800 font-medium">
                                        {showPassword ? 'Hide' : 'Show'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Login Button */}
                        <TouchableOpacity
                            className="bg-gray-800 rounded-lg py-4 items-center mb-4"
                            onPress={handleLogin}
                        >
                            <Text className="text-white font-semibold text-lg">
                                Login
                            </Text>
                        </TouchableOpacity>

                        {/* Registration Link */}
                        <TouchableOpacity
                            className="items-center"
                            onPress={handleRegisterPress}
                        >
                            <Text className="text-gray-800 font-medium">
                                Click here if you are not registered
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}