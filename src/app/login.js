import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { Phone, Lock, Eye, EyeOff, CheckSquare, Square } from 'lucide-react-native';
import { useThemeStore } from '../store/themeStore';

export default function LoginScreen() {
  const { login } = useAuthStore();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      mobile: '',
      password: ''
    }
  });

  const onSubmit = async (data) => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/login', {
        mobile: data.mobile,
        password: data.password
      });

      const { token, user } = response.data;
      await login(token, user, rememberMe);
    } catch (error) {
      console.log('Login error:', error);
      if (error.response && error.response.data && error.response.data.error) {
        setErrorMsg(error.response.data.error);
      } else {
        setErrorMsg('Network error. Check your connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }} 
        className={isDark ? 'bg-slate-950' : 'bg-slate-50'}
      >
        <View className="flex-1 justify-center px-6 py-12">
          {/* Header Branding */}
          <View className="items-center mb-10">
            <View className="w-20 h-20 bg-amber-500 rounded-3xl justify-center items-center mb-4 shadow-lg shadow-amber-500/20">
              {/* Representing oil flow */}
              <Text className="text-white text-5xl font-black">O</Text>
            </View>
            <Text className="text-3xl font-bold text-amber-500 tracking-tight">OilFlow CRM</Text>
            <Text className={`text-sm mt-1 uppercase tracking-wider font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Lead Ad Distribution & Telecalling
            </Text>
          </View>

          {/* Form Container */}
          <View className={`p-6 rounded-3xl shadow-xl ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
            <Text className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Sign In to Account
            </Text>

            {errorMsg && (
              <View className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl mb-4">
                <Text className="text-red-500 text-xs font-semibold text-center">{errorMsg}</Text>
              </View>
            )}

            {/* Mobile Number Field */}
            <View className="mb-4">
              <Text className={`text-xs font-semibold uppercase mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Mobile Number
              </Text>
              <Controller
                control={control}
                rules={{ 
                  required: 'Mobile number is required',
                  pattern: { value: /^[0-9]{10}$/, message: 'Must be a 10-digit number' }
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className={`flex-row items-center border rounded-xl px-3 py-3.5 ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'} ${errors.mobile ? 'border-red-500' : ''}`}>
                    <Phone size={18} color={isDark ? '#64748B' : '#94A3B8'} />
                    <TextInput
                      className={`flex-1 ml-3 text-base ${isDark ? 'text-white' : 'text-slate-800'}`}
                      placeholder="Enter 10-digit number"
                      placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                      keyboardType="phone-pad"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      maxLength={10}
                    />
                  </View>
                )}
                name="mobile"
              />
              {errors.mobile && (
                <Text className="text-red-500 text-xxs font-semibold mt-1.5 ml-1">
                  {errors.mobile.message}
                </Text>
              )}
            </View>

            {/* Password Field */}
            <View className="mb-4">
              <Text className={`text-xs font-semibold uppercase mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Password
              </Text>
              <Controller
                control={control}
                rules={{ required: 'Password is required' }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className={`flex-row items-center border rounded-xl px-3 py-3.5 ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'} ${errors.password ? 'border-red-500' : ''}`}>
                    <Lock size={18} color={isDark ? '#64748B' : '#94A3B8'} />
                    <TextInput
                      className={`flex-1 ml-3 text-base ${isDark ? 'text-white' : 'text-slate-800'}`}
                      placeholder="Enter password"
                      placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                      secureTextEntry={!showPassword}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      {showPassword ? (
                        <EyeOff size={18} color={isDark ? '#64748B' : '#94A3B8'} />
                      ) : (
                        <Eye size={18} color={isDark ? '#64748B' : '#94A3B8'} />
                      )}
                    </TouchableOpacity>
                  </View>
                )}
                name="password"
              />
              {errors.password && (
                <Text className="text-red-500 text-xxs font-semibold mt-1.5 ml-1">
                  {errors.password.message}
                </Text>
              )}
            </View>

            {/* Remember Me */}
            <TouchableOpacity 
              className="flex-row items-center mt-2 mb-6" 
              activeOpacity={0.8}
              onPress={() => setRememberMe(!rememberMe)}
            >
              {rememberMe ? (
                <CheckSquare size={20} color="#F59E0B" />
              ) : (
                <Square size={20} color={isDark ? '#475569' : '#CBD5E1'} />
              )}
              <Text className={`text-sm font-semibold ml-2.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Remember login details
              </Text>
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="bg-amber-500 py-4 rounded-xl flex-row justify-center items-center shadow-lg shadow-amber-500/20"
              activeOpacity={0.9}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white text-base font-bold tracking-wide">
                  Sign In
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
