import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, ActivityIndicator,Dimensions,RefreshControl} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase-config';

const { width } = Dimensions.get('window');

interface DonationRequest {
  id: string;
  title: string;
  description: string;
  location: string;
  amount: number;
  raisedAmount: number;
  imageUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  userId: string;
  userEmail: string;
  contactNo: string;
  createdAt: any;
  [key: string]: any;
}

interface Stats {
  total: number;
  today: number;
  approved: number;
  rejected: number;
  pending: number;
  completed: number;
}

interface StatusColors {
  bg: string;
  text: string;
  border: string;
}

export default function DonationAdminDashboard() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('all');
  const [showChart, setShowChart] = useState(false);
  
  // Stats
  const [stats, setStats] = useState<Stats>({
    total: 0,
    today: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
    completed: 0
  });
  
  // All donations
  const [allDonations, setAllDonations] = useState<DonationRequest[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<DonationRequest[]>([]);

  useEffect(() => {
    fetchDonations();
  }, []);

  useEffect(() => {
    filterDonations();
  }, [activeFilter, allDonations]);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      
      const donationsRef = collection(db, 'donation_request');
      const querySnapshot = await getDocs(donationsRef);
      
      const donations: DonationRequest[] = [];
      let totalCount = 0;
      let todayCount = 0;
      let approvedCount = 0;
      let rejectedCount = 0;
      let pendingCount = 0;
      let completedCount = 0;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        donations.push({
          id: doc.id,
          ...data
        } as DonationRequest);
        
        totalCount++;
        
        // Check if created today
        if (data.createdAt) {
          const createdDate = data.createdAt.toDate();
          createdDate.setHours(0, 0, 0, 0);
          if (createdDate.getTime() === today.getTime()) {
            todayCount++;
          }
        }
        
        // Count by status
        if (data.status === 'approved') {
          approvedCount++;
          // Check if completed (raised >= target)
          if (data.raisedAmount >= data.amount) {
            completedCount++;
          }
        } else if (data.status === 'rejected') {
          rejectedCount++;
        } else if (data.status === 'pending') {
          pendingCount++;
        }
      });
      
      // Sort by date (newest first)
      donations.sort((a, b) => {
        const dateA = a.createdAt?.toDate() || new Date(0);
        const dateB = b.createdAt?.toDate() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      
      setAllDonations(donations);
      setStats({
        total: totalCount,
        today: todayCount,
        approved: approvedCount,
        rejected: rejectedCount,
        pending: pendingCount,
        completed: completedCount
      });
      
    } catch (error) {
      console.error('Error fetching donations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterDonations = () => {
    if (activeFilter === 'all') {
      setFilteredDonations(allDonations);
    } else if (activeFilter === 'completed') {
      // Show approved donations where raised >= target
      setFilteredDonations(
        allDonations.filter(d => 
          d.status === 'approved' && d.raisedAmount >= d.amount
        )
      );
    } else {
      setFilteredDonations(
        allDonations.filter(d => d.status === activeFilter)
      );
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDonations();
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string, raised: number, target: number): StatusColors => {
    // Check if completed
    if (status === 'approved' && raised >= target) {
      return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' };
    }
    
    switch (status) {
      case 'approved': return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' };
      case 'pending': return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/50' };
      case 'rejected': return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' };
      default: return { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/50' };
    }
  };

  const getStatusText = (status: string, raised: number, target: number): string => {
    if (status === 'approved' && raised >= target) {
      return 'Completed';
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getStatusIcon = (status: string, raised: number, target: number): any => {
    if (status === 'approved' && raised >= target) {
      return 'checkmark-done-circle';
    }
    
    switch (status) {
      case 'approved': return 'checkmark-circle';
      case 'pending': return 'time';
      case 'rejected': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const handleDonationClick = (donation: DonationRequest) => {
    // Navigate to edit donation page
    router.push(`/admin/edit-donation/${donation.id}` as any);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#0b1220]">
        <StatusBar barStyle="light-content" backgroundColor="#0b1220" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-400 mt-4">Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0b1220]">
      <StatusBar barStyle="light-content" backgroundColor="#0b1220" />
      
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-800">
        <Text className="text-3xl font-bold text-white mb-1">
          Donations
        </Text>
        <Text className="text-gray-400 text-sm">
          Manage and monitor all requests
        </Text>
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#3B82F6"
          />
        }
      >
        {/* Stats Grid */}
        <View className="px-6 py-6">
          <View className="flex-row flex-wrap justify-between">
            {/* Total */}
            <View className="bg-gradient-to-br from-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mb-4" style={{ width: (width - 56) / 2 }}>
              <View className="flex-row items-center justify-between mb-3">
                <View className="bg-blue-500/20 p-2 rounded-xl">
                  <Ionicons name="stats-chart" size={20} color="#60A5FA" />
                </View>
                <Text className="text-blue-400 text-xs font-medium">All Time</Text>
              </View>
              <Text className="text-2xl font-bold text-white mb-1">{stats.total}</Text>
              <Text className="text-gray-400 text-xs">Total Requests</Text>
            </View>

            {/* Today */}
            <View className="bg-gradient-to-br from-purple-500/10 border border-purple-500/20 rounded-2xl p-4 mb-4" style={{ width: (width - 56) / 2 }}>
              <View className="flex-row items-center justify-between mb-3">
                <View className="bg-purple-500/20 p-2 rounded-xl">
                  <Ionicons name="today" size={20} color="#A78BFA" />
                </View>
                <Text className="text-purple-400 text-xs font-medium">Today</Text>
              </View>
              <Text className="text-2xl font-bold text-white mb-1">{stats.today}</Text>
              <Text className="text-gray-400 text-xs">New Today</Text>
            </View>

            {/* Approved */}
            <View className="bg-gradient-to-br from-green-500/10 border border-green-500/20 rounded-2xl p-4 mb-4" style={{ width: (width - 56) / 2 }}>
              <View className="flex-row items-center justify-between mb-3">
                <View className="bg-green-500/20 p-2 rounded-xl">
                  <Ionicons name="checkmark-circle" size={20} color="#34D399" />
                </View>
                <Text className="text-green-400 text-xs font-medium">Active</Text>
              </View>
              <Text className="text-2xl font-bold text-white mb-1">{stats.approved}</Text>
              <Text className="text-gray-400 text-xs">Approved</Text>
            </View>

            {/* Rejected */}
            <View className="bg-gradient-to-br from-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-4" style={{ width: (width - 56) / 2 }}>
              <View className="flex-row items-center justify-between mb-3">
                <View className="bg-red-500/20 p-2 rounded-xl">
                  <Ionicons name="close-circle" size={20} color="#F87171" />
                </View>
                <Text className="text-red-400 text-xs font-medium">Declined</Text>
              </View>
              <Text className="text-2xl font-bold text-white mb-1">{stats.rejected}</Text>
              <Text className="text-gray-400 text-xs">Rejected</Text>
            </View>
          </View>
        </View>

        {/* Chart View Button */}
        <View className="px-6 pb-4">
          <TouchableOpacity
            className="bg-[#1a2332] border border-gray-700/50 rounded-2xl p-4 flex-row items-center justify-between"
            onPress={() => setShowChart(!showChart)}
          >
            <View className="flex-row items-center">
              <Ionicons name="pie-chart" size={24} color="#60A5FA" />
              <Text className="text-white font-semibold ml-3">Analytics Overview</Text>
            </View>
            <Ionicons 
              name={showChart ? "chevron-up" : "chevron-down"} 
              size={24} 
              color="#9CA3AF" 
            />
          </TouchableOpacity>
        </View>

        {/* Simple Chart View */}
        {showChart && (
          <View className="px-6 pb-4">
            <View className="bg-[#1a2332] border border-gray-700/50 rounded-2xl p-5">
              <Text className="text-white font-semibold mb-4">Request Distribution</Text>
              
              {/* Pending */}
              <View className="mb-4">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <View className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
                    <Text className="text-gray-300">Pending</Text>
                  </View>
                  <Text className="text-white font-semibold">{stats.pending}</Text>
                </View>
                <View className="bg-gray-700 h-2 rounded-full overflow-hidden">
                  <View 
                    className="bg-yellow-500 h-full"
                    style={{ width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%` }}
                  />
                </View>
              </View>

              {/* Approved */}
              <View className="mb-4">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <View className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                    <Text className="text-gray-300">Approved</Text>
                  </View>
                  <Text className="text-white font-semibold">{stats.approved}</Text>
                </View>
                <View className="bg-gray-700 h-2 rounded-full overflow-hidden">
                  <View 
                    className="bg-green-500 h-full"
                    style={{ width: `${stats.total > 0 ? (stats.approved / stats.total) * 100 : 0}%` }}
                  />
                </View>
              </View>

              {/* Rejected */}
              <View className="mb-4">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <View className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                    <Text className="text-gray-300">Rejected</Text>
                  </View>
                  <Text className="text-white font-semibold">{stats.rejected}</Text>
                </View>
                <View className="bg-gray-700 h-2 rounded-full overflow-hidden">
                  <View 
                    className="bg-red-500 h-full"
                    style={{ width: `${stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0}%` }}
                  />
                </View>
              </View>

              {/* Completed */}
              <View>
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <View className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                    <Text className="text-gray-300">Completed</Text>
                  </View>
                  <Text className="text-white font-semibold">{stats.completed}</Text>
                </View>
                <View className="bg-gray-700 h-2 rounded-full overflow-hidden">
                  <View 
                    className="bg-blue-500 h-full"
                    style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Filters */}
        <View className="px-6 pb-4">
          <View className="bg-[#1a2332] border border-gray-700/50 rounded-2xl p-4">
            <View className="flex-row items-center mb-3">
              <Ionicons name="filter" size={20} color="#9CA3AF" />
              <Text className="text-white font-semibold ml-2">Filter Requests</Text>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  className={`px-4 py-2 rounded-xl ${
                    activeFilter === 'all' ? 'bg-blue-500' : 'bg-gray-700/50'
                  }`}
                  onPress={() => setActiveFilter('all')}
                >
                  <Text className={`font-medium ${
                    activeFilter === 'all' ? 'text-white' : 'text-gray-300'
                  }`}>
                    All ({stats.total})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`px-4 py-2 rounded-xl ${
                    activeFilter === 'pending' ? 'bg-yellow-500' : 'bg-gray-700/50'
                  }`}
                  onPress={() => setActiveFilter('pending')}
                >
                  <Text className={`font-medium ${
                    activeFilter === 'pending' ? 'text-white' : 'text-gray-300'
                  }`}>
                    Pending ({stats.pending})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`px-4 py-2 rounded-xl ${
                    activeFilter === 'approved' ? 'bg-green-500' : 'bg-gray-700/50'
                  }`}
                  onPress={() => setActiveFilter('approved')}
                >
                  <Text className={`font-medium ${
                    activeFilter === 'approved' ? 'text-white' : 'text-gray-300'
                  }`}>
                    Approved ({stats.approved})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`px-4 py-2 rounded-xl ${
                    activeFilter === 'rejected' ? 'bg-red-500' : 'bg-gray-700/50'
                  }`}
                  onPress={() => setActiveFilter('rejected')}
                >
                  <Text className={`font-medium ${
                    activeFilter === 'rejected' ? 'text-white' : 'text-gray-300'
                  }`}>
                    Rejected ({stats.rejected})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`px-4 py-2 rounded-xl ${
                    activeFilter === 'completed' ? 'bg-blue-500' : 'bg-gray-700/50'
                  }`}
                  onPress={() => setActiveFilter('completed')}
                >
                  <Text className={`font-medium ${
                    activeFilter === 'completed' ? 'text-white' : 'text-gray-300'
                  }`}>
                    Completed ({stats.completed})
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>

        {/* Donations List */}
        <View className="px-6 pb-6">
          <Text className="text-xl font-bold text-white mb-4">
            {activeFilter === 'all' ? 'All Requests' : `${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Requests`}
          </Text>
          
          {filteredDonations.length === 0 ? (
            <View className="bg-[#1a2332] border border-gray-700/50 rounded-2xl p-8 items-center">
              <Ionicons name="folder-open-outline" size={48} color="#4B5563" />
              <Text className="text-gray-400 mt-3">No requests found</Text>
            </View>
          ) : (
            filteredDonations.map((donation) => {
              const statusColors = getStatusColor(donation.status, donation.raisedAmount, donation.amount);
              const statusText = getStatusText(donation.status, donation.raisedAmount, donation.amount);
              const statusIconName = getStatusIcon(donation.status, donation.raisedAmount, donation.amount);
              
              return (
                <TouchableOpacity
                  key={donation.id}
                  className="bg-[#1a2332] border border-gray-700/50 rounded-2xl p-4 mb-3 active:border-blue-500/50"
                  onPress={() => handleDonationClick(donation)}
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1 pr-3">
                      <Text className="text-white font-semibold text-base mb-1" numberOfLines={2}>
                        {donation.title}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
                        <Text className="text-gray-400 text-xs ml-1">
                          {formatDate(donation.createdAt)}
                        </Text>
                      </View>
                    </View>
                    <View className={`px-3 py-1 rounded-lg border ${statusColors.bg} ${statusColors.border} flex-row items-center`}>
                      <Ionicons name={statusIconName} size={14} color={statusColors.text.replace('text-', '#')} />
                      <Text className={`${statusColors.text} text-xs font-medium ml-1`}>
                        {statusText}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-gray-400 text-xs mb-1">Target Amount</Text>
                      <Text className="text-white font-semibold">
                        {formatAmount(donation.amount)}
                      </Text>
                    </View>
                    {donation.status === 'approved' && (
                      <View className="items-end">
                        <Text className="text-gray-400 text-xs mb-1">Raised</Text>
                        <Text className="text-green-400 font-semibold">
                          {formatAmount(donation.raisedAmount || 0)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Progress bar for approved */}
                  {donation.status === 'approved' && (
                    <View className="mt-3">
                      <View className="bg-gray-700 h-1.5 rounded-full overflow-hidden">
                        <View 
                          className="bg-green-500 h-full rounded-full"
                          style={{ 
                            width: `${Math.min((donation.raisedAmount / donation.amount) * 100, 100)}%` 
                          }}
                        />
                      </View>
                      <Text className="text-gray-400 text-xs mt-1 text-right">
                        {Math.min(((donation.raisedAmount / donation.amount) * 100), 100).toFixed(1)}% funded
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}