import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, TextInput, Linking, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { PhoneCall, CalendarClock, History, Smartphone, Users, UserPlus, Calendar, PhoneForwarded, ThumbsUp, CheckCircle2, Briefcase, TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import OfflineBanner from '../../components/OfflineBanner';
import CallModal from '../../components/CallModal';

export default function TelecallerDashboard() {
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

  const triggerSimCall = (lead) => {
    if (!lead || !lead.mobile) return;
    setCallStartTime(new Date().toISOString());
    setSelectedLeadForCall(lead);

    const telUrl = `tel:${lead.mobile}`;
    Linking.openURL(telUrl)
      .then(() => setCallModalVisible(true))
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
    const dummyLead = { id: 'QUICK', name: quickName.trim() || 'Quick Call Lead', mobile: quickPhone };
    triggerSimCall(dummyLead);
    setQuickPhone('');
    setQuickName('');
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

    if (loggedDetails.lead_id === 'QUICK') {
      try {
        const leadRes = await api.post('/leads', {
          name: quickName.trim() || 'Quick Call Customer',
          mobile: quickPhone,
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
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-sm mt-3 text-slate-500 font-semibold tracking-wider uppercase">Loading Dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center px-6 bg-slate-50">
        <Text className="text-red-500 text-base font-bold mb-2">Error Loading Dashboard</Text>
        <Text className="text-sm text-center mb-6 text-slate-500">{error.message}</Text>
        <TouchableOpacity onPress={() => refetch()} className="bg-[#3B82F6] px-8 py-3 rounded-2xl shadow-lg shadow-[#3B82F6]/30">
          <Text className="text-white text-sm font-bold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { kpis, recentActivities, todaysFollowups } = data;

  const cardsList = [
    { label: 'Assigned Leads', value: kpis.assignedLeads || 0, color: '#3B82F6', bgTint: 'bg-blue-50', Icon: Users },
    { label: 'Fresh/New', value: kpis.freshLeads || 0, color: '#8B5CF6', bgTint: 'bg-purple-50', Icon: UserPlus },
    { label: 'Follow Ups', value: kpis.followUps || 0, color: '#F59E0B', bgTint: 'bg-amber-50', Icon: Calendar },
    { label: 'Callbacks', value: kpis.callbackLeads || 0, color: '#EAB308', bgTint: 'bg-yellow-50', Icon: PhoneForwarded },
    { label: 'Interested', value: kpis.interested || 0, color: '#10B981', bgTint: 'bg-emerald-50', Icon: ThumbsUp },
    { label: 'Closed/Won', value: kpis.closed || 0, color: '#14B8A6', bgTint: 'bg-teal-50', Icon: CheckCircle2 },
    { label: 'Distributor Int.', value: kpis.distributorInterested || 0, color: '#6366F1', bgTint: 'bg-indigo-50', Icon: Briefcase },
    { label: 'Trader Int.', value: kpis.traderInterested || 0, color: '#EC4899', bgTint: 'bg-pink-50', Icon: TrendingUp },
  ];

  return (
    <View className="flex-1 bg-slate-50">
      <LinearGradient
        colors={['#EEF2FF', '#F8FAFC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 250 }}
      />
      <OfflineBanner />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" colors={['#3B82F6']} />}
      >
        <View className="p-5 space-y-6 pt-6">
          
          {/* Header */}
          <View className="mb-2">
            <Text className="text-slate-900 text-3xl font-black tracking-tight">Overview</Text>
            <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Your Performance Matrix</Text>
          </View>

          {/* KPI grid */}
          <View className="flex-row flex-wrap justify-between mt-1">
            {cardsList.map((card, idx) => {
              const Icon = card.Icon;
              return (
                <View
                  key={idx}
                  className="w-[48%] p-5 mb-4 rounded-[28px] bg-white border border-slate-100 shadow-sm shadow-indigo-100/30"
                >
                  <View className="flex-row justify-between items-start mb-3">
                    <View className={`p-3 rounded-2xl ${card.bgTint}`}>
                      <Icon size={20} color={card.color} strokeWidth={2.5} />
                    </View>
                  </View>
                  <Text className="text-3xl font-black text-slate-900 tracking-tight">
                    {card.value}
                  </Text>
                  <Text className="text-[11px] uppercase font-bold tracking-widest mt-1 text-slate-500">
                    {card.label}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Quick Call Widget */}
          <View className="p-6 mb-2 rounded-[32px] bg-white border border-emerald-50 relative overflow-hidden shadow-lg shadow-emerald-100/40">
            <View className="flex-row items-center mb-6">
              <View className="bg-emerald-100/50 p-2.5 rounded-2xl mr-4">
                <Smartphone size={22} color="#10B981" strokeWidth={2.5} />
              </View>
              <Text className="text-[20px] font-black text-slate-800 tracking-wide">
                Quick Dialer
              </Text>
            </View>

            <View className="space-y-4">
              <TextInput
                className="border-[1.5px] border-emerald-100/50 bg-emerald-50/30 rounded-2xl px-5 py-4 text-sm text-slate-800 font-bold"
                placeholder="Customer Name (Optional)"
                placeholderTextColor="#94A3B8"
                value={quickName}
                onChangeText={setQuickName}
              />
              
              <TextInput
                className="border-[1.5px] border-emerald-100/50 bg-emerald-50/30 rounded-2xl px-5 py-5 text-lg text-slate-800 font-black tracking-[0.3em] text-center"
                placeholder="0000000000"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                maxLength={10}
                value={quickPhone}
                onChangeText={setQuickPhone}
              />

              <TouchableOpacity
                onPress={handleQuickCall}
                className="w-full rounded-2xl shadow-xl shadow-emerald-500/40 mt-2 overflow-hidden"
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ paddingVertical: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
                >
                  <PhoneCall size={20} color="#FFFFFF" strokeWidth={2.5} />
                  <Text className="text-white text-[15px] font-black ml-3 uppercase tracking-widest">Dial Now</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Today's Follow Ups Widget */}
          <View className="p-6 mb-2 rounded-[32px] bg-white border border-slate-100 shadow-sm shadow-indigo-100/30">
            <View className="flex-row items-center mb-6">
              <View className="bg-blue-100/50 p-2.5 rounded-2xl mr-4">
                <CalendarClock size={22} color="#3B82F6" strokeWidth={2.5} />
              </View>
              <Text className="text-[20px] font-black text-slate-800 tracking-wide">
                Today's Follow Ups
              </Text>
            </View>

            {todaysFollowups.length === 0 ? (
              <Text className="text-xs text-center py-6 font-bold uppercase tracking-wider text-slate-400">
                Zero follow-ups scheduled for today
              </Text>
            ) : (
              <View className="space-y-3">
                {todaysFollowups.map((item) => (
                  <View
                    key={item.id}
                    className="p-4 rounded-[20px] flex-row justify-between items-center bg-slate-50 border border-slate-100/60"
                  >
                    <View className="flex-1 mr-3">
                      <Text className="text-[15px] font-black text-slate-800 mb-1 tracking-wide">
                        {item.lead_name}
                      </Text>
                      <Text className="text-[11px] font-bold text-slate-400 tracking-wider">
                        {item.time} • {item.lead_mobile}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => triggerSimCall({ id: item.lead_id, name: item.lead_name, mobile: item.lead_mobile })}
                      className="bg-[#3B82F6] shadow-md shadow-blue-500/30 p-3.5 rounded-2xl"
                    >
                      <PhoneCall size={20} color="#FFFFFF" strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Recent Activity Widget */}
          <View className="p-6 mb-2 rounded-[32px] bg-white border border-slate-100 shadow-sm shadow-slate-200">
            <View className="flex-row items-center mb-6">
              <View className="bg-purple-50 p-2.5 rounded-2xl mr-4 border border-purple-100">
                <History size={22} color="#8B5CF6" />
              </View>
              <Text className="text-lg font-black text-slate-800 tracking-wide">
                Recent Activity
              </Text>
            </View>

            {recentActivities.length === 0 ? (
              <Text className="text-xs text-center py-6 font-bold uppercase tracking-wider text-slate-400">
                No calls logged yet
              </Text>
            ) : (
              <View className="space-y-3">
                {recentActivities.map((activity) => (
                  <View
                    key={activity.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-100"
                  >
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="text-sm font-bold text-slate-800">
                        {activity.lead_name}
                      </Text>
                      <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {new Date(activity.created_at).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <View className="flex-row items-center mb-2.5">
                      <View className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg mr-3 shadow-sm">
                        <Text className="text-[10px] text-slate-600 font-black uppercase tracking-widest">
                          {activity.status}
                        </Text>
                      </View>
                      <Text className="text-xs text-[#8B5CF6] font-black">{activity.duration}s</Text>
                    </View>
                    <Text className="text-xs font-medium leading-relaxed text-slate-500" numberOfLines={2}>
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
          isDark={false}
        />
      )}
    </View>
  );
}
