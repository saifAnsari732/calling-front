import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, Switch } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useThemeStore } from '../../store/themeStore';
import { Plus, UserCog, Trash2, ToggleLeft, ToggleRight, UserX, UserCheck, Mail, Phone, BadgeId, Key } from 'lucide-react-native';
import OfflineBanner from '../../components/OfflineBanner';

export default function TelecallerManagement() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCaller, setEditingCaller] = useState(null); // null means adding

  // Form Fields
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  // 1. Query all telecallers
  const { data, isLoading, error } = useQuery({
    queryKey: ['telecallersList'],
    queryFn: async () => {
      const response = await api.get('/telecallers');
      return response.data;
    }
  });

  // Mutations
  const addMutation = useMutation({
    mutationFn: (newTC) => api.post('/telecallers', newTC),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telecallersList'] });
      closeModal();
    },
    onError: (err) => {
      setFormError(err.response?.data?.error || 'Failed to add telecaller.');
    }
  });

  const editMutation = useMutation({
    mutationFn: ({ id, details }) => api.put(`/telecallers/${id}`, details),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telecallersList'] });
      closeModal();
    },
    onError: (err) => {
      setFormError(err.response?.data?.error || 'Failed to edit telecaller.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/telecallers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telecallersList'] });
      Alert.alert('Deleted', 'Telecaller deleted successfully.');
    },
    onError: (err) => {
      Alert.alert('Error', err.response?.data?.error || 'Failed to delete.');
    }
  });

  const toggleLeaveMutation = useMutation({
    mutationFn: ({ id, on_leave }) => api.patch(`/telecallers/${id}/leave`, { on_leave }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telecallersList'] });
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/telecallers/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telecallersList'] });
    }
  });

  const openAddModal = () => {
    setEditingCaller(null);
    setName('');
    setMobile('');
    setEmail('');
    setEmployeeId('');
    setPassword('');
    setFormError('');
    setModalVisible(true);
  };

  const openEditModal = (caller) => {
    setEditingCaller(caller);
    setName(caller.name);
    setMobile(caller.mobile);
    setEmail(caller.email);
    setEmployeeId(caller.employee_id);
    setPassword('');
    setFormError('');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingCaller(null);
  };

  const handleFormSubmit = () => {
    setFormError('');
    if (!name || !mobile || !email || !employeeId) {
      setFormError('All general fields are required.');
      return;
    }

    if (!editingCaller && !password) {
      setFormError('Password is required for a new telecaller.');
      return;
    }

    const payload = {
      name,
      mobile,
      email,
      employee_id: employeeId,
      password: password || undefined
    };

    if (editingCaller) {
      editMutation.mutate({ id: editingCaller.id, details: payload });
    } else {
      addMutation.mutate(payload);
    }
  };

  const handleDelete = (caller) => {
    Alert.alert(
      'Delete Telecaller',
      `Are you sure you want to delete ${caller.name}? All assigned leads will be reverted to Fresh Lead.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(caller.id) }
      ]
    );
  };

  const handleToggleLeave = (caller) => {
    const nextLeave = caller.on_leave === 1 ? 0 : 1;
    toggleLeaveMutation.mutate({ id: caller.id, on_leave: nextLeave });
  };

  const handleToggleStatus = (caller) => {
    const nextStatus = caller.status === 'active' ? 'disabled' : 'active';
    toggleStatusMutation.mutate({ id: caller.id, status: nextStatus });
  };

  return (
    <View className="flex-1">
      <OfflineBanner />
      <ScrollView className={isDark ? 'bg-slate-950' : 'bg-slate-50'} contentContainerStyle={{ padding: 16 }}>
        {/* Title and Add Button */}
        <View className="flex-row justify-between items-center mb-6 mt-2">
          <View>
            <Text className={`text-xxs uppercase tracking-wider font-extrabold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Team Members
            </Text>
            <Text className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Telecallers ({data?.telecallers?.length || 0})
            </Text>
          </View>
          <TouchableOpacity
            onPress={openAddModal}
            className="bg-amber-500 flex-row items-center px-4 py-3 rounded-xl shadow-md shadow-amber-500/20"
          >
            <Plus size={16} color="#FFFFFF" />
            <Text className="text-white text-xs font-bold ml-1.5">Add Caller</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#F59E0B" className="py-20" />
        ) : error ? (
          <Text className="text-red-500 text-center py-20">Error loading telecallers: {error.message}</Text>
        ) : (
          <View className="space-y-4">
            {data.telecallers.map((caller) => (
              <View
                key={caller.id}
                className={`p-4 rounded-3xl shadow-sm border ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                }`}
              >
                {/* Header detail */}
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1 mr-2">
                    <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      {caller.name}
                    </Text>
                    <Text className={`text-xxs font-semibold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      ID: {caller.employee_id} • Status: {caller.status.toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-row">
                    <TouchableOpacity onPress={() => openEditModal(caller)} className="p-2 bg-slate-500/10 rounded-lg mr-2">
                      <UserCog size={16} color="#F59E0B" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(caller)} className="p-2 bg-red-500/10 rounded-lg">
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Sub Contact row */}
                <View className="space-y-1 mb-4 border-b border-slate-500/10 pb-3">
                  <View className="flex-row items-center">
                    <Phone size={11} color="#64748B" />
                    <Text className={`text-xs ml-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{caller.mobile}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Mail size={11} color="#64748B" />
                    <Text className={`text-xs ml-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{caller.email}</Text>
                  </View>
                </View>

                {/* KPI Performance Tags */}
                <View className="flex-row justify-between mb-4 bg-slate-500/5 p-3 rounded-2xl border border-slate-500/10">
                  <View className="items-center w-[30%]">
                    <Text className={`text-[9px] uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Assigned</Text>
                    <Text className={`text-sm font-black mt-0.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      {caller.assigned_leads_count}
                    </Text>
                  </View>
                  <View className="items-center w-[30%] border-x border-slate-500/10">
                    <Text className={`text-[9px] uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Interested</Text>
                    <Text className={`text-sm font-black mt-0.5 text-emerald-500`}>
                      {caller.interested_leads_count}
                    </Text>
                  </View>
                  <View className="items-center w-[30%]">
                    <Text className={`text-[9px] uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Closed</Text>
                    <Text className={`text-sm font-black mt-0.5 text-teal-600`}>
                      {caller.closed_leads_count}
                    </Text>
                  </View>
                </View>

                {/* Management Toggles */}
                <View className="flex-row justify-between items-center">
                  {/* On Leave switch */}
                  <View className="flex-row items-center">
                    <Text className={`text-xs font-semibold mr-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      Mark Leave
                    </Text>
                    <Switch
                      value={caller.on_leave === 1}
                      onValueChange={() => handleToggleLeave(caller)}
                      trackColor={{ false: '#64748B', true: '#F59E0B' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

                  {/* Disable account */}
                  <TouchableOpacity
                    onPress={() => handleToggleStatus(caller)}
                    className={`flex-row items-center px-3.5 py-2 rounded-xl border ${
                      caller.status === 'active' 
                        ? 'bg-red-500/10 border-red-500/20' 
                        : 'bg-emerald-500/10 border-emerald-500/20'
                    }`}
                  >
                    {caller.status === 'active' ? (
                      <>
                        <UserX size={12} color="#EF4444" />
                        <Text className="text-red-500 text-xxs font-extrabold uppercase tracking-wider ml-1.5">Deactivate</Text>
                      </>
                    ) : (
                      <>
                        <UserCheck size={12} color="#10B981" />
                        <Text className="text-emerald-500 text-xxs font-extrabold uppercase tracking-wider ml-1.5">Activate</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/60">
          <View className={`rounded-t-3xl p-6 h-[80%] ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
            {/* Modal Header */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {editingCaller ? 'Edit Telecaller Details' : 'Add New Telecaller'}
              </Text>
              <TouchableOpacity onPress={closeModal} className={`p-2 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <Text className={`text-xs ${isDark ? 'text-white' : 'text-slate-800'}`}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              {formError ? (
                <Text className="text-red-500 text-xs font-semibold bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl mb-4 text-center">
                  {formError}
                </Text>
              ) : null}

              {/* Form Input fields */}
              <View className="space-y-4 mb-8">
                {/* Name */}
                <View>
                  <Text className={`text-xxs uppercase tracking-wider font-extrabold mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Full Name</Text>
                  <View className={`flex-row items-center border rounded-xl px-3 py-3 ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
                    <TextInput
                      className={`flex-1 text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}
                      placeholder="e.g. Amit Sharma"
                      placeholderTextColor="#475569"
                      value={name}
                      onChangeText={setName}
                    />
                  </View>
                </View>

                {/* Mobile */}
                <View>
                  <Text className={`text-xxs uppercase tracking-wider font-extrabold mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Mobile</Text>
                  <View className={`flex-row items-center border rounded-xl px-3 py-3 ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
                    <TextInput
                      className={`flex-1 text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}
                      placeholder="10-digit number"
                      placeholderTextColor="#475569"
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={mobile}
                      onChangeText={setMobile}
                    />
                  </View>
                </View>

                {/* Email */}
                <View>
                  <Text className={`text-xxs uppercase tracking-wider font-extrabold mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Email Address</Text>
                  <View className={`flex-row items-center border rounded-xl px-3 py-3 ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
                    <TextInput
                      className={`flex-1 text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}
                      placeholder="e.g. amit@oilflow.com"
                      placeholderTextColor="#475569"
                      keyboardType="email-address"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>
                </View>

                {/* Employee ID */}
                <View>
                  <Text className={`text-xxs uppercase tracking-wider font-extrabold mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Employee ID</Text>
                  <View className={`flex-row items-center border rounded-xl px-3 py-3 ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
                    <TextInput
                      className={`flex-1 text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}
                      placeholder="e.g. EMP105"
                      placeholderTextColor="#475569"
                      value={employeeId}
                      onChangeText={setEmployeeId}
                    />
                  </View>
                </View>

                {/* Password */}
                <View>
                  <Text className={`text-xxs uppercase tracking-wider font-extrabold mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Password {editingCaller && '(Leave blank to keep current)'}
                  </Text>
                  <View className={`flex-row items-center border rounded-xl px-3 py-3 ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
                    <TextInput
                      className={`flex-1 text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}
                      placeholder="Min 6 characters"
                      placeholderTextColor="#475569"
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View className="flex-row justify-between border-t border-slate-500/10 pt-4">
              <TouchableOpacity
                onPress={closeModal}
                className={`w-[30%] py-3.5 rounded-xl border justify-center items-center ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-100'}`}
              >
                <Text className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleFormSubmit}
                disabled={addMutation.isPending || editMutation.isPending}
                className="w-[65%] bg-amber-500 py-3.5 rounded-xl flex-row justify-center items-center shadow-lg"
              >
                {addMutation.isPending || editMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-xs font-bold">
                    {editingCaller ? 'Save Changes' : 'Create Telecaller'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
