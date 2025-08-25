import { Text, View, TouchableOpacity, SafeAreaView, StatusBar } from "react-native";

import React, { useEffect, useState } from 'react'


import { useRouter } from "expo-router";


import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native'

import { router } from 'expo-router'
import { onAuthStateChanged, signInWithEmailAndPassword, User } from 'firebase/auth'
import { auth } from '../../config/firebase-config'
import { getSupport, enableForUser, isEnabledForUser, authenticate } from '../../lib/biometrics'

export default function Index() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100">
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            
            

        </SafeAreaView>
    );
}