import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, TextInput, Linking, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useThemeStore } from '../../store/themeStore';
import { PhoneCall, CalendarClock, History, Smartphone, Users, UserPlus, Calendar, PhoneForwarded, ThumbsUp, CheckCircle2, Briefcase, TrendingUp } from 'lucide-react-native';
import OfflineBanner from '../../components/OfflineBanner';
import CallModal from '../../components/CallModal';

export default function TelecallerDashboard() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Quick Call state
  const [quickPhone, setQuickPhone] = useState('');
  const [quickName, setQuickName] = useState('');
  
  // Call logger state
  const [selectedLeadForCall, setSelectedLeadForCall] = useState(null);
  const [callModalVisible, setCallModalVisible] = useState(false);
  const [callStartTime, setCallStartTime] = useState(null);

  // Fetch Caller Dashboard Stats
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['telecallerDashboardStats'],
    queryFn: async () => {
      const response = await api.get('/reports/telecaller-dashboard');
      return response.data;
    }
  });

  // Call Logger Mutation
  const logCallMutation = useMutation({
    mutationFn: (callDetails) => api.post('/calls', callDetails),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telecallerDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['telecallerLeadsList'] });
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

  // Calling Trigger flow
  const triggerSimCall = (lead) => {
    if (!lead || !lead.mobile) return;
    
    // Track timestamps
    setCallStartTime(new Date().toISOString());
    setSelectedLeadForCall(lead);

    const telUrl = `tel:${lead.mobile}`;
    Linking.openURL(telUrl)
      .then(() => {
        // Show logger modal upon returning
        setCallModalVisible(true);
      })
      .catch((err) => {
        console.log('Link error:', err);
        Alert.alert('Unavailable', 'SIM Calling is not supported or permission denied on this device.');
      });
  };

  const handleQuickCall = () => {
    if (!quickPhone || quickPhone.length !== 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    const dummyLead = {
      id: 'QUICK',
      name: quickName.trim() || 'Quick Call Lead',
      mobile: quickPhone
    };

    triggerSimCall(dummyLead);
    setQuickPhone('');
    setQuickName('');
  };

  const handleCallModalSubmit = async (loggedDetails) => {
    const end_time = new Date().toISOString();
    const duration = Math.round((new Date(end_time) - new Date(callStartTime)) / 1000); // in seconds

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

    // If it was a quick call not in the CRM, we can mock/create a manual lead first or handle it
    // For simplicity, if ID is 'QUICK', we can register it or assign dummy ID. Let's make the backend handle it.
    // In our backend, the lead must exist. So we'll hit create lead first if it's QUICK!
    if (loggedDetails.lead_id === 'QUICK') {
      try {
        const leadRes = await api.post('/leads', {
          name: quickName.trim() || 'Quick Call Customer',
          mobile: dummyLead.mobile,
          lead_source: 'Manual Entry'
        });
        payload.lead_id = leadRes.data.leadId;
      } catch (err) {
        console.log('Failed registering quick lead:', err.message);
        throw new Error('Quick caller registration failed.');
      }
    }

    await logCallMutation.mutateAsync(payload);
  };

  if (isLoading) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <ActivityIndicator size="large" color="#F59E0B" />
        <Text className={`text-sm mt-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading Dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className={`flex-1 justify-center items-center px-6 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <Text className="text-red-500 text-sm font-semibold mb-2">Error Loading Dashboard</Text>
        <Text className={`text-xs text-center mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{error.message}</Text>
        <TouchableOpacity onPress={() => refetch()} className="bg-amber-500 px-6 py-3 rounded-xl">
          <Text className="text-white text-xs font-bold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { kpis, recentActivities, todaysFollowups } = data;

  const cardsList = [
    { label: 'Assigned Leads', value: kpis.assignedLeads || 0, color: '#64748B', bgTint: 'bg-slate-100', darkBgTint: 'bg-slate-800/50', Icon: Users },
    { label: 'Fresh/New Leads', value: kpis.freshLeads || 0, color: '#3B82F6', bgTint: 'bg-blue-100', darkBgTint: 'bg-blue-900/30', Icon: UserPlus },
    { label: 'Follow Ups', value: kpis.followUps || 0, color: '#F59E0B', bgTint: 'bg-amber-100', darkBgTint: 'bg-amber-900/30', Icon: Calendar },
    { label: 'Callback Leads', value: kpis.callbackLeads || 0, color: '#EAB308', bgTint: 'bg-yellow-100', darkBgTint: 'bg-yellow-900/30', Icon: PhoneForwarded },
    { label: 'Interested', value: kpis.interested || 0, color: '#10B981', bgTint: 'bg-emerald-100', darkBgTint: 'bg-emerald-900/30', Icon: ThumbsUp },
    { label: 'Closed/Won', value: kpis.closed || 0, color: '#14B8A6', bgTint: 'bg-teal-100', darkBgTint: 'bg-teal-900/30', Icon: CheckCircle2 },
    { label: 'Distributor Int.', value: kpis.distributorInterested || 0, color: '#8B5CF6', bgTint: 'bg-purple-100', darkBgTint: 'bg-purple-900/30', Icon: Briefcase },
    { label: 'Trader Int.', value: kpis.traderInterested || 0, color: '#6366F1', bgTint: 'bg-indigo-100', darkBgTint: 'bg-indigo-900/30', Icon: TrendingUp },
  ];

  return (
    <View className="flex-1">
      <OfflineBanner />
      <ScrollView
        className={isDark ? 'bg-slate-950' : 'bg-slate-50'}
        contentContainerStyle={{ paddingBottom: 100 }} // extra padding for floating navbar
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F59E0B']} />
        }
      >
        <View className="p-5 space-y-6">
          
          {/* KPI grid */}
          <View className="flex-row flex-wrap justify-between mt-1">
            {cardsList.map((card, idx) => {
              const Icon = card.Icon;
              return (
                <View
                  key={idx}
                  className={`w-[48%] p-4 mb-4 rounded-3xl shadow-sm ${
                    isDark ? 'bg-slate-900' : 'bg-white'
                  }`}
                  style={{ elevation: 2, shadowColor: card.color, shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }}
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className={`p-2.5 rounded-2xl ${isDark ? card.darkBgTint : card.bgTint}`}>
                      <Icon size={18} color={card.color} />
                    </View>
                  </View>
                  <Text className={`text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {card.value}
                  </Text>
                  <Text className={`text-[10px] uppercase font-bold tracking-wider mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {card.label}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Quick Call Widget */}
          <View className={`p-5 mb-2 rounded-3xl shadow-md ${isDark ? 'bg-slate-900' : 'bg-white'}`} style={{ shadowColor: '#F59E0B', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}>
            <View className="flex-row items-center mb-5">
              <View className="bg-amber-100 p-2 rounded-xl mr-3">
                <Smartphone size={20} color="#F59E0B" />
              </View>
              <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Quick Dialer
              </Text>
            </View>

            <View className="space-y-4">
              <TextInput
                className={`border rounded-2xl px-4 py-3.5 text-sm ${
                  isDark ? 'border-slate-800 bg-slate-950 text-white' : 'border-slate-200 bg-slate-50 text-slate-800'
                }`}
                placeholder="Customer Name (Optional)"
                placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                value={quickName}
                onChangeText={setQuickName}
              />
              <View className="flex-row justify-between items-center">
                <TextInput
                  className={`border rounded-2xl px-4 py-3.5 text-sm w-[68%] ${
                    isDark ? 'border-slate-800 bg-slate-950 text-white' : 'border-slate-200 bg-slate-50 text-slate-800'
                  }`}
                  placeholder="10-digit Mobile Number"
                  placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={quickPhone}
                  onChangeText={setQuickPhone}
                />
                <TouchableOpacity
                  onPress={handleQuickCall}
                  className="w-[28%] bg-amber-500 py-3.5 rounded-2xl flex-row justify-center items-center shadow-lg shadow-amber-500/30"
                >
                  <PhoneCall size={16} color="#FFFFFF" />
                  <Text className="text-white text-sm font-bold ml-2">Call</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Today's Follow Ups Widget */}
          <View className={`p-5 mb-2 rounded-3xl shadow-md ${isDark ? 'bg-slate-900' : 'bg-white'}`} style={{ shadowColor: '#10B981', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}>
            <View className="flex-row items-center mb-5">
              <View className="bg-emerald-100 p-2 rounded-xl mr-3">
                <CalendarClock size={20} color="#10B981" />
              </View>
              <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Today's Follow Ups
              </Text>
            </View>

            {todaysFollowups.length === 0 ? (
              <Text className={`text-sm text-center py-5 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Zero follow-ups scheduled for today. Good job!
              </Text>
            ) : (
              <View className="space-y-4">
                {todaysFollowups.map((item) => (
                  <View
                    key={item.id}
                    className={`p-4 rounded-2xl flex-row justify-between items-center ${
                      isDark ? 'bg-slate-950' : 'bg-slate-50'
                    }`}
                  >
                    <View className="flex-1 mr-3">
                      <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {item.lead_name}
                      </Text>
                      <Text className={`text-xs mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Time: {item.time} • {item.lead_mobile}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => triggerSimCall({ id: item.lead_id, name: item.lead_name, mobile: item.lead_mobile })}
                      className="bg-emerald-500 p-3 rounded-xl shadow-sm shadow-emerald-500/30"
                    >
                      <PhoneCall size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Recent Activity Widget */}
          <View className={`p-5 mb-2 rounded-3xl shadow-md ${isDark ? 'bg-slate-900' : 'bg-white'}`} style={{ shadowColor: '#3B82F6', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}>
            <View className="flex-row items-center mb-5">
              <View className="bg-blue-100 p-2 rounded-xl mr-3">
                <History size={20} color="#3B82F6" />
              </View>
              <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Recent Activity Logs
              </Text>
            </View>

            {recentActivities.length === 0 ? (
              <Text className={`text-sm text-center py-5 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                No calls logged yet. Start dialing!
              </Text>
            ) : (
              <View className="space-y-4">
                {recentActivities.map((activity) => (
                  <View
                    key={activity.id}
                    className={`p-4 rounded-2xl ${
                      isDark ? 'bg-slate-950' : 'bg-slate-50'
                    }`}
                  >
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {activity.lead_name}
                      </Text>
                      <Text className={`text-xs font-semibold text-slate-400`}>
                        {new Date(activity.created_at).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <View className="flex-row items-center mb-2">
                      <View className="bg-amber-100 px-2 py-1 rounded-md mr-2">
                        <Text className="text-xs text-amber-600 font-extrabold uppercase tracking-wider">
                          {activity.status}
                        </Text>
                      </View>
                      <Text className="text-xs text-slate-400 font-semibold">{activity.duration}s</Text>
                    </View>
                    <Text className={`text-xs font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`} numberOfLines={2}>
                      {activity.notes || 'No notes left.'}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

        </View>
      </ScrollView>

      {/* Call Logger Modal Popup */}
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
