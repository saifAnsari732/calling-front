import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useThemeStore = create((set, get) => ({
  theme: 'light', // default
  isLoading: true,

  initTheme: async () => {
    try {
      const storedTheme = await AsyncStorage.getItem('theme');
      if (storedTheme) {
        set({ theme: storedTheme });
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  toggleTheme: async () => {
    const currentTheme = get().theme;
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    set({ theme: nextTheme });
    try {
      await AsyncStorage.setItem('theme', nextTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  },

  setTheme: async (theme) => {
    if (theme !== 'light' && theme !== 'dark') return;
    set({ theme });
    try {
      await AsyncStorage.setItem('theme', theme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }
}));
