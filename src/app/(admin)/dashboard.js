import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useThemeStore } from '../../store/themeStore';
import { TelecallerPerformanceChart, ConversionDonutChart } from '../../components/SvgCharts';
import OfflineBanner from '../../components/OfflineBanner';
import { RefreshCw, TrendingUp, CheckCircle, PhoneCall, Award, Users } from 'lucide-react-native';

export default function AdminDashboard() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: async () => {
      const response = await api.get('/reports/admin-dashboard');
      return response.data;
    }
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <ActivityIndicator size="large" color="#F59E0B" />
        <Text className={`text-sm mt-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading Dashboard Analytics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className={`flex-1 justify-center items-center px-6 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <Text className="text-red-500 text-sm font-semibold mb-2">Failed to load analytics</Text>
        <Text className={`text-xs text-center mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{error.message}</Text>
        <TouchableOpacity onPress={() => refetch()} className="bg-amber-500 px-6 py-3 rounded-xl">
          <Text className="text-white text-xs font-bold">Retry Load</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { kpis, performanceChart, conversionAnalytics, rankings } = data;

  const kpiItems = [
    { label: 'Total Leads', value: kpis.totalLeads || 0, color: 'border-slate-400', textColor: 'text-slate-500' },
    { label: 'Fresh Leads', value: kpis.freshLeads || 0, color: 'border-blue-400', textColor: 'text-blue-500' },
    { label: 'Assigned Leads', value: kpis.assignedLeads || 0, color: 'border-indigo-400', textColor: 'text-indigo-500' },
    { label: 'Interested', value: kpis.interestedLeads || 0, color: 'border-emerald-400', textColor: 'text-emerald-500' },
    { label: 'Follow Ups', value: kpis.followUpLeads || 0, color: 'border-amber-400', textColor: 'text-amber-500' },
    { label: 'Callbacks', value: kpis.callbackLeads || 0, color: 'border-yellow-400', textColor: 'text-yellow-600' },
    { label: 'Closed Leads', value: kpis.closedLeads || 0, color: 'border-teal-400', textColor: 'text-teal-600' },
    { label: 'Not Connected', value: kpis.notConnectedLeads || 0, color: 'border-rose-400', textColor: 'text-rose-500' },
    { label: 'Distributor Int.', value: kpis.distributorInterestedLeads || 0, color: 'border-purple-400', textColor: 'text-purple-500' },
    { label: 'Trader Int.', value: kpis.traderInterestedLeads || 0, color: 'border-violet-400', textColor: 'text-violet-500' },
  ];

  const formatTalkTime = (seconds) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <View className="flex-1">
      <OfflineBanner />
      <ScrollView
        className={isDark ? 'bg-slate-950' : 'bg-slate-50'}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F59E0B']} />
        }
      >
        <View className="p-4 space-y-6">
          
          {/* Header row */}
          <View className="flex-row justify-between items-center mt-2">
            <View>
              <Text className={`text-xs uppercase font-extrabold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Overview Metrics
              </Text>
              <Text className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>
                OilFlow Statistics
              </Text>
            </View>
            <TouchableOpacity onPress={() => refetch()} className={`p-2 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
              <RefreshCw size={16} color="#F59E0B" />
            </TouchableOpacity>
          </View>

          {/* KPI Card grid */}
          <View className="flex-row flex-wrap justify-between">
            {kpiItems.map((kpi, idx) => (
              <View
                key={idx}
                className={`w-[48%] p-3.5 mb-3 rounded-2xl border-l-[6px] shadow-sm ${
                  isDark ? 'bg-slate-900 border-t border-r border-b border-slate-800' : 'bg-white border-t border-r border-b border-slate-100'
                } ${kpi.color}`}
              >
                <Text className={`text-xxs uppercase tracking-wider font-extrabold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {kpi.label}
                </Text>
                <Text className={`text-xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {kpi.value}
                </Text>
              </View>
            ))}
          </View>

          {/* Conversion Analytics Card */}
          <View className={`p-4 rounded-3xl shadow-sm border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <View className="flex-row items-center mb-4">
              <TrendingUp size={18} color="#F59E0B" />
              <Text className={`text-sm font-bold ml-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Conversion Analytics
              </Text>
            </View>

            <ConversionDonutChart
              connected={conversionAnalytics.connectedCalls}
              notConnected={conversionAnalytics.notConnectedCalls}
              conversionRate={conversionAnalytics.conversionRate}
              isDark={isDark}
            />

            {/* Sub-KPI Row */}
            <View className="flex-row justify-between border-t border-slate-700/10 pt-4 mt-2">
              <View className="items-center w-[30%]">
                <Text className={`text-[10px] uppercase font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Avg Duration</Text>
                <Text className={`text-sm font-black mt-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {formatTalkTime(conversionAnalytics.avgTalkTime)}
                </Text>
              </View>
              <View className="items-center w-[30%]">
                <Text className={`text-[10px] uppercase font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Connected</Text>
                <Text className={`text-sm font-black mt-1 text-emerald-500`}>
                  {conversionAnalytics.connectedCalls}
                </Text>
              </View>
              <View className="items-center w-[30%]">
                <Text className={`text-[10px] uppercase font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Not Connected</Text>
                <Text className={`text-sm font-black mt-1 text-red-500`}>
                  {conversionAnalytics.notConnectedCalls}
                </Text>
              </View>
            </View>
          </View>

          {/* Telecaller Performance Chart Card */}
          <View className={`p-4 rounded-3xl shadow-sm border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <View className="flex-row items-center mb-4">
              <Users size={18} color="#F59E0B" />
              <Text className={`text-sm font-bold ml-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Telecaller Team Performance
              </Text>
            </View>
            <TelecallerPerformanceChart data={performanceChart} isDark={isDark} />
          </View>

          {/* Rankings Widget */}
          <View className={`p-4 rounded-3xl shadow-sm border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <View className="flex-row items-center mb-4">
              <Award size={18} color="#F59E0B" />
              <Text className={`text-sm font-bold ml-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Performance Rankings
              </Text>
            </View>

            <View className="space-y-3.5">
              <View className="flex-row justify-between items-center p-3 rounded-xl bg-slate-500/5 border border-slate-500/10">
                <View className="flex-row items-center">
                  <PhoneCall size={16} color="#3B82F6" />
                  <Text className={`text-xs font-semibold ml-2.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Top Performer (Most Calls)</Text>
                </View>
                <Text className={`text-xs font-extrabold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {rankings.topPerformer}
                </Text>
              </View>

              <View className="flex-row justify-between items-center p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <View className="flex-row items-center">
                  <CheckCircle size={16} color="#10B981" />
                  <Text className={`text-xs font-semibold ml-2.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Top Closer (Leads Closed)</Text>
                </View>
                <Text className={`text-xs font-extrabold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {rankings.topCloser}
                </Text>
              </View>

              <View className="flex-row justify-between items-center p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
                <View className="flex-row items-center">
                  <Award size={16} color="#8B5CF6" />
                  <Text className={`text-xs font-semibold ml-2.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Top Telecaller (Interested)</Text>
                </View>
                <Text className={`text-xs font-extrabold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {rankings.topTelecaller}
                </Text>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}
