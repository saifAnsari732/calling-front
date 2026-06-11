import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/authStore';
import Constants from 'expo-constants';

const getBaseUrl = () => {
  return 'https://caller-app-4brj.onrender.com/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 60000, // Increased to 60 seconds for Render free tier cold starts
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to inject JWT Auth Token dynamically
api.interceptors.request.use(
  async (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Offline Queue Management
const OFFLINE_QUEUE_KEY = 'offline_request_queue';

export const getOfflineQueue = async () => {
  try {
    const queue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch {
    return [];
  }
};

export const saveOfflineQueue = async (queue) => {
  try {
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Error saving offline queue:', err);
  }
};

export const enqueueOfflineRequest = async (config) => {
  const queue = await getOfflineQueue();
  const newRequest = {
    id: Date.now().toString(),
    url: config.url,
    method: config.method,
    data: config.data,
    headers: config.headers,
    timestamp: new Date().toISOString()
  };
  
  // Prevent duplicate submissions of the exact same event
  const isDuplicate = queue.some(
    r => r.url === newRequest.url && 
         JSON.stringify(r.data) === JSON.stringify(newRequest.data)
  );

  if (!isDuplicate) {
    queue.push(newRequest);
    await saveOfflineQueue(queue);
    console.log('Saved request to offline queue:', config.url);
  }
};

// Process / Sync Offline Queue
export const syncOfflineRequests = async () => {
  const queue = await getOfflineQueue();
  if (queue.length === 0) return { success: true, count: 0 };

  console.log(`Attempting to sync ${queue.length} offline requests...`);
  const remainingQueue = [];
  let successCount = 0;

  for (const req of queue) {
    try {
      // Re-run the request
      await axios({
        url: `${api.defaults.baseURL}${req.url}`,
        method: req.method,
        data: req.data,
        headers: {
          ...req.headers,
          // Re-inject current token in case it changed
          Authorization: `Bearer ${useAuthStore.getState().token}`
        }
      });
      successCount++;
    } catch (error) {
      console.log(`Failed syncing request ${req.url}:`, error.message);
      // If error is not a network connection issue (e.g. 400 Bad Request, 404), do not keep it (prevent poison pill)
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        console.log('Dropping invalid request from queue:', req.url);
      } else {
        // Keep it in queue to retry later
        remainingQueue.push(req);
      }
    }
  }

  await saveOfflineQueue(remainingQueue);
  return { success: remainingQueue.length === 0, count: successCount };
};

// Interceptor to catch network connectivity issues and queue modifications
api.interceptors.response.use(
  (response) => {
    // If a request succeeds, try syncing any previously queued offline requests asynchronously
    syncOfflineRequests().catch(console.error);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const isNetworkError = !error.response && (error.message === 'Network Error' || error.code === 'ECONNABORTED');

    // Only queue mutating requests (POST, PUT, PATCH, DELETE) that fail due to network
    if (isNetworkError && originalRequest && ['post', 'put', 'patch', 'delete'].includes(originalRequest.method?.toLowerCase())) {
      // Do not offline-queue authentication endpoints
      if (originalRequest.url && originalRequest.url.includes('/auth/')) {
        return Promise.reject(error);
      }
      
      await enqueueOfflineRequest(originalRequest);
      // Return a mock successful response so the client UI can proceed gracefully
      return Promise.resolve({
        data: { _offlineSyncedLater: true, message: 'Saved offline. Will sync when connection is restored.' },
        status: 202,
        statusText: 'Accepted'
      });
    }

    return Promise.reject(error);
  }
);

export default api;
