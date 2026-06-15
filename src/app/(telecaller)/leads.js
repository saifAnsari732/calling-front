import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl, Linking, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Search, MapPin, Briefcase, CalendarClock, ChevronRight, Phone } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
      case 'Fresh Lead': return 'bg-blue-50/80 text-blue-600 border border-blue-200/50';
      case 'Assigned': return 'bg-indigo-50/80 text-indigo-600 border border-indigo-200/50';
      case 'Follow Up': return 'bg-amber-50/80 text-amber-600 border border-amber-200/50';
      case 'Callback': return 'bg-yellow-50/80 text-yellow-600 border border-yellow-200/50';
      case 'Interested': return 'bg-emerald-50/80 text-emerald-600 border border-emerald-200/50';
      case 'Distributor Interested': return 'bg-purple-50/80 text-purple-600 border border-purple-200/50';
      case 'Trader Interested': return 'bg-pink-50/80 text-pink-600 border border-pink-200/50';
      case 'Closed': return 'bg-teal-50/80 text-teal-600 border border-teal-200/50';
      default: return 'bg-slate-50/80 text-slate-500 border border-slate-200/50';
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <LinearGradient
        colors={['#EEF2FF', '#F8FAFC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 250 }}
      />
      <OfflineBanner />

      {/* Header Search Filter Box */}
      <View className="pt-6 pb-4 px-5 bg-white/80 shadow-sm shadow-indigo-100/50 border-b border-indigo-50/50">
        <View className="mb-5 mt-2">
          <Text className="text-[34px] font-black text-slate-900 tracking-tight">Leads</Text>
          <Text className="text-slate-500 text-[11px] font-extrabold uppercase tracking-[0.2em] mt-1">Manage & Engage</Text>
        </View>

        <View className="flex-row items-center border-[1.5px] rounded-[20px] px-4 py-3.5 border-slate-200/80 bg-white shadow-sm shadow-slate-100">
          <Search size={20} color="#94A3B8" strokeWidth={2.5} />
          <TextInput
            className="flex-1 ml-3 text-[15px] py-1 text-slate-800 font-bold tracking-wide"
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
          className="mt-5"
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
                className={`px-5 py-2.5 rounded-[16px] border-[1.5px] mr-3 ${
                  isSelected 
                    ? 'bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-500/30' 
                    : 'border-slate-200 bg-white shadow-sm shadow-slate-100'
                }`}
              >
                <Text className={`text-[13px] font-black tracking-wide ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Leads List */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#4F46E5" className="py-20" />
      ) : error ? (
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-red-500 text-base font-bold mb-2">Error loading leads</Text>
          <Text className="text-xs text-slate-500 mb-6">{error.message}</Text>
          <TouchableOpacity onPress={() => refetch()} className="bg-[#4F46E5] px-8 py-3 rounded-2xl shadow-md shadow-indigo-500/30">
            <Text className="text-white text-sm font-bold">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : data?.leads?.length === 0 ? (
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-[13px] text-center text-slate-400 font-black uppercase tracking-widest">
            No leads found
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" colors={['#4F46E5']} />
          }
          renderItem={({ item }) => (
            <View
              className="mb-4 p-5 rounded-[28px] border-[1.5px] border-slate-100/80 bg-white shadow-md shadow-indigo-100/40 flex-row items-center justify-between"
            >
              <TouchableOpacity
                onPress={() => router.push(`/lead/${item.id}`)}
                className="flex-1 mr-3"
                activeOpacity={0.7}
              >
                {/* Header row */}
                <View className="flex-row justify-between items-start mb-2.5">
                  <Text className="text-[18px] font-black flex-1 mr-3 text-slate-900 tracking-tight leading-tight">
                    {item.name}
                  </Text>
                  <View className={`px-2.5 py-1 rounded-[10px] ${getStatusColor(item.status)}`}>
                    <Text className="text-[10px] font-black uppercase tracking-widest">
                      {item.status}
                    </Text>
                  </View>
                </View>

                {/* Sub details */}
                <Text className="text-[12px] font-bold uppercase tracking-[0.1em] mb-4 text-slate-400">
                  <Text className="text-slate-600">{item.mobile}</Text> • {item.lead_source}
                </Text>

                {/* Info grids */}
                <View className="flex-row flex-wrap border-t-[1.5px] border-slate-50 pt-3 space-y-1.5">
                  <View className="flex-row items-center w-[48%] mb-1">
                    <MapPin size={14} color="#94A3B8" strokeWidth={2.5} />
                    <Text className="text-[12px] text-slate-500 font-bold ml-2" numberOfLines={1}>
                      {item.city || 'N/A'}, {item.state || 'N/A'}
                    </Text>
                  </View>
                  <View className="flex-row items-center w-[48%] mb-1">
                    <Briefcase size={14} color="#94A3B8" strokeWidth={2.5} />
                    <Text className="text-[12px] text-slate-500 font-bold ml-2" numberOfLines={1}>
                      {item.business_type || 'N/A'}
                    </Text>
                  </View>
                  
                  {item.product_interest && (
                    <View className="flex-row items-center w-full mt-2 bg-slate-50/50 p-2 rounded-xl">
                      <CalendarClock size={14} color="#4F46E5" strokeWidth={2.5} />
                      <Text className="text-[12px] text-indigo-600 font-bold ml-2" numberOfLines={1}>
                        Interest: {item.product_interest}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => {
                    const telUrl = `tel:${item.mobile}`;
                    Linking.openURL(telUrl).catch((err) => {
                      console.log('Call error:', err);
                      Alert.alert('Unavailable', 'Calling is not supported or permission denied on this device.');
                    });
                  }}
                  className="bg-emerald-50 p-2.5 rounded-[14px] mr-2"
                  activeOpacity={0.7}
                >
                  <Phone size={20} color="#10B981" strokeWidth={3} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push(`/lead/${item.id}`)}
                  className="bg-indigo-50 p-2.5 rounded-[14px]"
                  activeOpacity={0.7}
                >
                  <ChevronRight size={20} color="#4F46E5" strokeWidth={3} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
