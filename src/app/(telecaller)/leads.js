import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useThemeStore } from '../../store/themeStore';
import { Search, Filter, MapPin, Briefcase, CalendarClock, ChevronRight, PhoneCall } from 'lucide-react-native';
import OfflineBanner from '../../components/OfflineBanner';
import { useRouter } from 'expo-router';

export default function TelecallerLeads() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [businessTypeFilter, setBusinessTypeFilter] = useState('');

  // Fetch only assigned leads for the logged-in telecaller (handled by backend filtering `assigned_to_id = req.user.id`)
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['telecallerLeadsList', searchQuery, statusFilter, businessTypeFilter],
    queryFn: async () => {
      const response = await api.get('/leads', {
        params: {
          query: searchQuery || undefined,
          status: statusFilter || undefined,
          business_type: businessTypeFilter || undefined
        }
      });
      return response.data;
    }
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Fresh Lead': return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
      case 'Assigned': return 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20';
      case 'Follow Up': return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      case 'Callback': return 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20';
      case 'Interested': return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'Distributor Interested': return 'bg-purple-500/10 text-purple-500 border border-purple-500/20';
      case 'Trader Interested': return 'bg-violet-500/10 text-violet-500 border border-violet-500/20';
      case 'Closed': return 'bg-teal-500/10 text-teal-600 border border-teal-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border border-slate-500/20';
    }
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <OfflineBanner />

      {/* Header Search Filter Box */}
      <View className={`p-4 border-b ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <View className={`flex-row items-center border rounded-xl px-3 py-2.5 ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
          <Search size={16} color="#64748B" />
          <TextInput
            className={`flex-1 ml-2 text-xs py-0.5 ${isDark ? 'text-white' : 'text-slate-800'}`}
            placeholder="Search my leads by Name, City, Product..."
            placeholderTextColor="#475569"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Badges */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3.5"
          data={[
            { label: 'All', value: '' },
            { label: 'Assigned', value: 'Assigned' },
            { label: 'Follow Up', value: 'Follow Up' },
            { label: 'Callback', value: 'Callback' },
            { label: 'Interested', value: 'Interested' },
            { label: 'Distributor Int.', value: 'Distributor Interested' },
            { label: 'Trader Int.', value: 'Trader Interested' },
            { label: 'Closed', value: 'Closed' }
          ]}
          keyExtractor={(item) => item.label}
          renderItem={({ item }) => {
            const isSelected = statusFilter === item.value;
            return (
              <TouchableOpacity
                onPress={() => setStatusFilter(item.value)}
                className={`px-3.5 py-1.5 rounded-lg border mr-2 ${
                  isSelected 
                    ? 'bg-amber-500 border-transparent' 
                    : isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-300 bg-slate-50'
                }`}
              >
                <Text className={`text-[10px] font-bold ${isSelected ? 'text-white' : isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Leads List */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#F59E0B" className="py-20" />
      ) : error ? (
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-red-500 text-sm font-semibold mb-2">Error loading leads</Text>
          <Text className="text-xs text-slate-500 mb-6">{error.message}</Text>
          <TouchableOpacity onPress={() => refetch()} className="bg-amber-500 px-6 py-3 rounded-xl">
            <Text className="text-white text-xs font-bold">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : data?.leads?.length === 0 ? (
        <View className="flex-1 justify-center items-center p-6">
          <Text className={`text-sm text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            No assigned leads found matching criteria.
          </Text>
        </View>
      ) : (
        <FlatList
          data={data.leads}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F59E0B']} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/lead/${item.id}`)}
              className={`mb-3.5 p-4 rounded-3xl border shadow-sm flex-row items-center justify-between ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
              }`}
              activeOpacity={0.8}
            >
              <View className="flex-1 mr-2">
                {/* Header row */}
                <View className="flex-row justify-between items-center mb-1.5">
                  <Text className={`text-sm font-bold flex-1 mr-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {item.name}
                  </Text>
                  <Text className={`text-[9px] px-2 py-0.5 font-bold uppercase rounded-full ${getStatusColor(item.status)}`}>
                    {item.status}
                  </Text>
                </View>

                {/* Sub details */}
                <Text className={`text-xxs font-semibold uppercase tracking-wider mb-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Mobile: {item.mobile} • Source: {item.lead_source}
                </Text>

                {/* Info grids */}
                <View className="flex-row flex-wrap border-t border-slate-500/5 pt-2.5 space-y-1">
                  <View className="flex-row items-center w-[48%] mb-1">
                    <MapPin size={11} color="#64748B" />
                    <Text className="text-[10px] text-slate-500 ml-1.5" numberOfLines={1}>
                      {item.city || 'N/A'}, {item.state || 'N/A'}
                    </Text>
                  </View>
                  <View className="flex-row items-center w-[48%] mb-1">
                    <Briefcase size={11} color="#64748B" />
                    <Text className="text-[10px] text-slate-500 ml-1.5" numberOfLines={1}>
                      {item.business_type || 'N/A'}
                    </Text>
                  </View>
                  
                  {item.product_interest && (
                    <View className="flex-row items-center w-full mt-1">
                      <CalendarClock size={11} color="#64748B" />
                      <Text className="text-[10px] text-slate-500 ml-1.5" numberOfLines={1}>
                        Interest: {item.product_interest}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <ChevronRight size={16} color={isDark ? '#475569' : '#CBD5E1'} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
