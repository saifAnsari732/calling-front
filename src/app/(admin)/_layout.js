import React from 'react';
import { Tabs } from 'expo-router';
import { LayoutDashboard, Users, UserSquare2, FileSpreadsheet, Settings } from 'lucide-react-native';
import { useThemeStore } from '../../store/themeStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminLayout() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: isDark ? '#1E293B' : '#E2E8F0',
        },
        headerTitleStyle: {
          color: isDark ? '#FFFFFF' : '#0F172A',
          fontWeight: 'bold',
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: insets.bottom > 0 ? insets.bottom + 10 : 20,
          left: 16,
          right: 16,
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          borderRadius: 24,
          height: 64,
          borderTopWidth: 0,
          paddingBottom: 0,
          paddingTop: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        tabBarItemStyle: {
          paddingVertical: 10,
        },
        tabBarActiveTintColor: '#F59E0B',
        tabBarInactiveTintColor: isDark ? '#64748B' : '#94A3B8',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        }
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="telecallers"
        options={{
          title: 'Telecallers',
          tabBarLabel: 'Team',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="leads"
        options={{
          title: 'Meta & Manual Leads',
          tabBarLabel: 'Leads',
          tabBarIcon: ({ color, size }) => <UserSquare2 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'CRM Reports',
          tabBarLabel: 'Reports',
          tabBarIcon: ({ color, size }) => <FileSpreadsheet size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
