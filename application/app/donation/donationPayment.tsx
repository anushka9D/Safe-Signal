import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, Image, TextInput, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, addDoc, collection, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../config/firebase-config';
import { CardField, useStripe } from '@stripe/stripe-react-native';


export default function DonationPayment() {
    const router = useRouter();
    const { id } = useLocalSearchParams(); 
    
    const [donationRequest, setDonationRequest] = useState<DonationRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [payAmount, setPayAmount] = useState('');
    const [processing, setProcessing] = useState(false);

    const { confirmPayment } = useStripe();
    const [cardComplete, setCardComplete] = useState(false);

    // Replace with your backend URL
    const BACKEND_URL = 'https://backend-payment-1-tj2r.onrender.com';

    interface DonationRequest {
        id: string;
        title: string;
        description: string;
        location: string;
        amount: number;
        raisedAmount: number;
        imageUrl: string;
        [key: string]: any;
    }

    useEffect(() => {
        if (id) {
            fetchDonationRequest();
        }
    }, [id]);

    const fetchDonationRequest = async () => {
        try {
            setLoading(true);
            const docRef = doc(db, 'donation_request', id as string);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                setDonationRequest({
                    id: docSnap.id,
                    ...docSnap.data()
                }as DonationRequest);
            } else {
                Alert.alert('Error', 'Donation request not found');
                router.back();
            }
        } catch (error) {
            console.error('Error fetching donation:', error);
            Alert.alert('Error', 'Failed to load donation details');
        } finally {
            setLoading(false);
        }
    };

    const getProgressPercentage = (raised: number, target: number) => {
        return Math.min((raised / target) * 100, 100);
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const handlePayment = async () => {
        const user = auth.currentUser;
        if (!user) {
            Alert.alert('Error', 'You must be logged in to donate');
            return;
        }

        if (!payAmount || isNaN(Number(payAmount)) || Number(payAmount) <= 0) {
            Alert.alert('Validation Error', 'Please enter a valid amount');
            return;
        }

        if (!cardComplete) {
            Alert.alert('Validation Error', 'Please complete your card details');
            return;
        }

        const amount = Number(payAmount);

        try {
            setProcessing(true);

            // Create payment intent on backend
            const response = await fetch(`${BACKEND_URL}/api/payments/create-payment-intent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount,
                    donationRequestId: id,
                    userId: user.uid,
                    userName: user.displayName || 'Anonymous',
                    title: donationRequest?.title,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create payment intent');
            }

            const { clientSecret, paymentIntentId } = await response.json();

            // Confirm payment with Stripe
            const { error, paymentIntent } = await confirmPayment(clientSecret, {
                paymentMethodType: 'Card',
            });

            if (error) {
                Alert.alert('Payment Failed', error.message);
                return;
            }

            if (paymentIntent?.status === 'Succeeded') {
                // Store donation data in Firebase
                const donationData = {
                    userId: user.uid,
                    userName: user.displayName || 'Anonymous',
                    title: donationRequest?.title,
                    paymentDate: serverTimestamp(),
                    payAmount: amount,
                    requestId: id,
                    paymentIntentId: paymentIntentId,
                    status: 'succeeded',
                };

                await addDoc(collection(db, 'donation'), donationData);

                // Update the raised amount
                const requestRef = doc(db, 'donation_request', id as string);
                await updateDoc(requestRef, {
                    raisedAmount: increment(amount)
                });

                Alert.alert(
                    'Success!',
                    `Thank you for your generous donation of ${formatAmount(amount)}!`,
                    [
                        {
                            text: 'OK',
                            onPress: () => router.back()
                        }
                    ]
                );
            }

        } catch (error: any) {
            console.error('Error processing donation:', error);
            Alert.alert('Error', 'Failed to process donation: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#EF4444" />
                    <Text className="text-gray-500 mt-4">Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!donationRequest) {
        return null;
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
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
                    <Text className="text-2xl font-bold text-gray-800 mt-8">
                        Make a Donation
                    </Text>
                    <View className="w-10" />
                </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Campaign Details Card */}
                <View className="px-6 py-6">
                    <View className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
                        {/* Image */}
                        {donationRequest.imageUrl && (
                            <Image
                                source={{ uri: donationRequest.imageUrl }}
                                className="w-full h-56"
                                resizeMode="cover"
                            />
                        )}

                        <View className="p-5">
                            {/* Title */}
                            <View className="flex-row items-start mb-3">
                                <View className="bg-red-100 rounded-full p-2 mr-3">
                                    <Ionicons name="heart" size={24} color="#EF4444" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-800 font-bold text-xl mb-2">
                                        {donationRequest.title}
                                    </Text>
                                </View>
                            </View>

                            {/* Location */}
                            <View className="flex-row items-center mb-3">
                                <Ionicons name="location" size={18} color="#6B7280" />
                                <Text className="text-gray-600 ml-2 text-sm">
                                    {donationRequest.location}
                                </Text>
                            </View>

                            {/* Description */}
                            <Text className="text-gray-600 text-sm leading-5 mb-4">
                                {donationRequest.description}
                            </Text>

                            {/* Progress Section */}
                            <View className="bg-gray-50 rounded-xl p-4 mb-4">
                                <View className="flex-row justify-between mb-3">
                                    <View>
                                        <Text className="text-gray-500 text-xs mb-1">Raised</Text>
                                        <Text className="text-green-600 font-bold text-lg">
                                            {formatAmount(donationRequest.raisedAmount)}
                                        </Text>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-gray-500 text-xs mb-1">Goal</Text>
                                        <Text className="text-gray-700 font-bold text-lg">
                                            {formatAmount(donationRequest.amount)}
                                        </Text>
                                    </View>
                                </View>

                                {/* Progress Bar */}
                                <View className="bg-gray-200 rounded-full h-3 overflow-hidden mb-2">
                                    <View 
                                        className="bg-green-500 h-full rounded-full"
                                        style={{ 
                                            width: `${getProgressPercentage(
                                                donationRequest.raisedAmount, 
                                                donationRequest.amount
                                            )}%` 
                                        }}
                                    />
                                </View>
                                <Text className="text-gray-500 text-xs text-right">
                                    {getProgressPercentage(
                                        donationRequest.raisedAmount, 
                                        donationRequest.amount
                                    ).toFixed(1)}% funded
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Payment Section */}
                <View className="px-6 pb-6">
                    <View className="bg-white rounded-2xl shadow-md p-5 border border-gray-100">
                        <Text className="text-gray-800 font-bold text-lg mb-4">
                            Enter Donation Amount
                        </Text>

                        {/* Amount Input */}
                        <View className="mb-5">
                            <View className="flex-row items-center bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3">
                                <Text className="text-gray-700 text-2xl font-bold mr-2">$</Text>
                                <TextInput
                                    className="flex-1 text-gray-800 text-2xl font-bold"
                                    placeholder="0"
                                    placeholderTextColor="#D1D5DB"
                                    keyboardType="numeric"
                                    value={payAmount}
                                    onChangeText={setPayAmount}
                                    editable={!processing}
                                />
                            </View>
                        </View>

                        {/* Quick Amount Buttons */}
                        <View className="flex-row justify-between mb-5">
                            {[10, 25, 50, 100].map((amount) => (
                                <TouchableOpacity
                                    key={amount}
                                    className="bg-gray-100 rounded-lg px-4 py-2 flex-1 mx-1"
                                    onPress={() => setPayAmount(amount.toString())}
                                    disabled={processing}
                                >
                                    <Text className="text-gray-700 font-semibold text-center">
                                        ${amount}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Card Input */}
                        <View className="mb-5">
                            <Text className="text-gray-700 font-semibold mb-2">Card Details</Text>
                            <CardField
                                postalCodeEnabled={true}
                                placeholders={{
                                    number: '4242 4242 4242 4242',
                                }}
                                cardStyle={{
                                    backgroundColor: '#F9FAFB',
                                    textColor: '#1F2937',
                                    borderWidth: 2,
                                    borderColor: '#E5E7EB',
                                    borderRadius: 12,
                                }}
                                style={{
                                    width: '100%',
                                    height: 50,
                                    marginVertical: 8,
                                }}
                                onCardChange={(cardDetails) => {
                                    setCardComplete(cardDetails.complete);
                                }}
                            />
                        </View>

                        {/* Donate Button */}
                        <TouchableOpacity
                            className={`rounded-xl py-4 items-center ${
                                processing ? 'bg-orange-300' : 'bg-orange-500'
                            }`}
                            onPress={handlePayment}
                            disabled={processing}
                        >
                            {processing ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <View className="flex-row items-center">
                                    <Ionicons name="heart" size={22} color="white" />
                                    <Text className="text-white font-bold text-lg ml-2">
                                        Donate Now
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Trust Badge */}
                        <View className="bg-green-50 rounded-lg p-3 flex-row items-center mt-4">
                            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                            <Text className="text-green-700 text-xs ml-2 flex-1">
                                Secure payment • 100% goes to the cause
                            </Text>
                        </View>
                    </View>
                </View>

                <View className="h-80" />
            </ScrollView>
        </SafeAreaView>
    );
}