import '../global.css';
import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
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
    },
  },
});

function RootLayoutNav() {
  const { isAuthenticated, isLoading, user, initAuth } = useAuthStore();
  const { theme, initTheme } = useThemeStore();
  const segments = useSegments();
  const router = useRouter();

  // Initialize stores on startup
  useEffect(() => {
    initAuth();
    initTheme();
  }, []);

  // Handle routing based on authentication and role
  useEffect(() => {
    if (isLoading) return;

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
  }, [isAuthenticated, isLoading, user, segments]);

  // Loading Screen (Splash Screen replacement)
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900">
        <StatusBar style="light" />
        <View className="items-center space-y-4">
          {/* Logo Branding */}
          <Text className="text-4xl font-bold text-amber-500 tracking-wider">OilFlow CRM</Text>
          <Text className="text-slate-400 text-sm tracking-widest font-semibold uppercase">
            Edible & Industrial Oils
          </Text>
          <View className="h-10 justify-end">
            <ActivityIndicator size="large" color="#F59E0B" />
          </View>
        </View>
      </View>
    );
  }

  const isDark = theme === 'dark';

  return (
    <View className={`flex-1 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Slot />
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
