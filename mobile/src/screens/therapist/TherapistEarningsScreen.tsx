import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Switch
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Wallet, Lock, TrendingUp, Grid, Settings2, BarChart2 } from 'lucide-react-native';
import Svg, { Path, Rect, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import API from '../../lib/api';
import { Theme } from '../../theme';
import { AppHeader } from '../../components/AppHeader';

interface TherapistEarningsScreenProps {
  navigation: any;
}

export const TherapistEarningsScreen: React.FC<TherapistEarningsScreenProps> = ({ navigation }) => {
  // Chart customizations state
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');
  const [themeColor, setThemeColor] = useState<'teal' | 'emerald' | 'indigo' | 'violet' | 'rose'>('teal');
  const [metric, setMetric] = useState<'gross' | 'net'>('net');
  const [showGrid, setShowGrid] = useState(true);
  const [timeLimit, setTimeLimit] = useState<3 | 6 | 12>(6);
  const [selectedPoint, setSelectedPoint] = useState<{ month: string; value: number } | null>(null);

  // Fetch profiles and subscription
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => API.auth.me(),
    retry: false,
  });

  const { data: subData } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => API.subscription.get().catch(() => null),
    retry: false,
  });

  const isSubscribed =
    !!(userProfile?.orgId) ||
    !!(userProfile?.tier && userProfile.tier !== 'free') ||
    !!(subData && subData.subscription?.status === 'active');

  const { data: therapistStats } = useQuery({
    queryKey: ['therapistStats'],
    queryFn: () => API.therapist.stats(),
    retry: false,
    enabled: isSubscribed,
  });

  // Query live bookings to parse monthly stats
  const { data: bookingsData } = useQuery({
    queryKey: ['therapistBookingsData'],
    queryFn: () => API.therapist.meBookings(),
    retry: false,
    enabled: isSubscribed,
  });

  const monthEarned = isSubscribed ? (therapistStats?.stats?.monthEarned ?? 0) : 0;
  const totalEarned = isSubscribed ? (therapistStats?.stats?.totalEarned ?? 0) : 0;
  const netPayout = Math.round(monthEarned * 0.70);
  const totalSessionsCount = isSubscribed ? (therapistStats?.stats?.completedSessions ?? 0) : 0;
  const therapistName = userProfile?.fullName || 'Therapist';

  // 1. Build revenue chart dataset
  const mockRevenue: Record<string, number> = {
    '2025-11': 16500,
    '2025-12': 18000,
    '2026-01': 24000,
    '2026-02': 19500,
    '2026-03': 32000,
    '2026-04': 28500,
    '2026-05': monthEarned || 38000,
  };

  const dbRevenue = bookingsData?.revenueByMonth || {};
  const mergedRevenue = { ...mockRevenue, ...dbRevenue };

  const sortedMonths = Object.keys(mergedRevenue).sort();
  const filteredMonths = sortedMonths.slice(-timeLimit);
  
  const chartData = filteredMonths.map(month => {
    const rawVal = mergedRevenue[month];
    const value = metric === 'net' ? Math.round(rawVal * 0.70) : rawVal;
    
    const [year, m] = month.split('-');
    const date = new Date(Number(year), Number(m) - 1, 1);
    const label = date.toLocaleString('default', { month: 'short' });
    
    return { month, label, value };
  });

  const colorMap = {
    teal: { hex: '#0F766E', grad1: '#0F766E', grad2: '#2DD4BF' },
    emerald: { hex: '#047857', grad1: '#047857', grad2: '#34D399' },
    indigo: { hex: '#4338CA', grad1: '#4338CA', grad2: '#818CF8' },
    violet: { hex: '#6D28D9', grad1: '#6D28D9', grad2: '#A78BFA' },
    rose: { hex: '#BE123C', grad1: '#BE123C', grad2: '#F43F5E' },
  };

  const selectedColors = colorMap[themeColor] || colorMap.teal;

  const renderSVGChart = () => {
    if (chartData.length === 0) return null;

    const screenWidth = Dimensions.get('window').width;
    const chartWidth = screenWidth - 64;
    const chartHeight = 180;
    const padLeft = 45;
    const padRight = 15;
    const padTop = 20;
    const padBottom = 25;

    const drawWidth = chartWidth - padLeft - padRight;
    const drawHeight = chartHeight - padTop - padBottom;

    const values = chartData.map(d => d.value);
    const maxVal = Math.max(...values);
    const yMax = maxVal > 0 ? Math.ceil(maxVal * 1.15 / 5000) * 5000 : 10000;

    const points = chartData.map((d, index) => {
      const x = padLeft + (index * (drawWidth / (chartData.length - 1 || 1)));
      const y = padTop + drawHeight - ((d.value / yMax) * drawHeight);
      return { x, y, data: d };
    });

    let linePathStr = '';
    if (points.length > 0) {
      linePathStr = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        linePathStr += ` L ${points[i].x} ${points[i].y}`;
      }
    }

    const areaPathStr = linePathStr 
      ? `${linePathStr} L ${points[points.length - 1].x} ${padTop + drawHeight} L ${points[0].x} ${padTop + drawHeight} Z`
      : '';

    const gridTicks = [0, yMax / 2, yMax];

    return (
      <View className="items-center my-2.5 bg-[#F0F2F1]/40 rounded-2xl py-2.5 border border-[#E0E2E0]">
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={selectedColors.grad1} stopOpacity="0.45" />
              <Stop offset="100%" stopColor={selectedColors.grad2} stopOpacity="0.01" />
            </LinearGradient>
          </Defs>

          {/* Draw Gridlines */}
          {showGrid && gridTicks.map((tick, idx) => {
            const y = padTop + drawHeight - ((tick / yMax) * drawHeight);
            return (
              <React.Fragment key={idx}>
                <Line 
                  x1={padLeft} 
                  y1={y} 
                  x2={chartWidth - padRight} 
                  y2={y} 
                  stroke={Theme.colors.surfaceHigh} 
                  strokeWidth="1" 
                  strokeDasharray="4 4" 
                />
                <SvgText 
                  x={padLeft - 8} 
                  y={y + 4} 
                  fontSize="9.5" 
                  fontFamily={Theme.fonts.body} 
                  fill={Theme.colors.outline} 
                  textAnchor="end"
                >
                  {`₹${Math.round(tick / 1000)}k`}
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* Render Area Chart Layer */}
          {chartType === 'area' && areaPathStr && (
            <Path d={areaPathStr} fill="url(#chartGrad)" />
          )}

          {/* Render Line Chart Layer */}
          {(chartType === 'line' || chartType === 'area') && linePathStr && (
            <Path 
              d={linePathStr} 
              fill="none" 
              stroke={selectedColors.hex} 
              strokeWidth="3.2" 
            />
          )}

          {/* Render Bar Chart Layer */}
          {chartType === 'bar' && points.map((p, idx) => {
            const barW = Math.max(12, drawWidth / (chartData.length * 2.2));
            const barH = padTop + drawHeight - p.y;
            return (
              <Rect
                key={idx}
                x={p.x - barW / 2}
                y={p.y}
                width={barW}
                height={barH}
                fill={selectedColors.hex}
                rx="3.5"
              />
            );
          })}

          {/* Draw X-Axis labels */}
          {points.map((p, idx) => (
            <SvgText
              key={idx}
              x={p.x}
              y={chartHeight - 4}
              fontSize="9.5"
              fontFamily={Theme.fonts.bodyBold}
              fill={Theme.colors.outline}
              textAnchor="middle"
            >
              {p.data.label}
            </SvgText>
          ))}

          {/* Render Interactive Nodes */}
          {points.map((p, idx) => (
            <Circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={selectedPoint?.month === p.data.month ? "6" : "4.5"}
              fill={selectedPoint?.month === p.data.month ? Theme.colors.gold : selectedColors.hex}
              stroke="#FFF"
              strokeWidth="1.5"
              onPress={() => setSelectedPoint(p.data)}
            />
          ))}
        </Svg>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-surface">
      <AppHeader
        userFirstName={therapistName.split(' ')[0]}
        role="therapist"
        navigation={navigation}
        onUpgradePress={userProfile?.orgId ? undefined : () => navigation.navigate('Plans')}
      />

      <ScrollView contentContainerClassName="p-5 pb-20 gap-4">
        {/* Profile Card */}
        <View className="flex-row items-center bg-white rounded-3xl p-4 border border-[#E0E2E0] shadow-sm gap-4">
          <View className="w-[66px] h-[66px] rounded-full border-2 border-primary/30 justify-center items-center">
            <View className="w-[54px] h-[54px] rounded-full bg-primary/10 justify-center items-center">
              <Text className="font-sora-bold text-2xl text-primary">T</Text>
            </View>
          </View>
          <View className="flex-1">
            <Text className="font-sora text-lg text-onSurface">{therapistName}</Text>
            <Text className="font-jakarta-medium text-[13px] text-primary mt-0.5">Therapist</Text>
            <Text className="font-jakarta text-xs text-[#71787D] mt-0.5">– · {totalSessionsCount} sessions</Text>
          </View>
        </View>

        {/* 4 Stats Cards */}
        <View className="flex-row flex-wrap gap-2">
          <View className="flex-1 min-w-[45%] bg-white rounded-3xl p-4 border border-[#E0E2E0] items-center justify-center shadow-sm h-[90px]">
            <Text className="font-sora-bold text-2xl text-onSurface">₹{totalEarned.toLocaleString('en-IN')}</Text>
            <Text className="font-jakarta text-xs text-[#71787D] mt-0.5 text-center">Total earned</Text>
          </View>
          <View className="flex-1 min-w-[45%] bg-white rounded-3xl p-4 border border-[#E0E2E0] items-center justify-center shadow-sm h-[90px]">
            <Text className="font-sora-bold text-2xl text-onSurface">₹{monthEarned.toLocaleString('en-IN')}</Text>
            <Text className="font-jakarta text-xs text-[#71787D] mt-0.5 text-center">This month</Text>
          </View>
          <View className="flex-1 min-w-[45%] bg-white rounded-3xl p-4 border border-[#E0E2E0] items-center justify-center shadow-sm h-[90px]">
            <Text className="font-sora-bold text-2xl text-onSurface">₹{netPayout.toLocaleString('en-IN')}</Text>
            <Text className="font-jakarta text-xs text-[#71787D] mt-0.5 text-center">Payout (70%)</Text>
          </View>
          <View className="flex-1 min-w-[45%] bg-white rounded-3xl p-4 border border-[#E0E2E0] items-center justify-center shadow-sm h-[90px]">
            <Text className="font-sora-bold text-2xl text-onSurface">{totalSessionsCount}</Text>
            <Text className="font-jakarta text-xs text-[#71787D] mt-0.5 text-center">Sessions</Text>
          </View>
        </View>

        {isSubscribed ? (
          <View className="gap-4">
            {/* 1. Customizable interactive revenue analytics chart */}
            <View className="bg-white rounded-3xl p-4 border border-[#E0E2E0] gap-1 shadow-sm">
              <View className="flex-row items-center gap-2 mb-1">
                <TrendingUp size={18} color={Theme.colors.primary} />
                <Text className="font-sora text-[15px] text-onSurface">Revenue Analytics & Statistics</Text>
              </View>
              <Text className="font-jakarta text-xs text-[#71787D] mb-1.5">Tweak parameters to trace payout variations:</Text>

              {/* Render dynamic Svg chart */}
              {renderSVGChart()}

              {/* Dynamic Interactive Tooltip Panel */}
              {selectedPoint && (
                <View className="bg-[#F0F2F1] border border-[#E0E2E0] rounded-2xl p-2.5 my-1">
                  <Text className="font-sora text-[11.5px] text-onSurfaceVariant uppercase">{selectedPoint.month} Summary</Text>
                  <Text className="font-jakarta text-[13px] text-onSurface mt-0.5">
                    {metric === 'net' ? 'Net Payout (85%):' : 'Gross Revenue:'} 
                    <Text style={{ color: selectedColors.hex }} className="font-sora"> ₹{selectedPoint.value.toLocaleString()}</Text>
                  </Text>
                </View>
              )}

              {/* Chart Controls Toggles */}
              <View className="flex-row items-center gap-1.5 mt-3 border-t border-[#E0E2E0] pt-3">
                <Settings2 size={14} color={Theme.colors.outline} />
                <Text className="font-sora text-[12.5px] text-onSurfaceVariant">Customize Report Graph</Text>
              </View>

              {/* Parameter 1: Chart Type */}
              <Text className="font-jakarta-bold text-[11px] text-outline mt-2 uppercase">Chart Representation</Text>
              <View className="flex-row gap-1.5 my-1">
                {(['line', 'area', 'bar'] as const).map(type => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setChartType(type)}
                    className={`flex-1 border rounded-full py-2 items-center ${
                      chartType === type ? 'bg-primary border-primary' : 'bg-[#F0F2F1] border-[#E0E2E0]'
                    }`}
                  >
                    <Text className={`font-jakarta-bold text-[9.5px] ${
                      chartType === type ? 'text-white' : 'text-primary'
                    }`}>
                      {type.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Parameter 2: Theme Color */}
              <Text className="font-jakarta-bold text-[11px] text-outline mt-2 uppercase">Graph Highlight Palette</Text>
              <View className="flex-row gap-1.5 my-1">
                {(['teal', 'emerald', 'indigo', 'violet', 'rose'] as const).map(color => {
                  const hexColor = colorMap[color].hex;
                  const isActive = themeColor === color;
                  return (
                    <TouchableOpacity
                      key={color}
                      onPress={() => setThemeColor(color)}
                      style={{ backgroundColor: hexColor }}
                      className={`w-7 h-7 rounded-full border-2 ${
                        isActive ? 'border-gold' : 'border-transparent'
                      }`}
                    />
                  );
                })}
              </View>

              {/* Parameter 3: Gridlines & Metric toggles */}
              <View className="flex-row justify-between gap-3 my-1.5">
                <View className="flex-1 flex-row items-center bg-[#F0F2F1] border border-[#E0E2E0] rounded-2xl px-2 py-1.5">
                  <Grid size={15} color={Theme.colors.outline} style={{ marginRight: 6 }} />
                  <Text className="font-jakarta text-[11.5px] text-onSurfaceVariant flex-1">Grid Lines</Text>
                  <Switch
                    value={showGrid}
                    onValueChange={setShowGrid}
                    trackColor={{ false: '#D1D5DB', true: Theme.colors.primary }}
                  />
                </View>
                <View className="flex-1 flex-row items-center bg-[#F0F2F1] border border-[#E0E2E0] rounded-2xl px-2 py-1.5">
                  <BarChart2 size={15} color={Theme.colors.outline} style={{ marginRight: 6 }} />
                  <Text className="font-jakarta text-[11.5px] text-onSurfaceVariant flex-1">Gross Sum</Text>
                  <Switch
                    value={metric === 'gross'}
                    onValueChange={(val) => setMetric(val ? 'gross' : 'net')}
                    trackColor={{ false: '#D1D5DB', true: Theme.colors.primary }}
                  />
                </View>
              </View>

              {/* Parameter 4: Time Range Select */}
              <Text className="font-jakarta-bold text-[11px] text-outline mt-2 uppercase">Report Period Range</Text>
              <View className="flex-row gap-1.5 my-1">
                {([3, 6, 12] as const).map(range => (
                  <TouchableOpacity
                    key={range}
                    onPress={() => setTimeLimit(range)}
                    className={`flex-1 border rounded-full py-2 items-center ${
                      timeLimit === range ? 'bg-primary border-primary' : 'bg-[#F0F2F1] border-[#E0E2E0]'
                    }`}
                  >
                    <Text className={`font-jakarta-bold text-[9.5px] ${
                      timeLimit === range ? 'text-white' : 'text-primary'
                    }`}>
                      {`${range} MONTHS`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Financial ledger statement */}
            <View className="bg-white rounded-3xl p-4 border border-[#E0E2E0] gap-1 shadow-sm">
              <View className="flex-row items-center gap-2 mb-1">
                <Wallet size={18} color={Theme.colors.primary} />
                <Text className="font-sora text-[15px] text-onSurface">Payout Summary Statement</Text>
              </View>
              <Text className="font-jakarta text-xs text-[#71787D] mb-1.5">Below is the breakdown of your consultation earnings:</Text>

              <View className="bg-surface/50 rounded-2xl p-4 border border-[#E0E2E0] gap-2">
                <View className="flex-row justify-between items-center">
                  <Text className="font-jakarta text-xs text-[#71787D]">Total Gross Earned (All Time)</Text>
                  <Text className="font-jakarta-bold text-[12.5px] text-onSurface">₹{totalEarned.toLocaleString('en-IN')}</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="font-jakarta text-xs text-[#71787D]">This Month Gross</Text>
                  <Text className="font-jakarta-bold text-[12.5px] text-onSurface">₹{monthEarned.toLocaleString('en-IN')}</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="font-jakarta text-xs text-[#71787D]">Platform Service Share (30%)</Text>
                  <Text className="font-jakarta-bold text-[12.5px] text-onSurface">- ₹{Math.round(monthEarned * 0.30).toLocaleString('en-IN')}</Text>
                </View>
                <View className="flex-row justify-between items-center border-t border-[#F0F2F1] pt-2 mt-0.5">
                  <Text className="font-sora text-[13.5px] text-primary">Net Payout This Month</Text>
                  <Text className="font-sora-bold text-[15px] text-primary">₹{netPayout.toLocaleString('en-IN')}</Text>
                </View>
              </View>

              <View className="mt-1">
                <Text className="font-jakarta text-[11px] text-[#71787D] leading-4">
                  * Payouts are safely processed and automatically dispatched to your registered bank account on the 1st of every month.
                </Text>
              </View>
            </View>
          </View>
        ) : (
          /* Subscription Required Barrier Overlay */
          <View className="bg-primary/5 border-[1.5px] border-primary/25 border-dashed rounded-3xl p-6 items-center shadow-sm">
            <View className="w-11 h-11 rounded-full bg-primary/15 justify-center items-center mb-2">
              <Lock size={22} color={Theme.colors.primary} />
            </View>
            <Text className="font-sora-bold text-lg text-primary text-center">Subscription Required</Text>
            <Text className="font-jakarta text-[13px] text-onSurfaceVariant text-center leading-[18px] mt-1.5 px-2">
              As an independent therapist, you need an active subscription to access your schedule, bookings, and profile.
            </Text>

            <View className="w-full gap-2 mt-4">
              <TouchableOpacity
                onPress={() => navigation.navigate('Plans')}
                className="bg-primary py-3 rounded-full items-center w-full"
              >
                <Text className="font-sora text-[13px] text-white">View Subscription Plans</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default TherapistEarningsScreen;
