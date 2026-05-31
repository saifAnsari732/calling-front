import React from 'react';
import { View, Text } from 'react-native';
import { Phone, Calendar, UserPlus, FileText, CheckCircle2, Award } from 'lucide-react-native';

export default function LeadTimeline({ timeline, isDark }) {
  if (!timeline || timeline.length === 0) {
    return (
      <View className="py-6 items-center">
        <Text className={isDark ? 'text-slate-400' : 'text-slate-500'}>No activity timeline recorded yet.</Text>
      </View>
    );
  }

  // Map event types to icons and colors
  const getEventStyle = (type) => {
    switch (type) {
      case 'CREATED':
        return {
          icon: <UserPlus size={14} color="#FFFFFF" />,
          color: 'bg-blue-500',
          textColor: 'text-blue-500'
        };
      case 'ASSIGNED':
        return {
          icon: <FileText size={14} color="#FFFFFF" />,
          color: 'bg-indigo-500',
          textColor: 'text-indigo-500'
        };
      case 'CALL':
        return {
          icon: <Phone size={14} color="#FFFFFF" />,
          color: 'bg-emerald-500',
          textColor: 'text-emerald-500'
        };
      case 'FOLLOWUP':
        return {
          icon: <Calendar size={14} color="#FFFFFF" />,
          color: 'bg-amber-500',
          textColor: 'text-amber-500'
        };
      case 'CONVERTED_DIST':
      case 'CONVERTED_TRADE':
        return {
          icon: <Award size={14} color="#FFFFFF" />,
          color: 'bg-purple-500',
          textColor: 'text-purple-500'
        };
      default:
        return {
          icon: <CheckCircle2 size={14} color="#FFFFFF" />,
          color: 'bg-slate-500',
          textColor: 'text-slate-500'
        };
    }
  };

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <View className="px-2 py-4">
      {timeline.map((event, index) => {
        const style = getEventStyle(event.type);
        const isLast = index === timeline.length - 1;

        return (
          <View key={index} className="flex-row items-start mb-6">
            {/* Timeline Line */}
            <View className="items-center mr-4">
              <View className={`w-8 h-8 rounded-full ${style.color} justify-center items-center z-10 shadow-sm`}>
                {style.icon}
              </View>
              {!isLast && (
                <View 
                  className={`w-0.5 h-16 border-l border-dashed ${
                    isDark ? 'border-slate-800' : 'border-slate-300'
                  } -mb-6 mt-1`} 
                />
              )}
            </View>

            {/* Event Description */}
            <View className="flex-1 mt-0.5">
              <View className="flex-row justify-between items-center mb-1">
                <Text className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {event.title}
                </Text>
                <Text className={`text-xxs ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                  {formatDate(event.date)}
                </Text>
              </View>
              <Text className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {event.description}
              </Text>
              {event.recording && (
                <View className="flex-row items-center mt-1 bg-amber-500/10 border border-amber-500/20 px-2 py-1.5 rounded-lg self-start">
                  <Phone size={12} color="#F59E0B" />
                  <Text className="text-amber-500 text-xxs font-semibold ml-1.5">Recording uploaded</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
