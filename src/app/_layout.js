import '../global.css';
import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { StatusBar } from 'expo-status-bar';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

function RootLayoutNav() {
  const { isAuthenticated, isLoading, user, initAuth } = useAuthStore();
  const { theme, initTheme } = useThemeStore();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  // Initialize stores on startup
  useEffect(() => {
    initAuth();
    initTheme();
  }, []);

  // Handle routing based on authentication and role
  useEffect(() => {
    if (isLoading || !navigationState?.key) return;

    const inAuthGroup = segments[0] === '(admin)' || segments[0] === '(telecaller)';
    const inLogin = segments[0] === 'login';

    if (!isAuthenticated) {
      // If not authenticated and not on login, redirect to login
      if (!inLogin) {
        router.replace('/login');
      }
    } else {
      // If authenticated
      if (inLogin || segments.length === 0 || segments[0] === undefined) {
        // Route based on role
        if (user?.role === 'admin') {
          router.replace('/(admin)/dashboard');
        } else {
          router.replace('/(telecaller)/dashboard');
        }
      }
    }
  }, [isAuthenticated, isLoading, user, segments, navigationState?.key]);

  const isDark = theme === 'dark';

  return (
    <View className={`flex-1 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Ensure Slot is ALWAYS rendered so Expo Router can initialize navigation context */}
      <Slot />

      {/* Loading Screen Overlay (Splash Screen replacement) */}
      {isLoading && (
        <View className="absolute inset-0 z-50 items-center justify-center bg-slate-50" style={{ elevation: 999 }}>
          <View className="items-center space-y-4">
            <View className="w-24 h-24 bg-white rounded-[32px] justify-center items-center mb-6 shadow-xl shadow-slate-200 border border-slate-100">
              <Text className="text-[#3B82F6] text-6xl font-black">O</Text>
            </View>
            <Text className="text-4xl font-extrabold text-slate-800 tracking-tight">OilFlow CRM</Text>
            <Text className="text-[#3B82F6] text-xs uppercase tracking-[0.2em] font-bold">
              Initializing...
            </Text>
            <View className="h-10 justify-end mt-4">
              <ActivityIndicator size="large" color="#3B82F6" />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}
