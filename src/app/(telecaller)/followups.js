import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, Linking } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useThemeStore } from '../../store/themeStore';
import { PhoneCall, Check, AlertCircle, CalendarRange } from 'lucide-react-native';
import OfflineBanner from '../../components/OfflineBanner';
import CallModal from '../../components/CallModal';

export default function TelecallerFollowups() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('today'); // 'today', 'upcoming', 'overdue'
  const [refreshing, setRefreshing] = useState(false);

  // Call logger state
  const [selectedLeadForCall, setSelectedLeadForCall] = useState(null);
  const [callModalVisible, setCallModalVisible] = useState(false);
  const [callStartTime, setCallStartTime] = useState(null);

  // Query followups
  const todayDate = new Date().toISOString().split('T')[0];
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['telecallerFollowupsList', todayDate],
    queryFn: async () => {
      const response = await api.get('/followups', {
        params: { todayDate }
      });
      return response.data;
    }
  });

  // Mutations
  const completeMutation = useMutation({
    mutationFn: (id) => api.patch(`/followups/${id}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telecallerFollowupsList'] });
      queryClient.invalidateQueries({ queryKey: ['telecallerDashboardStats'] });
      Alert.alert('Completed', 'Follow-up marked as completed.');
    },
    onError: (err) => {
      Alert.alert('Error', err.response?.data?.error || 'Failed to complete.');
    }
  });

  const logCallMutation = useMutation({
    mutationFn: (callDetails) => api.post('/calls', callDetails),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telecallerDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['telecallerLeadsList'] });
      queryClient.invalidateQueries({ queryKey: ['telecallerFollowupsList'] });
      Alert.alert('Success', 'Call logged successfully.');
    },
    onError: (err) => {
      Alert.alert('Failed to log call', err.message);
    }
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleComplete = (followupId) => {
    completeMutation.mutate(followupId);
  };

  // Dialer flow
  const triggerSimCall = (lead) => {
    if (!lead || !lead.mobile) return;
    
    setCallStartTime(new Date().toISOString());
    setSelectedLeadForCall(lead);

    const telUrl = `tel:${lead.mobile}`;
    Linking.openURL(telUrl)
      .then(() => {
        setCallModalVisible(true);
      })
      .catch((err) => {
        console.log('Link error:', err);
        Alert.alert('Unavailable', 'SIM Calling is not supported or permission denied on this device.');
      });
  };

  const handleCallModalSubmit = async (loggedDetails) => {
    const end_time = new Date().toISOString();
    const duration = Math.round((new Date(end_time) - new Date(callStartTime)) / 1000);

    const payload = {
      lead_id: loggedDetails.lead_id,
      status: loggedDetails.status,
      notes: loggedDetails.notes,
      start_time: callStartTime,
      end_time,
      duration,
      followupDate: loggedDetails.followupDate,
      followupTime: loggedDetails.followupTime,
      followupNotes: loggedDetails.followupNotes
    };

    await logCallMutation.mutateAsync(payload);
  };

  if (isLoading) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <ActivityIndicator size="large" color="#F59E0B" />
        <Text className={`text-sm mt-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading schedules...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className={`flex-1 justify-center items-center px-6 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <Text className="text-red-500 text-sm font-semibold mb-2">Error Loading Followups</Text>
        <Text className="text-xs text-slate-500 text-center mb-6">{error.message}</Text>
        <TouchableOpacity onPress={() => refetch()} className="bg-amber-500 px-6 py-3 rounded-xl">
          <Text className="text-white text-xs font-bold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Get active list from tab
  const getActiveList = () => {
    if (activeTab === 'today') return data.today || [];
    if (activeTab === 'upcoming') return data.upcoming || [];
    return data.overdue || [];
  };

  const activeList = getActiveList();

  return (
    <View className={`flex-1 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <OfflineBanner />

      {/* Tab controls */}
      <View className={`flex-row border-b p-2 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        {[
          { key: 'today', label: 'Today', count: data.today?.length || 0, badgeColor: 'bg-amber-500' },
          { key: 'upcoming', label: 'Upcoming', count: data.upcoming?.length || 0, badgeColor: 'bg-blue-500' },
          { key: 'overdue', label: 'Overdue', count: data.overdue?.length || 0, badgeColor: 'bg-red-500' }
        ].map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 items-center border-b-2 justify-center flex-row ${
                isSelected ? 'border-amber-500' : 'border-transparent'
              }`}
            >
              <Text className={`text-xs font-bold ${
                isSelected ? 'text-amber-500' : isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View className={`ml-1.5 px-2 py-0.5 rounded-full ${tab.badgeColor}`}>
                  <Text className="text-white text-[9px] font-black">{tab.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Followups scroll view */}
      <ScrollView
        contentContainerStyle={{ padding: 12 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F59E0B']} />
        }
      >
        {activeList.length === 0 ? (
          <View className="items-center py-20 px-6">
            <CalendarRange size={36} color={isDark ? '#475569' : '#CBD5E1'} className="mb-4" />
            <Text className={`text-xs text-center font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              No scheduled follow-ups here. Clean sheet!
            </Text>
          </View>
        ) : (
          <View className="space-y-4">
            {activeList.map((item) => (
              <View
                key={item.id}
                className={`p-4 rounded-3xl border shadow-sm ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                }`}
              >
                {/* Header info */}
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1 mr-2">
                    <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      {item.lead_name}
                    </Text>
                    <Text className={`text-xxs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Mobile: {item.lead_mobile} • {item.lead_city || 'No Location'}
                    </Text>
                  </View>
                  
                  {activeTab === 'overdue' && (
                    <View className="flex-row items-center bg-red-500/10 border border-red-500/20 px-2 py-1.5 rounded-xl">
                      <AlertCircle size={10} color="#EF4444" />
                      <Text className="text-red-500 text-xxs font-black uppercase tracking-wider ml-1">Overdue</Text>
                    </View>
                  )}
                </View>

                {/* Sub details */}
                <View className="bg-slate-500/5 p-3 rounded-2xl border border-slate-500/10 mb-4 space-y-1">
                  <Text className={`text-[10px] font-extrabold uppercase ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                    Scheduled Time: {item.date} @ {item.time}
                  </Text>
                  <Text className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Notes: {item.notes || 'No scheduled notes.'}
                  </Text>
                </View>

                {/* Actions row */}
                <View className="flex-row justify-between pt-1">
                  <TouchableOpacity
                    onPress={() => triggerSimCall({ id: item.lead_id, name: item.lead_name, mobile: item.lead_mobile })}
                    className="bg-emerald-500 py-3 rounded-xl flex-row justify-center items-center w-[48%] shadow-sm"
                  >
                    <PhoneCall size={12} color="#FFFFFF" />
                    <Text className="text-white text-xs font-bold ml-1.5">Call Customer</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleComplete(item.id)}
                    disabled={completeMutation.isPending}
                    className={`py-3 rounded-xl border flex-row justify-center items-center w-[48%] ${
                      isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-350 bg-slate-50'
                    }`}
                  >
                    <Check size={12} color="#10B981" />
                    <Text className={`text-xs font-bold ml-1.5 text-emerald-500`}>Mark Complete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Call Logger modal */}
      {selectedLeadForCall && (
        <CallModal
          visible={callModalVisible}
          onClose={() => setCallModalVisible(false)}
          lead={selectedLeadForCall}
          onSubmit={handleCallModalSubmit}
          isDark={isDark}
        />
      )}
    </View>
  );
}
