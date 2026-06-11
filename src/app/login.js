import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { Phone, Lock, Eye, EyeOff, CheckSquare, Square } from 'lucide-react-native';

export default function LoginScreen() {
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { mobile: '', password: '' }
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-slate-50">
        <View className="flex-1 justify-center px-6 py-12">
          
          {/* Header Branding */}
          <View className="items-center mb-12">
            <View className="w-24 h-24 bg-white rounded-[32px] justify-center items-center mb-6 shadow-xl shadow-slate-200 border border-slate-100">
              <Text className="text-[#3B82F6] text-6xl font-black">O</Text>
            </View>
            <Text className="text-4xl font-extrabold text-slate-800 tracking-tight">OilFlow CRM</Text>
            <Text className="text-[#3B82F6] text-xs mt-2 uppercase tracking-[0.2em] font-bold">
              Premium Lead Management
            </Text>
          </View>

          {/* Form Container */}
          <View className="p-8 rounded-[32px] bg-white border border-slate-100 shadow-xl shadow-slate-200/50">
            <Text className="text-2xl font-black mb-8 text-slate-800">
              Welcome Back
            </Text>

            {errorMsg && (
              <View className="bg-red-50 border border-red-100 p-4 rounded-2xl mb-6">
                <Text className="text-red-500 text-sm font-bold text-center">{errorMsg}</Text>
              </View>
            )}

            {/* Mobile Number Field */}
            <View className="mb-5">
              <Text className="text-[10px] font-bold uppercase tracking-wider mb-2 text-slate-500">
                Mobile Number
              </Text>
              <Controller
                control={control}
                rules={{ 
                  required: 'Mobile number is required',
                  pattern: { value: /^[0-9]{10}$/, message: 'Must be a 10-digit number' }
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className={`flex-row items-center border rounded-2xl px-4 py-4 bg-slate-50 ${errors.mobile ? 'border-red-300' : 'border-slate-200'}`}>
                    <Phone size={18} color="#3B82F6" />
                    <TextInput
                      className="flex-1 ml-3 text-base text-slate-800 font-medium"
                      placeholder="Enter 10-digit number"
                      placeholderTextColor="#94A3B8"
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
            </View>

            {/* Password Field */}
            <View className="mb-6">
              <Text className="text-[10px] font-bold uppercase tracking-wider mb-2 text-slate-500">
                Password
              </Text>
              <Controller
                control={control}
                rules={{ required: 'Password is required' }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className={`flex-row items-center border rounded-2xl px-4 py-4 bg-slate-50 ${errors.password ? 'border-red-300' : 'border-slate-200'}`}>
                    <Lock size={18} color="#3B82F6" />
                    <TextInput
                      className="flex-1 ml-3 text-base text-slate-800 font-medium"
                      placeholder="Enter password"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showPassword}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
                      {showPassword ? <EyeOff size={18} color="#64748B" /> : <Eye size={18} color="#64748B" />}
                    </TouchableOpacity>
                  </View>
                )}
                name="password"
              />
            </View>

            {/* Remember Me */}
            <TouchableOpacity 
              className="flex-row items-center mt-2 mb-8" 
              activeOpacity={0.8}
              onPress={() => setRememberMe(!rememberMe)}
            >
              {rememberMe ? (
                <View className="bg-[#3B82F6]/10 rounded-md p-0.5">
                  <CheckSquare size={20} color="#3B82F6" />
                </View>
              ) : (
                <Square size={20} color="#94A3B8" />
              )}
              <Text className="text-sm font-semibold ml-3 text-slate-600">
                Remember my login
              </Text>
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="bg-[#3B82F6] py-5 rounded-2xl flex-row justify-center items-center shadow-xl shadow-[#3B82F6]/30"
              activeOpacity={0.9}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white text-base font-black tracking-widest uppercase">
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
