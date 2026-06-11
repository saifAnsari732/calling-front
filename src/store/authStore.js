import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (__DEV__) {
    return Platform.OS === 'android' ? 'http://10.0.2.2:3001/api' : 'http://localhost:3001/api';
  }
  return 'https://api.oilflowcrm.com/api'; 
};

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  rememberMe: true,

  // Set initial state from AsyncStorage
  initAuth: async () => {
    set({ isLoading: true });
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      const storedRemember = await AsyncStorage.getItem('rememberMe');

      const remember = storedRemember !== 'false';
      set({ rememberMe: remember });

      if (storedToken && storedUser && storedToken !== 'undefined' && storedUser !== 'undefined' && remember) {
        let token, user;
        try {
          token = JSON.parse(storedToken);
          user = JSON.parse(storedUser);
        } catch(e) {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
          set({ token: null, user: null, isAuthenticated: false, isLoading: false });
          return;
        }
        
        set({ token, user, isAuthenticated: true, isLoading: false });

        // Verify token with backend to refresh user info in background (don't await blocking UI)
        axios.get(`${getBaseUrl()}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(async (response) => {
          const freshUser = response.data.user;
          await AsyncStorage.setItem('user', JSON.stringify(freshUser));
          set({ user: freshUser });
        }).catch((apiError) => {
          console.log('Session validation failed. User may be offline or token expired.', apiError.message);
          if (apiError.response && (apiError.response.status === 401 || apiError.response.status === 403)) {
            get().logout();
          }
        });
      } else {
        // No valid session
        set({ token: null, user: null, isAuthenticated: false });
      }
    } catch (error) {
      console.error('Error initializing auth store:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (token, user, rememberMe) => {
    try {
      set({ token, user, isAuthenticated: true, rememberMe });
      if (rememberMe) {
        await AsyncStorage.setItem('token', JSON.stringify(token));
        await AsyncStorage.setItem('user', JSON.stringify(user));
        await AsyncStorage.setItem('rememberMe', 'true');
      } else {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        await AsyncStorage.setItem('rememberMe', 'false');
      }
    } catch (error) {
      console.error('Error logging in:', error);
    }
  },

  logout: async () => {
    try {
      set({ token: null, user: null, isAuthenticated: false });
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  },

  updateUser: async (updatedUser) => {
    try {
      const currentUser = get().user;
      const newUser = { ...currentUser, ...updatedUser };
      set({ user: newUser });
      if (get().rememberMe) {
        await AsyncStorage.setItem('user', JSON.stringify(newUser));
      }
    } catch (error) {
      console.error('Error updating user store:', error);
    }
  }
}));
