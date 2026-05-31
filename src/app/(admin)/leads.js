import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, FlatList } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useThemeStore } from '../../store/themeStore';
import { Plus, Filter, CheckSquare, Square, UserCheck, RefreshCw, Search, ChevronRight, MapPin, Briefcase } from 'lucide-react-native';
import OfflineBanner from '../../components/OfflineBanner';
import { useRouter } from 'expo-router';

export default function AdminLeads() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const router = useRouter();

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [businessTypeFilter, setBusinessTypeFilter] = useState('');
  
  // Selection / Bulk state
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [targetCaller, setTargetCaller] = useState('');

  // Add Lead Modal state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [businessType, setBusinessType] = useState('Trader');
  const [productInterest, setProductInterest] = useState('');
  const [formError, setFormError] = useState('');

  // 1. Fetch leads
  const { data: leadsData, isLoading: leadsLoading, refetch: refetchLeads } = useQuery({
    queryKey: ['adminLeadsList', statusFilter, businessTypeFilter, searchQuery],
    queryFn: async () => {
      const response = await api.get('/leads', {
        params: {
          status: statusFilter || undefined,
          business_type: businessTypeFilter || undefined,
          query: searchQuery || undefined
        }
      });
      return response.data;
    }
  });

  // 2. Fetch active telecallers (for assignment dropdown)
  const { data: callersData } = useQuery({
    queryKey: ['activeCallersList'],
    queryFn: async () => {
      const response = await api.get('/telecallers');
      // Filter out disabled ones
      return response.data.telecallers.filter(c => c.status === 'active');
    }
  });

  // Mutations
  const createLeadMutation = useMutation({
    mutationFn: (leadDetails) => api.post('/leads', leadDetails),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['adminLeadsList'] });
      closeAddModal();
      const details = res.data.distribution?.assigned 
        ? `Auto-assigned to ${res.data.distribution.caller.name}.`
        : 'Saved as unassigned.';
      Alert.alert('Lead Created', `Lead created successfully. ${details}`);
    },
    onError: (err) => {
      setFormError(err.response?.data?.error || 'Failed to create lead.');
    }
  });

  const bulkAssignMutation = useMutation({
    mutationFn: ({ leadIds, telecallerId }) => api.post('/leads/bulk-assign', { leadIds, telecallerId }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['adminLeadsList'] });
      setSelectedLeads([]);
      setBulkModalVisible(false);
      Alert.alert('Success', res.data.message || 'Leads reassigned successfully.');
    },
    onError: (err) => {
      Alert.alert('Error', err.response?.data?.error || 'Reassignment failed.');
    }
  });

  // Add Lead helpers
  const openAddModal = () => {
    setName('');
    setMobile('');
    setEmail('');
    setCity('');
    setState('');
    setBusinessType('Trader');
    setProductInterest('');
    setFormError('');
    setAddModalVisible(true);
  };

  const closeAddModal = () => {
    setAddModalVisible(false);
  };

  const handleCreateLead = () => {
    setFormError('');
    if (!name || !mobile) {
      setFormError('Name and mobile number are mandatory.');
      return;
    }

    createLeadMutation.mutate({
      name,
      mobile,
      email: email || undefined,
      city,
      state,
      business_type: businessType,
      product_interest: productInterest,
      lead_source: 'Manual Entry'
    });
  };

  // Selection helpers
  const toggleSelectLead = (leadId) => {
    if (selectedLeads.includes(leadId)) {
      setSelectedLeads(selectedLeads.filter(id => id !== leadId));
    } else {
      setSelectedLeads([...selectedLeads, leadId]);
    }
  };

  const toggleSelectAll = () => {
    if (leadsData?.leads) {
      if (selectedLeads.length === leadsData.leads.length) {
        setSelectedLeads([]);
      } else {
        setSelectedLeads(leadsData.leads.map(l => l.id));
      }
    }
  };

  const handleBulkReassign = () => {
    if (selectedLeads.length === 0) {
      Alert.alert('No Selection', 'Please select at least one lead to reassign.');
      return;
    }
    setTargetCaller('');
    setBulkModalVisible(true);
  };

  const submitBulkReassign = () => {
    if (!targetCaller) {
      Alert.alert('Error', 'Please select a telecaller.');
      return;
    }
    bulkAssignMutation.mutate({
      leadIds: selectedLeads,
      telecallerId: targetCaller
    });
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
      
      {/* Top Search bar and Actions */}
      <View className={`p-4 border-b ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <View className="flex-row justify-between items-center mb-3">
          <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Leads Manager</Text>
          <TouchableOpacity onPress={openAddModal} className="bg-amber-500 flex-row items-center px-3.5 py-2 rounded-xl">
            <Plus size={14} color="#FFFFFF" />
            <Text className="text-white text-xs font-bold ml-1">New Lead</Text>
          </TouchableOpacity>
        </View>

        {/* Search input */}
        <View className={`flex-row items-center border rounded-xl px-3 py-2 ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
          <Search size={16} color="#64748B" />
          <TextInput
            className={`flex-1 ml-2 text-xs py-0.5 ${isDark ? 'text-white' : 'text-slate-800'}`}
            placeholder="Search by Customer, Mobile, City, State..."
            placeholderTextColor="#475569"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Quick pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mt-3.5 pt-0.5">
          <TouchableOpacity 
            onPress={() => setStatusFilter(statusFilter === 'Fresh Lead' ? '' : 'Fresh Lead')}
            className={`px-3 py-1.5 rounded-lg border mr-2 ${statusFilter === 'Fresh Lead' ? 'bg-blue-500 border-transparent' : isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-300 bg-slate-50'}`}
          >
            <Text className={`text-[10px] font-bold ${statusFilter === 'Fresh Lead' ? 'text-white' : isDark ? 'text-slate-300' : 'text-slate-700'}`}>Fresh</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setStatusFilter(statusFilter === 'Assigned' ? '' : 'Assigned')}
            className={`px-3 py-1.5 rounded-lg border mr-2 ${statusFilter === 'Assigned' ? 'bg-indigo-500 border-transparent' : isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-300 bg-slate-50'}`}
          >
            <Text className={`text-[10px] font-bold ${statusFilter === 'Assigned' ? 'text-white' : isDark ? 'text-slate-300' : 'text-slate-700'}`}>Assigned</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setStatusFilter(statusFilter === 'Follow Up' ? '' : 'Follow Up')}
            className={`px-3 py-1.5 rounded-lg border mr-2 ${statusFilter === 'Follow Up' ? 'bg-amber-500 border-transparent' : isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-300 bg-slate-50'}`}
          >
            <Text className={`text-[10px] font-bold ${statusFilter === 'Follow Up' ? 'text-white' : isDark ? 'text-slate-300' : 'text-slate-700'}`}>Follow Up</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setStatusFilter(statusFilter === 'Closed' ? '' : 'Closed')}
            className={`px-3 py-1.5 rounded-lg border mr-2 ${statusFilter === 'Closed' ? 'bg-teal-500 border-transparent' : isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-300 bg-slate-50'}`}
          >
            <Text className={`text-[10px] font-bold ${statusFilter === 'Closed' ? 'text-white' : isDark ? 'text-slate-300' : 'text-slate-700'}`}>Closed</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setBusinessTypeFilter(businessTypeFilter === 'Distributor' ? '' : 'Distributor')}
            className={`px-3 py-1.5 rounded-lg border mr-2 ${businessTypeFilter === 'Distributor' ? 'bg-purple-500 border-transparent' : isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-300 bg-slate-50'}`}
          >
            <Text className={`text-[10px] font-bold ${businessTypeFilter === 'Distributor' ? 'text-white' : isDark ? 'text-slate-300' : 'text-slate-700'}`}>Distributor</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setBusinessTypeFilter(businessTypeFilter === 'Trader' ? '' : 'Trader')}
            className={`px-3 py-1.5 rounded-lg border ${businessTypeFilter === 'Trader' ? 'bg-violet-500 border-transparent' : isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-300 bg-slate-50'}`}
          >
            <Text className={`text-[10px] font-bold ${businessTypeFilter === 'Trader' ? 'text-white' : isDark ? 'text-slate-300' : 'text-slate-700'}`}>Trader</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Bulk actions bar if selection exists */}
      {selectedLeads.length > 0 && (
        <View className="bg-amber-500/25 px-4 py-2.5 flex-row justify-between items-center border-b border-amber-500/30">
          <Text className={`text-xxs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {selectedLeads.length} leads selected
          </Text>
          <TouchableOpacity 
            onPress={handleBulkReassign}
            className="bg-amber-500 px-3.5 py-1.5 rounded-lg flex-row items-center"
          >
            <UserCheck size={12} color="#FFFFFF" />
            <Text className="text-white text-xxs font-extrabold uppercase tracking-wider ml-1">Transfer / Assign</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Leads listing */}
      {leadsLoading ? (
        <ActivityIndicator size="large" color="#F59E0B" className="py-20" />
      ) : leadsData?.leads?.length === 0 ? (
        <View className="flex-1 justify-center items-center py-20 px-6">
          <Text className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No matching leads found.</Text>
        </View>
      ) : (
        <FlatList
          data={leadsData?.leads}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => {
            const isSelected = selectedLeads.includes(item.id);
            return (
              <View className={`mb-3 p-4 rounded-3xl shadow-sm border flex-row items-center ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
              }`}>
                {/* Checkbox */}
                <TouchableOpacity onPress={() => toggleSelectLead(item.id)} className="mr-3 p-1">
                  {isSelected ? (
                    <CheckSquare size={20} color="#F59E0B" />
                  ) : (
                    <Square size={20} color={isDark ? '#475569' : '#CBD5E1'} />
                  )}
                </TouchableOpacity>

                {/* Info */}
                <TouchableOpacity 
                  onPress={() => router.push(`/lead/${item.id}`)}
                  className="flex-1"
                >
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className={`text-sm font-bold flex-1 mr-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      {item.name}
                    </Text>
                    <Text className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getStatusColor(item.status)}`}>
                      {item.status}
                    </Text>
                  </View>

                  <Text className={`text-xxs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    ID: {item.id} • Mobile: {item.mobile}
                  </Text>

                  <View className="flex-row items-center mt-2.5">
                    <View className="flex-row items-center mr-3">
                      <MapPin size={11} color="#64748B" />
                      <Text className="text-[10px] text-slate-500 ml-1">{item.city || 'N/A'}, {item.state || 'N/A'}</Text>
                    </View>
                    <View className="flex-row items-center mr-3">
                      <Briefcase size={11} color="#64748B" />
                      <Text className="text-[10px] text-slate-500 ml-1">{item.business_type || 'N/A'}</Text>
                    </View>
                  </View>

                  {item.assigned_to_name && (
                    <Text className="text-[10px] text-slate-400 mt-1.5 font-semibold">
                      Assigned: {item.assigned_to_name}
                    </Text>
                  )}
                </TouchableOpacity>

                <ChevronRight size={16} color={isDark ? '#475569' : '#CBD5E1'} />
              </View>
            );
          }}
        />
      )}

      {/* Select All Float button */}
      <View className="absolute bottom-4 left-4 flex-row space-x-2">
        <TouchableOpacity
          onPress={toggleSelectAll}
          className={`px-4 py-3 rounded-full flex-row items-center shadow-lg border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <Text className={`text-xxs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {selectedLeads.length === leadsData?.leads?.length ? 'Deselect All' : 'Select All'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bulk Transfer Modal */}
      <Modal visible={bulkModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/60">
          <View className={`rounded-t-3xl p-6 h-[50%] ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
            <Text className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Transfer {selectedLeads.length} Selected Leads
            </Text>

            <Text className={`text-xs mb-3 font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Select Target Telecaller
            </Text>

            <ScrollView className="flex-1 mb-6">
              {callersData?.map(tc => (
                <TouchableOpacity
                  key={tc.id}
                  onPress={() => setTargetCaller(tc.id)}
                  className={`p-3.5 mb-2.5 rounded-xl border flex-row justify-between items-center ${
                    targetCaller === tc.id 
                      ? 'bg-amber-500 border-transparent' 
                      : isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <Text className={`text-xs font-bold ${targetCaller === tc.id ? 'text-white' : isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {tc.name} ({tc.employee_id})
                  </Text>
                  <Text className={`text-[10px] ${targetCaller === tc.id ? 'text-white' : 'text-slate-400'}`}>
                    Assigned: {tc.assigned_leads_count}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={() => setBulkModalVisible(false)}
                className={`w-[30%] py-3.5 rounded-xl border justify-center items-center ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-100'}`}
              >
                <Text className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitBulkReassign}
                disabled={bulkAssignMutation.isPending}
                className="w-[65%] bg-amber-500 py-3.5 rounded-xl flex-row justify-center items-center shadow-lg"
              >
                {bulkAssignMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-xs font-bold">Transfer Leads</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Manual Lead Modal */}
      <Modal visible={addModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/60">
          <View className={`rounded-t-3xl p-6 h-[80%] ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
            <View className="flex-row justify-between items-center mb-6">
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Add Lead Manually
              </Text>
              <TouchableOpacity onPress={closeAddModal} className={`p-2 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <Text className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1 mb-6">
              {formError ? (
                <Text className="text-red-500 text-xs font-semibold bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl mb-4 text-center">
                  {formError}
                </Text>
              ) : null}

              <View className="space-y-4">
                {/* Name */}
                <View>
                  <Text className={`text-xxs font-bold uppercase mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Customer Name (Mandatory)</Text>
                  <TextInput
                    className={`border rounded-xl px-3 py-3 text-sm ${isDark ? 'border-slate-800 bg-slate-950 text-white' : 'border-slate-200 bg-slate-50 text-slate-800'}`}
                    placeholder="e.g. Mahadev Distributors"
                    placeholderTextColor="#475569"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                {/* Mobile */}
                <View>
                  <Text className={`text-xxs font-bold uppercase mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Mobile Number (Mandatory)</Text>
                  <TextInput
                    className={`border rounded-xl px-3 py-3 text-sm ${isDark ? 'border-slate-800 bg-slate-950 text-white' : 'border-slate-200 bg-slate-50 text-slate-800'}`}
                    placeholder="10-digit number"
                    placeholderTextColor="#475569"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={mobile}
                    onChangeText={setMobile}
                  />
                </View>

                {/* Email */}
                <View>
                  <Text className={`text-xxs font-bold uppercase mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Email Address</Text>
                  <TextInput
                    className={`border rounded-xl px-3 py-3 text-sm ${isDark ? 'border-slate-800 bg-slate-950 text-white' : 'border-slate-200 bg-slate-50 text-slate-800'}`}
                    placeholder="e.g. contact@store.com"
                    placeholderTextColor="#475569"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                {/* City */}
                <View>
                  <Text className={`text-xxs font-bold uppercase mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>City</Text>
                  <TextInput
                    className={`border rounded-xl px-3 py-3 text-sm ${isDark ? 'border-slate-800 bg-slate-950 text-white' : 'border-slate-200 bg-slate-50 text-slate-800'}`}
                    placeholder="e.g. Indore"
                    placeholderTextColor="#475569"
                    value={city}
                    onChangeText={setCity}
                  />
                </View>

                {/* State */}
                <View>
                  <Text className={`text-xxs font-bold uppercase mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>State</Text>
                  <TextInput
                    className={`border rounded-xl px-3 py-3 text-sm ${isDark ? 'border-slate-800 bg-slate-950 text-white' : 'border-slate-200 bg-slate-50 text-slate-800'}`}
                    placeholder="e.g. Madhya Pradesh"
                    placeholderTextColor="#475569"
                    value={state}
                    onChangeText={setState}
                  />
                </View>

                {/* Business Type */}
                <View>
                  <Text className={`text-xxs font-bold uppercase mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Business Type</Text>
                  <View className="flex-row">
                    {['Distributor', 'Trader', 'Retailer'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        onPress={() => setBusinessType(type)}
                        className={`px-4 py-2.5 rounded-lg border mr-2 ${
                          businessType === type 
                            ? 'bg-amber-500 border-transparent' 
                            : isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-300 bg-slate-50'
                        }`}
                      >
                        <Text className={`text-xxs font-bold ${businessType === type ? 'text-white' : isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Product Interest */}
                <View>
                  <Text className={`text-xxs font-bold uppercase mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Product Interest</Text>
                  <TextInput
                    className={`border rounded-xl px-3 py-3 text-sm ${isDark ? 'border-slate-800 bg-slate-950 text-white' : 'border-slate-200 bg-slate-50 text-slate-800'}`}
                    placeholder="e.g. Mustard Oil (15L Tin)"
                    placeholderTextColor="#475569"
                    value={productInterest}
                    onChangeText={setProductInterest}
                  />
                </View>
              </View>
            </ScrollView>

            <View className="flex-row justify-between border-t border-slate-500/10 pt-4">
              <TouchableOpacity
                onPress={closeAddModal}
                className={`w-[30%] py-3.5 rounded-xl border justify-center items-center ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-100'}`}
              >
                <Text className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateLead}
                disabled={createLeadMutation.isPending}
                className="w-[65%] bg-amber-500 py-3.5 rounded-xl flex-row justify-center items-center shadow-lg"
              >
                {createLeadMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-xs font-bold">Create & Distribute</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
