import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Switch, ActivityIndicator, Alert, Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import api from '../services/api';
import { User, LogOut, Moon, Sun, Lock, Bell, Shield, Phone, BadgeCheck } from 'lucide-react-native';

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // Notification Preferences
  const [leadsNotification, setLeadsNotification] = useState(true);
  const [remindersNotification, setRemindersNotification] = useState(true);

  const handlePasswordChange = async () => {
    setPassError('');
    setPassSuccess('');

    if (!oldPassword || !newPassword) {
      setPassError('Both old and new passwords are required.');
      return;
    }

    if (newPassword.length < 6) {
      setPassError('New password must be at least 6 characters.');
      return;
    }

    setUpdatingPassword(true);
    try {
      // Endpoint can be set up or mocked
      // Let's call a hypothetical endpoint /auth/change-password
      // We will write this endpoint in the backend shortly to keep it robust!
      await api.put('/auth/change-password', {
        oldPassword,
        newPassword
      });

      setPassSuccess('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
    } catch (error) {
      setPassError(error.response?.data?.error || 'Password update failed. Verify credentials.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmLogout = window.confirm('Are you sure you want to log out of OilFlow CRM?');
      if (confirmLogout) {
        logout();
      }
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to log out of OilFlow CRM?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: () => logout() }
        ]
      );
    }
  };

  return (
    <ScrollView className={isDark ? 'bg-slate-950' : 'bg-slate-50'} contentContainerStyle={{ padding: 16 }}>
      
      {/* Profile Details Card */}
      <View className={`p-5 rounded-3xl border shadow-sm mb-6 mt-2 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <View className="flex-row items-center mb-4">
          <View className="w-14 h-14 bg-amber-500 rounded-2xl justify-center items-center">
            <User size={28} color="#FFFFFF" />
          </View>
          <View className="ml-4 flex-1">
            <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{user?.name}</Text>
            <Text className="text-amber-500 text-xxs font-extrabold uppercase tracking-wider mt-0.5">{user?.role} ACCOUNT</Text>
          </View>
        </View>

        <View className="space-y-2.5 border-t border-slate-500/10 pt-4">
          <View className="flex-row items-center">
            <BadgeCheck size={14} color="#64748B" />
            <Text className={`text-xs font-semibold ml-2.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Employee ID: {user?.employee_id}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Phone size={14} color="#64748B" />
            <Text className={`text-xs font-semibold ml-2.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Mobile: {user?.mobile}
            </Text>
          </View>
        </View>
      </View>

      {/* Theme Settings Panel */}
      <View className={`p-5 rounded-3xl border shadow-sm mb-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            {isDark ? <Moon size={18} color="#F59E0B" /> : <Sun size={18} color="#F59E0B" />}
            <Text className={`text-sm font-bold ml-3 ${isDark ? 'text-white' : 'text-slate-800'}`}>Dark Theme Mode</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#94A3B8', true: '#F59E0B' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Notification Preferences */}
      <View className={`p-5 rounded-3xl border shadow-sm mb-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <View className="flex-row items-center mb-4">
          <Bell size={18} color="#F59E0B" />
          <Text className={`text-sm font-bold ml-2.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>Notifications</Text>
        </View>

        <View className="space-y-4">
          <View className="flex-row justify-between items-center">
            <Text className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Leads Alerts</Text>
            <Switch
              value={leadsNotification}
              onValueChange={setLeadsNotification}
              trackColor={{ false: '#94A3B8', true: '#F59E0B' }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View className="flex-row justify-between items-center">
            <Text className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Follow-up Reminders</Text>
            <Switch
              value={remindersNotification}
              onValueChange={setRemindersNotification}
              trackColor={{ false: '#94A3B8', true: '#F59E0B' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </View>

      {/* Change Password Panel */}
      <View className={`p-5 rounded-3xl border shadow-sm mb-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <View className="flex-row items-center mb-4">
          <Lock size={18} color="#F59E0B" />
          <Text className={`text-sm font-bold ml-2.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>Update Password</Text>
        </View>

        {passError ? (
          <Text className="text-red-500 text-xxs font-semibold mb-3 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg text-center">{passError}</Text>
        ) : null}
        {passSuccess ? (
          <Text className="text-emerald-500 text-xxs font-semibold mb-3 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg text-center">{passSuccess}</Text>
        ) : null}

        <View className="space-y-3.5 mb-4">
          <View>
            <Text className={`text-[10px] uppercase font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Old Password</Text>
            <TextInput
              className={`border rounded-xl px-3 py-2 text-xs ${isDark ? 'border-slate-800 bg-slate-950 text-white' : 'border-slate-200 bg-slate-50 text-slate-800'}`}
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
              placeholder="••••••••"
              placeholderTextColor="#475569"
            />
          </View>
          <View>
            <Text className={`text-[10px] uppercase font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>New Password</Text>
            <TextInput
              className={`border rounded-xl px-3 py-2 text-xs ${isDark ? 'border-slate-800 bg-slate-950 text-white' : 'border-slate-200 bg-slate-50 text-slate-800'}`}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="••••••••"
              placeholderTextColor="#475569"
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handlePasswordChange}
          disabled={updatingPassword}
          className="bg-amber-500 py-3 rounded-xl flex-row justify-center items-center shadow-sm"
        >
          {updatingPassword ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-white text-xs font-bold">Change Password</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Logout button */}
      <TouchableOpacity
        onPress={handleLogout}
        className="border border-red-500/25 bg-red-500/10 py-4 rounded-3xl flex-row justify-center items-center mb-10"
      >
        <LogOut size={16} color="#EF4444" />
        <Text className="text-red-500 text-xs font-black uppercase tracking-wider ml-2.5">Sign Out Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
