import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Dimensions } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { Phone, Lock, Eye, EyeOff, CheckSquare, Square } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-slate-50">
      {/* Decorative Top Gradient Background */}
      <LinearGradient
        colors={['#EEF2FF', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 400 }}
      />
      
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 justify-center px-6 py-12">
          
          {/* Header Branding */}
          <View className="items-center mb-10">
            <View className="w-24 h-24 bg-white rounded-3xl justify-center items-center mb-6 shadow-xl shadow-indigo-200/50 border border-white">
              <LinearGradient
                colors={['#4F46E5', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: '100%', height: '100%', borderRadius: 24, justifyContent: 'center', alignItems: 'center' }}
              >
                <Text className="text-white text-6xl font-black">O</Text>
              </LinearGradient>
            </View>
            <Text className="text-[34px] font-black text-slate-900 tracking-tight">OilFlow CRM</Text>
            <View className="bg-indigo-50 px-4 py-1.5 rounded-full mt-3 border border-indigo-100">
              <Text className="text-indigo-600 text-[11px] uppercase tracking-[0.2em] font-extrabold">
                Premium Lead Management
              </Text>
            </View>
          </View>

          {/* Form Container */}
          <View className="p-8 rounded-[36px] bg-white border border-slate-100/60 shadow-2xl shadow-indigo-100/40">
            <Text className="text-[22px] font-black mb-8 text-slate-800 tracking-tight">
              Sign in to account
            </Text>

            {errorMsg && (
              <View className="bg-red-50/80 border border-red-100 p-4 rounded-2xl mb-6 flex-row items-center">
                <Text className="text-red-600 text-sm font-bold flex-1">{errorMsg}</Text>
              </View>
            )}

            {/* Mobile Number Field */}
            <View className="mb-6">
              <Text className="text-[11px] font-extrabold uppercase tracking-widest mb-2.5 text-slate-400">
                Mobile Number
              </Text>
              <Controller
                control={control}
                rules={{ 
                  required: 'Mobile number is required',
                  pattern: { value: /^[0-9]{10}$/, message: 'Must be a 10-digit number' }
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className={`flex-row items-center border-[1.5px] rounded-[20px] px-4 py-4 bg-slate-50/50 ${errors.mobile ? 'border-red-300 bg-red-50/30' : 'border-slate-200'}`}>
                    <View className="bg-indigo-100/50 p-2 rounded-xl">
                      <Phone size={18} color="#4F46E5" strokeWidth={2.5} />
                    </View>
                    <TextInput
                      className="flex-1 ml-3 text-[15px] text-slate-800 font-bold tracking-wider"
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
              <Text className="text-[11px] font-extrabold uppercase tracking-widest mb-2.5 text-slate-400">
                Password
              </Text>
              <Controller
                control={control}
                rules={{ required: 'Password is required' }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className={`flex-row items-center border-[1.5px] rounded-[20px] px-4 py-4 bg-slate-50/50 ${errors.password ? 'border-red-300 bg-red-50/30' : 'border-slate-200'}`}>
                    <View className="bg-indigo-100/50 p-2 rounded-xl">
                      <Lock size={18} color="#4F46E5" strokeWidth={2.5} />
                    </View>
                    <TextInput
                      className="flex-1 ml-3 text-[15px] text-slate-800 font-bold tracking-wider"
                      placeholder="Enter password"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showPassword}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2">
                      {showPassword ? <EyeOff size={20} color="#94A3B8" /> : <Eye size={20} color="#94A3B8" />}
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
                <View className="bg-indigo-500 rounded-lg p-0.5 shadow-sm shadow-indigo-300">
                  <CheckSquare size={18} color="#FFFFFF" />
                </View>
              ) : (
                <Square size={20} color="#CBD5E1" />
              )}
              <Text className="text-[13px] font-bold ml-3 text-slate-500">
                Keep me logged in
              </Text>
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="rounded-[20px] shadow-lg shadow-indigo-500/40 overflow-hidden"
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#4F46E5', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingVertical: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-[15px] font-black tracking-widest uppercase">
                    Access Dashboard
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
