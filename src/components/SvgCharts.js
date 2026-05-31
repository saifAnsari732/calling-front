import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import Svg, { Rect, Circle, G, Text as SvgText, Line } from 'react-native-svg';

const screenWidth = Dimensions.get('window').width;

// 1. Grouped Horizontal Bar Chart for Telecaller Performance
export function TelecallerPerformanceChart({ data, isDark }) {
  if (!data || data.length === 0) {
    return (
      <View className="py-8 justify-center items-center">
        <Text className={isDark ? 'text-slate-400' : 'text-slate-500'}>No performance data available</Text>
      </View>
    );
  }

  const labelWidth = 80;
  const chartWidth = screenWidth - 70; // padding adjustments
  const barContainerWidth = chartWidth - labelWidth;
  const rowHeight = 65;
  const chartHeight = data.length * rowHeight + 40;

  // Find max value for scaling
  let maxValue = 1;
  data.forEach(item => {
    const total = item.freshLeads + item.followUps + item.interested + item.notConnected + item.closed;
    if (total > maxValue) maxValue = total;
  });

  // Color mappings
  const colors = {
    fresh: '#94A3B8', // slate-400
    followUps: '#F59E0B', // amber-500
    interested: '#10B981', // emerald-500
    notConnected: '#EF4444', // red-500
    closed: '#8B5CF6', // purple-500
  };

  return (
    <View className="my-2">
      <Svg width={chartWidth} height={chartHeight}>
        <G>
          {data.map((item, index) => {
            const y = index * rowHeight + 20;
            const values = [
              { key: 'fresh', val: item.freshLeads },
              { key: 'followUps', val: item.followUps },
              { key: 'interested', val: item.interested },
              { key: 'notConnected', val: item.notConnected },
              { key: 'closed', val: item.closed }
            ];

            // Render horizontal stacked bar
            let accumulatedWidth = 0;

            return (
              <G key={index}>
                {/* Telecaller Name Label */}
                <SvgText
                  x={0}
                  y={y + 20}
                  fill={isDark ? '#E2E8F0' : '#334155'}
                  fontSize="12"
                  fontWeight="bold"
                >
                  {item.telecallerName.length > 10 
                    ? `${item.telecallerName.substring(0, 9)}...` 
                    : item.telecallerName}
                </SvgText>

                {/* Draw segments */}
                {values.map((valObj) => {
                  if (valObj.val === 0) return null;
                  const segmentWidth = (valObj.val / maxValue) * barContainerWidth;
                  const barX = labelWidth + accumulatedWidth;
                  accumulatedWidth += segmentWidth;

                  return (
                    <Rect
                      key={valObj.key}
                      x={barX}
                      y={y + 8}
                      width={segmentWidth}
                      height={18}
                      rx={3}
                      fill={colors[valObj.key]}
                    />
                  );
                })}

                {/* If total is 0, draw an empty spacer bar */}
                {accumulatedWidth === 0 && (
                  <Rect
                    x={labelWidth}
                    y={y + 8}
                    width={10}
                    height={18}
                    rx={3}
                    fill={isDark ? '#334155' : '#E2E8F0'}
                  />
                )}

                {/* Subtitle / Totals */}
                <SvgText
                  x={labelWidth}
                  y={y + 38}
                  fill={isDark ? '#64748B' : '#94A3B8'}
                  fontSize="10"
                >
                  {`Int: ${item.interested} | Clsd: ${item.closed} | FU: ${item.followUps}`}
                </SvgText>
              </G>
            );
          })}
        </G>
      </Svg>

      {/* Legends */}
      <View className="flex-row flex-wrap justify-between mt-4 px-2">
        <View className="flex-row items-center mr-3 mb-2">
          <View className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: colors.fresh }} />
          <Text className={`text-xxs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Assigned/Fresh</Text>
        </View>
        <View className="flex-row items-center mr-3 mb-2">
          <View className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: colors.followUps }} />
          <Text className={`text-xxs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Follow Ups</Text>
        </View>
        <View className="flex-row items-center mr-3 mb-2">
          <View className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: colors.interested }} />
          <Text className={`text-xxs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Interested</Text>
        </View>
        <View className="flex-row items-center mr-3 mb-2">
          <View className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: colors.notConnected }} />
          <Text className={`text-xxs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Not Connected</Text>
        </View>
        <View className="flex-row items-center mb-2">
          <View className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: colors.closed }} />
          <Text className={`text-xxs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Closed</Text>
        </View>
      </View>
    </View>
  );
}

// 2. Conversion Analytics Donut Chart
export function ConversionDonutChart({ connected, notConnected, conversionRate, isDark }) {
  const size = 150;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const total = connected + notConnected;
  const connectedPercent = total > 0 ? (connected / total) * 100 : 0;
  const notConnectedPercent = total > 0 ? (notConnected / total) * 100 : 0;

  const strokeDashoffsetConnected = circumference - (connectedPercent / 100) * circumference;
  const strokeDashoffsetNotConnected = circumference - (notConnectedPercent / 100) * circumference;

  return (
    <View className="flex-row items-center justify-around py-4">
      {/* Circle Graph */}
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <G transform={`rotate(-90, ${size / 2}, ${size / 2})`}>
            {/* Background Circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={isDark ? '#1E293B' : '#E2E8F0'}
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Connected Circle segment */}
            {connected > 0 && (
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#10B981" // emerald-500
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffsetConnected}
                strokeLinecap="round"
                fill="none"
              />
            )}
            {/* Not Connected Circle segment (shifted) */}
            {notConnected > 0 && (
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#EF4444" // red-500
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffsetNotConnected}
                // Shift offset to start where connected ends
                transform={`rotate(${connected > 0 ? (connectedPercent / 100) * 360 : 0}, ${size / 2}, ${size / 2})`}
                strokeLinecap="round"
                fill="none"
              />
            )}
          </G>
        </Svg>
        {/* Inner Label */}
        <View className="absolute inset-0 justify-center items-center">
          <Text className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {conversionRate}%
          </Text>
          <Text className={`text-xxs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Conversions
          </Text>
        </View>
      </View>

      {/* Info Stats */}
      <View className="space-y-3 px-4">
        <View>
          <View className="flex-row items-center">
            <View className="w-3.5 h-3.5 bg-emerald-500 rounded-md mr-2" />
            <Text className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Connected Calls
            </Text>
          </View>
          <Text className={`text-lg font-bold ml-5.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {connected} <Text className={`text-xs font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>({Math.round(connectedPercent)}%)</Text>
          </Text>
        </View>

        <View>
          <View className="flex-row items-center">
            <View className="w-3.5 h-3.5 bg-red-500 rounded-md mr-2" />
            <Text className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Not Connected
            </Text>
          </View>
          <Text className={`text-lg font-bold ml-5.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {notConnected} <Text className={`text-xs font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>({Math.round(notConnectedPercent)}%)</Text>
          </Text>
        </View>
        
        <View className="border-t border-slate-700/20 pt-2">
          <Text className={`text-xxs uppercase tracking-wider font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Total Logs Checked
          </Text>
          <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {total} Calls
          </Text>
        </View>
      </View>
    </View>
  );
}
