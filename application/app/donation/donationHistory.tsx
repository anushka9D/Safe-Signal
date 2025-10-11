import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '../../config/firebase-config';
import { useRouter } from "expo-router";

interface Donation {
    id: string;
    title: string;
    paymentDate: any;
    payAmount: number;
    requestId: string;
}


export default function DonationHistory(){
    const router = useRouter();
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchDonationHistory();
    }, []);

    const fetchDonationHistory = async () => {
        const user = auth.currentUser;
        if (!user) {
            Alert.alert('Error', 'You must be logged in to view donation history');
            if (router) {
                router.back();
            }
            return;
        }

        try {
            setLoading(true);
            const donationsRef = collection(db, 'donation');
            const q = query(
                donationsRef,
                where('userId', '==', user.uid),
                orderBy('paymentDate', 'desc')
            );
            
            const querySnapshot = await getDocs(q);
            const donationsList: Donation[] = [];
            
            querySnapshot.forEach((doc) => {
                donationsList.push({
                    id: doc.id,
                    ...doc.data()
                } as Donation);
            });
            
            setDonations(donationsList);
        } catch (error) {
            console.error('Error fetching donation history:', error);
            Alert.alert('Error', 'Failed to load donation history');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchDonationHistory();
        setRefreshing(false);
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        
        let date;
        if (timestamp.toDate) {
            date = timestamp.toDate();
        } else if (timestamp.seconds) {
            date = new Date(timestamp.seconds * 1000);
        } else {
            date = new Date(timestamp);
        }
        
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getTotalDonated = () => {
        return donations.reduce((sum, donation) => sum + donation.payAmount, 0);
    };

    const handleGoBack = () => {
        router.back();
    };

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color="#EF4444" />
                    <Text style={{ color: '#6B7280', marginTop: 16 }}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            {/* Header */}
            <View style={{ backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2, paddingHorizontal: 24, paddingVertical: 16, paddingTop: 48 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <TouchableOpacity
                        style={{ backgroundColor: '#F3F4F6', borderRadius: 999, padding: 8, marginTop: 32 }}
                        onPress={handleGoBack}
                    >
                        <Ionicons name="arrow-back" size={24} color="#4B5563" />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginTop: 32 }}>
                        Donation History
                    </Text>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            {/* Summary Card */}
            {donations.length > 0 && (
                <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
                    <View style={{ backgroundColor: '#F97316', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, padding: 8 }}>
                                <Ionicons name="heart" size={24} color="white" />
                            </View>
                            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, marginLeft: 12 }}>Total Contributed</Text>
                        </View>
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 30, marginLeft: 4 }}>
                            {formatAmount(getTotalDonated())}
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4, marginLeft: 4 }}>
                            {donations.length} {donations.length === 1 ? 'donation' : 'donations'}
                        </Text>
                    </View>
                </View>
            )}

            <ScrollView 
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#EF4444"
                    />
                }
            >
                {/* Donations List */}
                <View style={{ paddingHorizontal: 24, paddingVertical: 24 }}>
                    {donations.length === 0 ? (
                        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
                            <View style={{ backgroundColor: '#F3F4F6', borderRadius: 999, padding: 24, marginBottom: 16 }}>
                                <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
                            </View>
                            <Text style={{ color: '#1F2937', fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>
                                No Donations Yet
                            </Text>
                            <Text style={{ color: '#6B7280', textAlign: 'center', fontSize: 14 }}>
                                Your donation history will appear here once you make your first contribution
                            </Text>
                        </View>
                    ) : (
                        <>
                            {donations.map((donation, index) => (
                                <View 
                                    key={donation.id}
                                    style={{ backgroundColor: 'white', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                                        {/* Icon */}
                                        <View style={{ backgroundColor: '#FED7AA', borderRadius: 999, padding: 12, marginRight: 12 }}>
                                            <Ionicons name="heart" size={20} color="#F97316" />
                                        </View>

                                        {/* Content */}
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: '#1F2937', fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>
                                                {donation.title}
                                            </Text>
                                            
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                                                <Text style={{ color: '#6B7280', fontSize: 14, marginLeft: 4 }}>
                                                    {formatDate(donation.paymentDate)}
                                                </Text>
                                            </View>

                                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                                                <View style={{ backgroundColor: '#DCFCE7', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
                                                    <Text style={{ color: '#15803D', fontWeight: 'bold', fontSize: 16 }}>
                                                        {formatAmount(donation.payAmount)}
                                                    </Text>
                                                </View>

                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                                                    <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '500', marginLeft: 4 }}>
                                                        Completed
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </>
                    )}
                </View>

                <View style={{ height: 24 }} />
            </ScrollView>
        </SafeAreaView>
    );
}