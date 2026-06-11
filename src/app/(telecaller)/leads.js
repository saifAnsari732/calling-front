import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Search, MapPin, Briefcase, CalendarClock, ChevronRight } from 'lucide-react-native';
import OfflineBanner from '../../components/OfflineBanner';
import { useRouter } from 'expo-router';

export default function TelecallerLeads() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [businessTypeFilter, setBusinessTypeFilter] = useState('');

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
      case 'Fresh Lead': return 'bg-blue-50 text-blue-600 border border-blue-200';
      case 'Assigned': return 'bg-indigo-50 text-indigo-600 border border-indigo-200';
      case 'Follow Up': return 'bg-amber-50 text-amber-600 border border-amber-200';
      case 'Callback': return 'bg-yellow-50 text-yellow-600 border border-yellow-200';
      case 'Interested': return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
      case 'Distributor Interested': return 'bg-purple-50 text-purple-600 border border-purple-200';
      case 'Trader Interested': return 'bg-pink-50 text-pink-600 border border-pink-200';
      case 'Closed': return 'bg-teal-50 text-teal-600 border border-teal-200';
      default: return 'bg-slate-100 text-slate-600 border border-slate-300';
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <OfflineBanner />

      {/* Header Search Filter Box */}
      <View className="p-5 border-b border-slate-200 bg-white shadow-sm shadow-slate-100">
        
        <View className="mb-4">
          <Text className="text-slate-900 text-3xl font-black tracking-tight">Leads</Text>
          <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Manage & Engage</Text>
        </View>

        <View className="flex-row items-center border rounded-2xl px-4 py-3 border-slate-200 bg-slate-50">
          <Search size={18} color="#64748B" />
          <TextInput
            className="flex-1 ml-3 text-sm py-1 text-slate-800 font-medium"
            placeholder="Search by Name, City, Product..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Badges */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-4"
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
                className={`px-4 py-2 rounded-xl border mr-3 ${
                  isSelected 
                    ? 'bg-[#3B82F6] border-transparent shadow-md shadow-blue-500/30' 
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <Text className={`text-xs font-bold tracking-wide ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Leads List */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#3B82F6" className="py-20" />
      ) : error ? (
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-red-500 text-base font-bold mb-2">Error loading leads</Text>
          <Text className="text-xs text-slate-500 mb-6">{error.message}</Text>
          <TouchableOpacity onPress={() => refetch()} className="bg-[#3B82F6] px-8 py-3 rounded-2xl shadow-md shadow-blue-500/30">
            <Text className="text-white text-sm font-bold">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : data?.leads?.length === 0 ? (
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-sm text-center text-slate-500 font-bold uppercase tracking-widest">
            No leads found matching criteria.
          </Text>
        </View>
      ) : (
        <FlatList
          data={data.leads}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" colors={['#3B82F6']} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/lead/${item.id}`)}
              className="mb-4 p-5 rounded-[28px] border border-slate-100 bg-white shadow-sm shadow-slate-200 flex-row items-center justify-between"
              activeOpacity={0.8}
            >
              <View className="flex-1 mr-3">
                {/* Header row */}
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-lg font-black flex-1 mr-3 text-slate-800 tracking-wide">
                    {item.name}
                  </Text>
                  <View className={`px-2.5 py-1 rounded-xl ${getStatusColor(item.status)}`}>
                    <Text className="text-[10px] font-black uppercase tracking-widest">
                      {item.status}
                    </Text>
                  </View>
                </View>

                {/* Sub details */}
                <Text className="text-xs font-bold uppercase tracking-widest mb-3 text-slate-500">
                  {item.mobile} • {item.lead_source}
                </Text>

                {/* Info grids */}
                <View className="flex-row flex-wrap border-t border-slate-100 pt-3 space-y-1.5">
                  <View className="flex-row items-center w-[48%] mb-1">
                    <MapPin size={12} color="#94A3B8" />
                    <Text className="text-[11px] text-slate-500 font-medium ml-2" numberOfLines={1}>
                      {item.city || 'N/A'}, {item.state || 'N/A'}
                    </Text>
                  </View>
                  <View className="flex-row items-center w-[48%] mb-1">
                    <Briefcase size={12} color="#94A3B8" />
                    <Text className="text-[11px] text-slate-500 font-medium ml-2" numberOfLines={1}>
                      {item.business_type || 'N/A'}
                    </Text>
                  </View>
                  
                  {item.product_interest && (
                    <View className="flex-row items-center w-full mt-1.5">
                      <CalendarClock size={12} color="#94A3B8" />
                      <Text className="text-[11px] text-slate-500 font-medium ml-2" numberOfLines={1}>
                        Interest: {item.product_interest}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View className="bg-slate-50 p-2 rounded-full border border-slate-200">
                <ChevronRight size={20} color="#64748B" />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
