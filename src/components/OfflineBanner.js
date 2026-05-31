import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WifiOff, RotateCw } from 'lucide-react-native';
import { getOfflineQueue, syncOfflineRequests } from '../services/api';

export default function OfflineBanner() {
  const [queueCount, setQueueCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const checkQueue = async () => {
    const queue = await getOfflineQueue();
    setQueueCount(queue.length);
  };

  useEffect(() => {
    checkQueue();
    // Check every 10 seconds
    const interval = setInterval(checkQueue, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncOfflineRequests();
      if (result.count > 0) {
        console.log(`Synced ${result.count} requests successfully.`);
      }
      await checkQueue();
    } catch (err) {
      console.log('Manual sync failed:', err.message);
    } finally {
      setSyncing(false);
    }
  };

  if (queueCount === 0) return null;

  return (
    <View className="bg-amber-500 px-4 py-2 flex-row justify-between items-center shadow-md">
      <View className="flex-row items-center flex-1">
        <WifiOff size={16} color="#FFFFFF" />
        <Text className="text-white text-xs font-bold ml-2.5 flex-1">
          Offline Mode: {queueCount} pending {queueCount === 1 ? 'change' : 'changes'} saved locally
        </Text>
      </View>
      <TouchableOpacity 
        onPress={handleSync} 
        disabled={syncing}
        className="bg-slate-900/20 hover:bg-slate-900/30 px-3 py-1.5 rounded-lg flex-row items-center"
      >
        {syncing ? (
          <ActivityIndicator size="small" color="#FFFFFF" className="mr-1" />
        ) : (
          <RotateCw size={12} color="#FFFFFF" className="mr-1.5" />
        )}
        <Text className="text-white text-xxs font-extrabold uppercase tracking-wider">Sync</Text>
      </TouchableOpacity>
    </View>
  );
}
