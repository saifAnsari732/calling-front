import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import api from '../../services/api';
import { FileSpreadsheet, Download, ShieldCheck, PhoneCall, CheckSquare, Award, ArrowDownToLine } from 'lucide-react-native';
import OfflineBanner from '../../components/OfflineBanner';

export default function AdminReports() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [downloading, setDownloading] = useState(null); // stores reportType when downloading

  const reportsList = [
    {
      type: 'daily_leads',
      title: 'Daily Leads Sheet',
      desc: 'All registered leads including statuses, locations, and creation dates.',
      icon: <FileSpreadsheet size={20} color="#3B82F6" />,
      color: 'bg-blue-500/10'
    },
    {
      type: 'lead_assignment',
      title: 'Lead Assignments Report',
      desc: 'Trace which telecaller is managing which customer, and assignment times.',
      icon: <CheckSquare size={20} color="#8B5CF6" />,
      color: 'bg-purple-500/10'
    },
    {
      type: 'telecaller_performance',
      title: 'Telecaller Performance Sheet',
      desc: 'Overview metrics including talk-times and conversions for all agents.',
      icon: <Award size={20} color="#F59E0B" />,
      color: 'bg-amber-500/10'
    },
    {
      type: 'call_report',
      title: 'Call Audits & Logs',
      desc: 'Chronological calls logged including duration, status, and recording tags.',
      icon: <PhoneCall size={20} color="#10B981" />,
      color: 'bg-emerald-500/10'
    },
    {
      type: 'conversion_report',
      title: 'Conversion Summary',
      desc: 'Successful conversions alongside rejected leads analysis.',
      icon: <ShieldCheck size={20} color="#EC4899" />,
      color: 'bg-pink-500/10'
    },
    {
      type: 'distributor_report',
      title: 'Distributors List',
      desc: 'Filtered sheet of clients converted specifically under Distributor Business.',
      icon: <ArrowDownToLine size={20} color="#06B6D4" />,
      color: 'bg-cyan-500/10'
    },
    {
      type: 'trader_report',
      title: 'Traders List',
      desc: 'Filtered sheet of clients converted specifically under Trader Business.',
      icon: <ArrowDownToLine size={20} color="#3B82F6" />,
      color: 'bg-blue-500/10'
    }
  ];

  const handleExport = async (reportType, title) => {
    setDownloading(reportType);
    try {
      // 1. Fetch CSV data as text
      const response = await api.get('/reports/export', {
        params: {
          reportType,
          format: 'csv'
        },
        responseType: 'text'
      });

      const csvData = response.data;
      
      // 2. Define local file path
      const filename = `${reportType}_export_${Date.now()}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      // 3. Write data to file
      await FileSystem.writeAsStringAsync(fileUri, csvData, {
        encoding: FileSystem.EncodingType.UTF8
      });

      // 4. Verify sharing availability and share
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: `Share ${title}`,
          UTI: 'public.comma-separated-values-text'
        });
      } else {
        Alert.alert('Saved Locally', `Report has been saved, but sharing is unavailable on this device.\nUri: ${fileUri}`);
      }
    } catch (err) {
      console.log('Export error:', err);
      Alert.alert('Export Failed', 'Unable to fetch report from server. Please verify your connection.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <View className="flex-1">
      <OfflineBanner />
      <ScrollView className={isDark ? 'bg-slate-950' : 'bg-slate-50'} contentContainerStyle={{ padding: 16 }}>
        <View className="mt-2 mb-6">
          <Text className={`text-xxs uppercase tracking-wider font-extrabold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Export Modules
          </Text>
          <Text className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>
            Generate CSV Reports
          </Text>
          <Text className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Select a criteria below to export real-time sheets directly onto your phone.
          </Text>
        </View>

        <View className="space-y-4">
          {reportsList.map((item) => {
            const isSelfDownloading = downloading === item.type;
            return (
              <View
                key={item.type}
                className={`p-4 rounded-3xl border shadow-sm flex-row items-center justify-between ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                }`}
              >
                {/* Visual Icon Box */}
                <View className={`w-12 h-12 rounded-2xl ${item.color} justify-center items-center mr-4`}>
                  {item.icon}
                </View>

                {/* Body Details */}
                <View className="flex-1 mr-3">
                  <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {item.title}
                  </Text>
                  <Text className={`text-[11px] mt-0.5 leading-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {item.desc}
                  </Text>
                </View>

                {/* Actions Button */}
                <TouchableOpacity
                  onPress={() => handleExport(item.type, item.title)}
                  disabled={downloading !== null}
                  className={`p-3 rounded-2xl justify-center items-center ${
                    isSelfDownloading ? 'bg-slate-800' : 'bg-amber-500 shadow-sm shadow-amber-500/10'
                  }`}
                >
                  {isSelfDownloading ? (
                    <ActivityIndicator size="small" color="#F59E0B" />
                  ) : (
                    <Download size={16} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
