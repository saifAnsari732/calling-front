import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Linking, RefreshControl, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { resolveRecordingUrl } from '../../services/imagekit';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import LeadTimeline from '../../components/Timeline';
import CallModal from '../../components/CallModal';
import OfflineBanner from '../../components/OfflineBanner';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import { Phone, Calendar, Clipboard, History, ArrowLeft, Play, Pause, Square, Upload, Trash2, CalendarPlus, BadgeAlert } from 'lucide-react-native';

export default function LeadDetails() {
  const { id } = useLocalSearchParams();
  const { theme } = useThemeStore();
  const { user: currentUser } = useAuthStore();
  const isDark = theme === 'dark';
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline', 'calls', 'followups'
  const [refreshing, setRefreshing] = useState(false);

  // Calling & Modal states
  const [callModalVisible, setCallModalVisible] = useState(false);
  const [callStartTime, setCallStartTime] = useState(null);

  // Audio state
  const [sound, setSound] = useState(null);
  const [playingCallId, setPlayingCallId] = useState(null);
  const [uploadingCallId, setUploadingCallId] = useState(null);

  // New Follow-up form state
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [creatingFollowup, setCreatingFollowup] = useState(false);

  // Fetch details
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['leadDetails', id],
    queryFn: async () => {
      const response = await api.get(`/leads/${id}`);
      return response.data;
    }
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Cleanup sound player on unmount
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  // Mutations
  const logCallMutation = useMutation({
    mutationFn: (callDetails) => api.post('/calls', callDetails),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leadDetails', id] });
      queryClient.invalidateQueries({ queryKey: ['telecallerDashboardStats'] });
      Alert.alert('Logged', 'Call details updated successfully.');
    }
  });

  const createFollowupMutation = useMutation({
    mutationFn: (details) => api.post('/followups', details),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leadDetails', id] });
      setNewDate('');
      setNewTime('');
      setNewNotes('');
      Alert.alert('Scheduled', 'Followup scheduled.');
    },
    onError: (err) => {
      Alert.alert('Error', err.response?.data?.error || 'Failed scheduling.');
    }
  });

  const uploadRecordingMutation = useMutation({
    mutationFn: (formData) => api.post('/calls/upload-recording', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leadDetails', id] });
      Alert.alert('Uploaded', 'Call recording linked successfully.');
    },
    onError: (err) => {
      Alert.alert('Upload Failed', err.response?.data?.error || 'Failed to upload audio.');
    }
  });

  const deleteRecordingMutation = useMutation({
    mutationFn: (callId) => api.delete(`/calls/recording/${callId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leadDetails', id] });
      Alert.alert('Deleted', 'Recording deleted.');
    }
  });

  // Call Dialer trigger
  const handleMakeCall = () => {
    if (!data?.lead?.mobile) return;
    setCallStartTime(new Date().toISOString());
    const telUrl = `tel:${data.lead.mobile}`;
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
      lead_id: id,
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

  // Follow-up handler
  const handleScheduleFollowup = () => {
    if (!newDate || !newTime) {
      Alert.alert('Error', 'Please fill in scheduled Date and Time.');
      return;
    }
    createFollowupMutation.mutate({
      lead_id: id,
      date: newDate,
      time: newTime,
      notes: newNotes
    });
  };

  // Play Audio Streaming
  const playSound = async (callId, pathUrl) => {
    try {
      // If already playing this file, stop it
      if (playingCallId === callId && sound) {
        await sound.stopAsync();
        setPlayingCallId(null);
        return;
      }

      // Stop previous sounds
      if (sound) {
        await sound.unloadAsync();
      }

      setPlayingCallId(callId);
      
      // Resolve URL — handles both ImageKit CDN and local server paths
      const backendBase = api.defaults.baseURL.replace('/api', '');
      const soundSource = resolveRecordingUrl(pathUrl, backendBase);

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: soundSource },
        { shouldPlay: true }
      );
      
      setSound(newSound);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayingCallId(null);
        }
      });

    } catch (err) {
      console.log('Playback error:', err.message);
      Alert.alert('Playback Error', 'Cannot play recording file.');
      setPlayingCallId(null);
    }
  };

  // Select and Upload Call Recording Audio
  const handleUploadRecording = async (callId) => {
    setUploadingCallId(callId);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const formData = new FormData();
      formData.append('call_id', callId);
      
      // Prepare multipart file object
      formData.append('recording', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'audio/mpeg'
      });

      await uploadRecordingMutation.mutateAsync(formData);
    } catch (err) {
      console.log('Doc Picker Error:', err);
    } finally {
      setUploadingCallId(null);
    }
  };

  const handleDeleteRecording = (callId) => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this audio recording from the server?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteRecordingMutation.mutate(callId) }
      ]
    );
  };

  if (isLoading) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <ActivityIndicator size="large" color="#F59E0B" />
        <Text className={`text-xs mt-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading Lead Profile...</Text>
      </View>
    );
  }

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/'); // Fallback to Dashboard/Root
    }
  };

  if (error) {
    return (
      <View className={`flex-1 justify-center items-center p-6 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <Text className="text-red-500 text-sm font-semibold mb-2">Error Loading Profile</Text>
        <Text className="text-xs text-slate-500 mb-6">{error.message}</Text>
        <TouchableOpacity onPress={handleGoBack} className="bg-amber-500 px-6 py-3 rounded-xl">
          <Text className="text-white text-xs font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { lead, calls, followups, timeline } = data;
  const isPresenterAdmin = currentUser?.role === 'admin';

  return (
    <View className={`flex-1 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <OfflineBanner />
      
      {/* Detail Header bar */}
      <View className={`px-4 py-3 flex-row items-center border-b ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <TouchableOpacity onPress={handleGoBack} className="p-2 rounded-lg bg-slate-500/10">
          <ArrowLeft size={16} color={isDark ? '#FFFFFF' : '#334155'} />
        </TouchableOpacity>
        <View className="ml-4 flex-1">
          <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{lead.name}</Text>
          <Text className="text-amber-500 text-xxs font-extrabold uppercase tracking-wide">ID: {lead.id}</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F59E0B']} />}
      >
        <View className="p-4 space-y-6">
          
          {/* Profile Overview */}
          <View className={`p-5 rounded-3xl border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <View className="flex-row justify-between items-center mb-4 pb-3.5 border-b border-slate-500/5">
              <Text className={`text-xs font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Contact & Profile</Text>
              <View className="bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                <Text className="text-amber-500 text-[10px] font-black uppercase">{lead.status}</Text>
              </View>
            </View>

            <View className="space-y-3">
              <View className="flex-row justify-between">
                <Text className="text-slate-400 text-xs">Mobile:</Text>
                <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-700'}`}>{lead.mobile}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-slate-400 text-xs">Email:</Text>
                <Text className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-700'}`}>{lead.email || 'N/A'}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-slate-400 text-xs">City/State:</Text>
                <Text className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-700'}`}>
                  {lead.city || 'N/A'}, {lead.state || 'N/A'}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-slate-400 text-xs">Business Type:</Text>
                <Text className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-700'}`}>{lead.business_type || 'N/A'}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-slate-400 text-xs">Product Interest:</Text>
                <Text className={`text-xs font-bold text-amber-500`}>{lead.product_interest || 'N/A'}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-slate-400 text-xs">Lead Source:</Text>
                <Text className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-700'}`}>{lead.lead_source}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-slate-400 text-xs">Assigned To:</Text>
                <Text className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-700'}`}>{lead.assigned_to_name || 'Unassigned'}</Text>
              </View>
            </View>
          </View>

          {/* Sub Content Tabs */}
          <View className={`border-b flex-row ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            {[
              { key: 'timeline', label: 'Timeline', icon: <Clipboard size={12} /> },
              { key: 'calls', label: 'Call Audits', icon: <History size={12} /> },
              { key: 'followups', label: 'Follow Ups', icon: <Calendar size={12} /> }
            ].map(tab => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className={`flex-1 py-3 items-center border-b-2 justify-center flex-row ${
                  activeTab === tab.key ? 'border-amber-500' : 'border-transparent'
                }`}
              >
                <Text className={`text-xs font-bold ${
                  activeTab === tab.key ? 'text-amber-500' : isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab content panel */}
          <View>
            {activeTab === 'timeline' && (
              <LeadTimeline timeline={timeline} isDark={isDark} />
            )}

            {activeTab === 'calls' && (
              <View className="space-y-4">
                {calls.length === 0 ? (
                  <Text className={`text-xs text-center py-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    No call logs recorded.
                  </Text>
                ) : (
                  calls.map((call) => {
                    const isAudioPlaying = playingCallId === call.id;
                    const isUploadingThis = uploadingCallId === call.id;
                    const isCallerOwner = currentUser?.id === call.caller_id;

                    return (
                      <View 
                        key={call.id}
                        className={`p-4 rounded-3xl border shadow-sm ${
                          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                        }`}
                      >
                        <View className="flex-row justify-between items-center mb-1.5">
                          <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            Log Status: {call.status}
                          </Text>
                          <Text className="text-xxs text-slate-400">
                            {new Date(call.start_time).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                        <Text className="text-[10px] text-amber-500 font-extrabold uppercase tracking-wide">
                          Talk Time: {call.duration}s • Caller ID: {call.caller_id}
                        </Text>
                        <Text className={`text-xs mt-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          Notes: {call.notes}
                        </Text>

                        {/* Audio Call Recordings Panel */}
                        <View className="mt-4 pt-3 border-t border-slate-500/5 flex-row justify-between items-center">
                          {call.recording_url ? (
                            <View className="flex-row items-center space-x-2">
                              {/* Play stream */}
                              <TouchableOpacity
                                onPress={() => playSound(call.id, call.recording_url)}
                                className={`px-4 py-2.5 rounded-xl flex-row items-center ${
                                  isAudioPlaying ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                              >
                                {isAudioPlaying ? (
                                  <>
                                    <Square size={12} color="#FFFFFF" />
                                    <Text className="text-white text-xxs font-bold ml-1.5">Pause</Text>
                                  </>
                                ) : (
                                  <>
                                    <Play size={12} color="#FFFFFF" />
                                    <Text className="text-white text-xxs font-bold ml-1.5">Play Audio</Text>
                                  </>
                                )}
                              </TouchableOpacity>

                              {/* Admin deletion option */}
                              {isPresenterAdmin && (
                                <TouchableOpacity
                                  onPress={() => handleDeleteRecording(call.id)}
                                  className="bg-red-500/10 p-2.5 rounded-xl border border-red-500/20"
                                >
                                  <Trash2 size={12} color="#EF4444" />
                                </TouchableOpacity>
                              )}
                            </View>
                          ) : (
                            // Upload option (Visible to Admin, or the Telecaller who owned the call)
                            (isPresenterAdmin || isCallerOwner) && (
                              <TouchableOpacity
                                onPress={() => handleUploadRecording(call.id)}
                                disabled={isUploadingThis}
                                className={`px-4 py-2.5 rounded-xl border flex-row items-center ${
                                  isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'
                                }`}
                              >
                                {isUploadingThis ? (
                                  <ActivityIndicator size="small" color="#F59E0B" />
                                ) : (
                                  <>
                                    <Upload size={12} color="#64748B" />
                                    <Text className={`text-xxs font-bold ml-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                      Upload Recording File
                                    </Text>
                                  </>
                                )}
                              </TouchableOpacity>
                            )
                          )}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {activeTab === 'followups' && (
              <View className="space-y-6">
                
                {/* Book Follow Up Form Widget */}
                <View className={`p-4 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                  <View className="flex-row items-center mb-4">
                    <CalendarPlus size={16} color="#F59E0B" />
                    <Text className={`text-xs font-bold ml-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      Schedule New Follow Up
                    </Text>
                  </View>

                  <View className="space-y-3.5 mb-4">
                    <View className="flex-row justify-between">
                      <View className="w-[48%]">
                        <Text className={`text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Date (YYYY-MM-DD)</Text>
                        <TextInput
                          className={`border rounded-xl px-3 py-2 text-xs ${isDark ? 'border-slate-800 bg-slate-950 text-white' : 'border-slate-200 bg-slate-50 text-slate-800'}`}
                          placeholder="e.g. 2026-06-01"
                          placeholderTextColor="#475569"
                          value={newDate}
                          onChangeText={setNewDate}
                        />
                      </View>
                      <View className="w-[48%]">
                        <Text className={`text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Time (HH:MM)</Text>
                        <TextInput
                          className={`border rounded-xl px-3 py-2 text-xs ${isDark ? 'border-slate-800 bg-slate-950 text-white' : 'border-slate-200 bg-slate-50 text-slate-800'}`}
                          placeholder="e.g. 15:30"
                          placeholderTextColor="#475569"
                          value={newTime}
                          onChangeText={setNewTime}
                        />
                      </View>
                    </View>
                    <View>
                      <Text className={`text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Notes</Text>
                      <TextInput
                        className={`border rounded-xl px-3 py-2 text-xs ${isDark ? 'border-slate-800 bg-slate-950 text-white' : 'border-slate-200 bg-slate-50 text-slate-800'}`}
                        placeholder="e.g. Confirm volume order details..."
                        placeholderTextColor="#475569"
                        value={newNotes}
                        onChangeText={setNewNotes}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleScheduleFollowup}
                    className="bg-amber-500 py-3.5 rounded-xl flex-row justify-center items-center shadow-md shadow-amber-500/10"
                  >
                    <Text className="text-white text-xs font-bold">Schedule Meet</Text>
                  </TouchableOpacity>
                </View>

                {/* Scheduled list */}
                <View className="space-y-4">
                  <Text className={`text-xs font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Scheduled Follow Ups</Text>
                  {followups.length === 0 ? (
                    <Text className={`text-xs text-center py-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      No schedules booked yet.
                    </Text>
                  ) : (
                    followups.map(item => (
                      <View 
                        key={item.id}
                        className={`p-3.5 rounded-2xl border ${
                          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                        } ${item.completed ? 'opacity-65' : ''}`}
                      >
                        <View className="flex-row justify-between items-center mb-1">
                          <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            Schedule: {item.date} @ {item.time}
                          </Text>
                          {item.completed === 1 && (
                            <View className="bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                              <Text className="text-emerald-500 text-[8px] font-black uppercase">Completed</Text>
                            </View>
                          )}
                        </View>
                        <Text className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-650'}`}>Notes: {item.notes}</Text>
                      </View>
                    ))
                  )}
                </View>

              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Floating Call Button */}
      {lead.assigned_to_id === currentUser?.id && (
        <View className="absolute bottom-6 right-6">
          <TouchableOpacity
            onPress={handleMakeCall}
            className="w-14 h-14 bg-emerald-500 rounded-full justify-center items-center shadow-lg shadow-emerald-500/30 border border-emerald-400/20"
            activeOpacity={0.9}
          >
            <Phone size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Logger Popup modal */}
      <CallModal
        visible={callModalVisible}
        onClose={() => setCallModalVisible(false)}
        lead={lead}
        onSubmit={handleCallModalSubmit}
        isDark={isDark}
      />
    </View>
  );
}
