import React from 'react';
import { View, Text } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { Theme } from '../theme';

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: number; // e.g. +12 or -5
  trendLabel?: string; // e.g. "vs last month"
  icon: React.ReactNode;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  trend,
  trendLabel,
  icon,
  color = Theme.colors.primary,
}) => {
  const isPositive = trend && trend >= 0;

  return (
    <View className="bg-white rounded-2xl p-5 border border-surface-high flex-1 min-w-[140px] shadow-sm">
      <View className="flex-row justify-between items-center mb-2 gap-2">
        <Text className="font-jakarta-medium text-[13px] text-on-surface-variant flex-1" numberOfLines={1}>
          {title}
        </Text>
        <View className="w-8 h-8 rounded-lg justify-center items-center" style={{ backgroundColor: color + '15' }}>
          {icon}
        </View>
      </View>

      <Text className="font-sora-bold text-2xl text-on-surface mb-1.5" numberOfLines={1}>
        {value}
      </Text>

      {trend !== undefined && (
        <View className="flex-row items-center gap-1.5 flex-wrap">
          <View
            className="flex-row items-center gap-0.5 px-1.5 py-0.5 rounded"
            style={{ backgroundColor: isPositive ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)' }}
          >
            {isPositive ? (
              <TrendingUp size={12} color="#4CAF50" />
            ) : (
              <TrendingDown size={12} color="#F44336" />
            )}
            <Text
              className="font-jakarta-bold text-[10px]"
              style={{ color: isPositive ? '#4CAF50' : '#F44336' }}
            >
              {isPositive ? `+${trend}%` : `${trend}%`}
            </Text>
          </View>
          {trendLabel && <Text className="font-jakarta text-[10px] text-text-muted">{trendLabel}</Text>}
        </View>
      )}
    </View>
  );
};

export default StatCard;
