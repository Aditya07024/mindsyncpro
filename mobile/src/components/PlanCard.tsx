import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { Theme } from '../theme';

export interface PlanData {
  _id?: string;
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year' | 'one-time';
  durationMonths?: number;
  features: string[];
  audience: string;
  highlighted?: boolean;
}

interface PlanCardProps {
  plan: PlanData;
  isActive?: boolean;
  onPress: () => void;
  btnLabel?: string;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  isActive = false,
  onPress,
  btnLabel,
}) => {
  const isHighlighted = plan.highlighted || plan.name.toLowerCase().includes('shanti');

  return (
    <View
      className={`rounded-3xl p-6 mb-6 relative border shadow-sm ${
        isHighlighted
          ? 'bg-primary border-primary shadow-primary/20'
          : isActive
          ? 'bg-white border-primary/50'
          : 'bg-white border-surface-high'
      }`}
    >
      {isHighlighted && (
        <View className="absolute -top-3.5 right-5 bg-gold px-3 py-1 rounded-full shadow-sm">
          <Text className="font-sora-bold text-[10px] text-primary tracking-wider">MOST POPULAR</Text>
        </View>
      )}

      {isActive && (
        <View className="absolute -top-3.5 left-5 bg-emerald-600 px-3 py-1 rounded-full shadow-sm">
          <Text className="font-sora-bold text-[10px] text-white tracking-wider">✓ ACTIVE</Text>
        </View>
      )}

      {btnLabel === 'Payment Pending' && (
        <View className="absolute -top-3.5 right-5 bg-amber-500 px-3 py-1 rounded-full shadow-sm">
          <Text className="font-sora-bold text-[10px] text-white tracking-wider">PAYMENT PENDING</Text>
        </View>
      )}

      <Text className={`font-sora-bold text-xl mb-2 ${isHighlighted ? 'text-white' : 'text-on-surface'}`}>
        {plan.name}
      </Text>

      <View className="flex-row items-baseline mb-4">
        <Text className={`font-sora-bold text-lg mr-1 ${isHighlighted ? 'text-white' : 'text-on-surface'}`}>₹</Text>
        <Text className={`font-sora-bold text-3xl ${isHighlighted ? 'text-white' : 'text-on-surface'}`}>
          {plan.price}
        </Text>
        <Text className={`font-jakarta text-xs ml-1 ${isHighlighted ? 'text-white/80' : 'text-text-muted'}`}>
          /{plan.durationMonths && plan.durationMonths > 1
            ? `${plan.durationMonths} mo`
            : plan.interval === 'one-time'
            ? 'session'
            : plan.interval === 'year'
            ? 'yr'
            : 'mo'}
        </Text>
      </View>

      <View className={`h-[1px] my-3 ${isHighlighted ? 'bg-white/20' : 'bg-surface-high'}`} />

      <View className="gap-2.5 mb-6">
        {plan.features.map((feature, idx) => (
          <View key={idx} className="flex-row items-center gap-2.5">
            <Check 
              size={16} 
              color={isHighlighted ? Theme.colors.gold : Theme.colors.primary} 
            />
            <Text className={`font-jakarta text-xs flex-1 ${isHighlighted ? 'text-white' : 'text-on-surface-variant'}`}>
              {feature}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={onPress}
        disabled={isActive || btnLabel === 'Payment Pending'}
        className={`h-12 rounded-full justify-center items-center ${
          isHighlighted
            ? 'bg-gold'
            : isActive
            ? 'bg-primary/20'
            : btnLabel === 'Payment Pending'
            ? 'bg-amber-100 border border-amber-300'
            : 'bg-primary'
        }`}
      >
        <Text
          className={`font-sora-bold text-sm ${
            isHighlighted
              ? 'text-primary'
              : isActive
              ? 'text-primary'
              : btnLabel === 'Payment Pending'
              ? 'text-amber-800'
              : 'text-white'
          }`}
        >
          {isActive ? 'Current Plan' : btnLabel || (plan.price === 0 ? 'Start Free' : 'Upgrade Now')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default PlanCard;
