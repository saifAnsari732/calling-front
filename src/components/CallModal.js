import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { X, Calendar, Clock, AlertTriangle } from 'lucide-react-native';

export default function CallModal({ visible, onClose, lead, onSubmit, isDark }) {
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Follow-up scheduling
  const [scheduleFollowup, setScheduleFollowup] = useState(false);
  const [followupDate, setFollowupDate] = useState('');
  const [followupTime, setFollowupTime] = useState('');

  const statuses = [
    { label: 'Interested', value: 'Interested', color: 'bg-emerald-500' },
    { label: 'Not Interested', value: 'Rejected', color: 'bg-red-500' },
    { label: 'Follow Up', value: 'Follow Up', color: 'bg-amber-500', triggersFollowup: true },
    { label: 'Callback', value: 'Callback', color: 'bg-yellow-500', triggersFollowup: true },
    { label: 'Not Connected', value: 'Not Connected', color: 'bg-slate-500' },
    { label: 'Distributor Inquiry', value: 'Distributor Interested', color: 'bg-purple-500' },
    { label: 'Trader Inquiry', value: 'Trader Interested', color: 'bg-blue-500' },
    { label: 'Wrong Number', value: 'Rejected', color: 'bg-rose-500' },
    { label: 'Closed / Converted', value: 'Closed', color: 'bg-teal-500' },
  ];

  const handleStatusSelect = (statusObj) => {
    setStatus(statusObj.value);
    if (statusObj.triggersFollowup) {
      setScheduleFollowup(true);
      // Auto set tomorrow as default followup date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFollowupDate(tomorrow.toISOString().split('T')[0]);
      setFollowupTime('11:00');
    } else {
      setScheduleFollowup(false);
    }
  };

  const handleQuickDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setFollowupDate(d.toISOString().split('T')[0]);
  };

  const handleFormSubmit = async () => {
    setErrorMsg('');

    if (!status) {
      setErrorMsg('Please select a Call Status.');
      return;
    }

    if (!notes.trim()) {
      setErrorMsg('Notes are mandatory after a call.');
      return;
    }

    if (scheduleFollowup && (!followupDate || !followupTime)) {
      setErrorMsg('Please fill in Date and Time for Follow-up.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        lead_id: lead.id,
        status,
        notes: notes.trim(),
        followupDate: scheduleFollowup ? followupDate : null,
        followupTime: scheduleFollowup ? followupTime : null,
        followupNotes: scheduleFollowup ? `Scheduled Follow-up: ${notes}` : null
      });
      // Reset form
      setStatus('');
      setNotes('');
      setScheduleFollowup(false);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to log call data');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        <View className={`rounded-t-3xl p-6 h-[85%] ${isDark ? 'bg-slate-900 border-t border-slate-800' : 'bg-white'}`}>
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Log Call Results</Text>
              <Text className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{lead?.name} ({lead?.id})</Text>
            </View>
            <TouchableOpacity onPress={onClose} className={`p-2 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <X size={18} color={isDark ? '#E2E8F0' : '#475569'} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            {errorMsg ? (
              <View className="bg-red-500/10 border border-red-500/30 p-3.5 rounded-xl mb-4 flex-row items-center">
                <AlertTriangle size={16} color="#EF4444" className="mr-2" />
                <Text className="text-red-500 text-xs font-semibold flex-1 ml-1">{errorMsg}</Text>
              </View>
            ) : null}

            {/* Select Status */}
            <Text className={`text-xs font-semibold uppercase tracking-wider mb-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Select Call Outcome / Lead Status
            </Text>

            <View className="flex-row flex-wrap justify-between mb-6">
              {statuses.map((item, index) => {
                const isSelected = status === item.value;
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleStatusSelect(item)}
                    className={`w-[31%] py-3 mb-2.5 rounded-xl border justify-center items-center ${
                      isSelected 
                        ? `${item.color} border-transparent` 
                        : isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <Text className={`text-xxs font-bold text-center ${isSelected ? 'text-white' : isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Follow-up Scheduling Section */}
            {scheduleFollowup && (
              <View className={`p-4 rounded-2xl mb-6 border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <Text className={`text-xs font-bold mb-3 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                  Schedule Follow-up
                </Text>
                
                {/* Quick Date Selectors */}
                <View className="flex-row mb-3.5">
                  <TouchableOpacity onPress={() => handleQuickDate(0)} className={`px-3 py-1.5 rounded-lg border mr-2 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-300 bg-white'}`}>
                    <Text className={`text-xxs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Today</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleQuickDate(1)} className={`px-3 py-1.5 rounded-lg border mr-2 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-300 bg-white'}`}>
                    <Text className={`text-xxs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Tomorrow</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleQuickDate(3)} className={`px-3 py-1.5 rounded-lg border mr-2 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-300 bg-white'}`}>
                    <Text className={`text-xxs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>In 3 Days</Text>
                  </TouchableOpacity>
                </View>

                {/* Manual Inputs */}
                <View className="flex-row justify-between">
                  <View className="w-[48%]">
                    <Text className={`text-xxs font-semibold uppercase mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Date (YYYY-MM-DD)</Text>
                    <View className={`flex-row items-center border rounded-lg px-2 py-2.5 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                      <Calendar size={14} color="#64748B" />
                      <TextInput
                        className={`flex-1 ml-2 text-xs py-0 ${isDark ? 'text-white' : 'text-slate-800'}`}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#475569"
                        value={followupDate}
                        onChangeText={setFollowupDate}
                      />
                    </View>
                  </View>
                  <View className="w-[48%]">
                    <Text className={`text-xxs font-semibold uppercase mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Time (HH:MM)</Text>
                    <View className={`flex-row items-center border rounded-lg px-2 py-2.5 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                      <Clock size={14} color="#64748B" />
                      <TextInput
                        className={`flex-1 ml-2 text-xs py-0 ${isDark ? 'text-white' : 'text-slate-800'}`}
                        placeholder="11:30"
                        placeholderTextColor="#475569"
                        value={followupTime}
                        onChangeText={setFollowupTime}
                      />
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Notes Input */}
            <View className="mb-8">
              <Text className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Call Discussion Notes (Mandatory)
              </Text>
              <TextInput
                multiline
                numberOfLines={4}
                value={notes}
                onChangeText={setNotes}
                placeholder="Enter client discussion details (e.g. Interested in palm oil tanker, call back next Tuesday, wrong number)..."
                placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                className={`border rounded-xl p-3 text-sm h-28 ${
                  isDark ? 'border-slate-800 bg-slate-950 text-white' : 'border-slate-200 bg-slate-50 text-slate-800'
                }`}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {/* Footer Submit */}
          <View className="pt-4 border-t border-slate-800/10 flex-row justify-between">
            <TouchableOpacity
              onPress={onClose}
              disabled={submitting}
              className={`w-[30%] py-3.5 rounded-xl border justify-center items-center ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-300 bg-white'}`}
            >
              <Text className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleFormSubmit}
              disabled={submitting}
              className="w-[65%] bg-amber-500 py-3.5 rounded-xl flex-row justify-center items-center shadow-md shadow-amber-500/20"
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white text-xs font-bold">Save Call Log</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
