import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Wallet, Plus, ArrowUpRight, ArrowDownLeft, ShieldCheck } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import API from '../../lib/api';

interface WalletScreenProps {
  navigation: any;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({ navigation }) => {
  const queryClient = useQueryClient();
  const [customAmount, setCustomAmount] = useState('');

  const { data: walletData, isLoading: walletLoading, refetch } = useQuery({
    queryKey: ['walletBalance'],
    queryFn: () => API.payment.getWalletBalance(),
  });

  const addFundsMutation = useMutation({
    mutationFn: (amount: number) => API.payment.addWalletFunds(amount),
    onSuccess: async (data: any) => {
      if (data.shortUrl) {
        await WebBrowser.openBrowserAsync(data.shortUrl);
        refetch();
        queryClient.invalidateQueries({ queryKey: ['walletBalance'] });
      } else {
        Alert.alert('Payment Error', 'Failed to retrieve payment link.');
      }
    },
    onError: (err: any) => {
      Alert.alert('Payment Error', err.message || 'Failed to initiate payment');
    },
  });

  const handleAddFunds = (amount: number) => {
    if (amount <= 0 || isNaN(amount)) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    addFundsMutation.mutate(amount);
  };

  const getPurposeLabel = (purpose: string) => {
    switch (purpose) {
      case 'add_funds':
        return 'Loaded Funds';
      case 'unlock_report':
        return 'Unlocked Wellness Report';
      case 'book_therapist':
        return 'Booked Therapist Session';
      default:
        return purpose;
    }
  };

  const balance = walletData?.walletBalance ?? 0;
  const transactions = walletData?.transactions ?? [];

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 16 }}>
      {/* Header back button */}
      <View className="flex-row items-center pt-12 gap-2.5">
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          className="w-[38px] h-[38px] rounded-full bg-white justify-center items-center border border-[#DFEBE7]"
        >
          <ArrowLeft size={20} color="#191C1B" />
        </TouchableOpacity>
        <Text className="font-sora-semibold text-lg text-[#191C1B]">My Wallet</Text>
      </View>

      {/* Balance Card */}
      <View className="bg-primary rounded-3xl p-4 gap-2 shadow-sm">
        <View className="flex-row justify-between items-center">
          <Text className="font-jakarta-bold text-[11px] text-white/70 tracking-widest">TOTAL BALANCE</Text>
          <View className="flex-row items-center bg-white/15 px-2 py-0.5 rounded-full gap-1">
            <ShieldCheck size={12} color="#FFF" />
            <Text className="font-jakarta-bold text-[9px] text-white">Secure</Text>
          </View>
        </View>
        {walletLoading ? (
          <ActivityIndicator color="#FFF" className="self-start my-2.5" />
        ) : (
          <Text className="font-sora-bold text-4xl text-white">₹{balance.toFixed(2)}</Text>
        )}
      </View>

      {/* Add Funds Panel */}
      <View className="bg-white rounded-3xl p-4 border border-[#DFEBE7] gap-2.5">
        <Text className="font-sora-semibold text-[15px] text-[#191C1B]">Add Funds to Wallet</Text>
        
        {/* Quick Amounts */}
        <View className="flex-row justify-between gap-2">
          {[100, 250, 500, 1000].map((amt) => (
            <TouchableOpacity
              key={amt}
              disabled={addFundsMutation.isPending}
              onPress={() => handleAddFunds(amt)}
              className="flex-1 h-[38px] rounded-2xl border border-[#DFEBE7] bg-[#F8FAF9] justify-center items-center"
            >
              <Text className="font-jakarta-bold text-xs text-[#4E615D]">+ ₹{amt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Input */}
        <View className="flex-row items-center border border-[#DFEBE7] rounded-2xl bg-[#F8FAF9] px-3 h-12">
          <Text className="font-sora-semibold text-base text-[#4E615D] mr-1.5">₹</Text>
          <TextInput
            placeholder="Enter custom amount"
            placeholderTextColor="#A1A1AA"
            keyboardType="numeric"
            value={customAmount}
            onChangeText={setCustomAmount}
            editable={!addFundsMutation.isPending}
            className="flex-1 text-sm font-jakarta text-[#191C1B]"
          />
          <TouchableOpacity
            disabled={addFundsMutation.isPending || !customAmount}
            onPress={() => {
              handleAddFunds(parseFloat(customAmount));
              setCustomAmount('');
            }}
            className={`flex-row items-center px-3.5 h-[34px] rounded-xl gap-1 ${!customAmount ? 'bg-slate-300' : 'bg-primary'}`}
          >
            {addFundsMutation.isPending ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Plus size={16} color="#FFF" />
                <Text className="text-white font-sora-semibold text-xs">Add</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Transaction History */}
      <View className="bg-white rounded-3xl p-4 border border-[#DFEBE7] gap-4">
        <Text className="font-sora-semibold text-[15px] text-[#191C1B]">Transaction History</Text>

        {walletLoading ? (
          <View className="py-5">
            <ActivityIndicator color="#0D564D" />
          </View>
        ) : transactions.length === 0 ? (
          <View className="items-center py-6 gap-1.5">
            <Wallet size={32} color="#717875" />
            <Text className="font-sora-semibold text-sm text-[#191C1B]">No transactions found</Text>
            <Text className="font-jakarta text-[11px] text-[#717875] text-center leading-4">
              Your transactions will appear here once you load or spend funds.
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {transactions.map((tx: any) => {
              const isCredit = tx.type === 'credit';
              const isSuccess = tx.status === 'success';

              return (
                <View key={tx._id || tx.id} className="flex-row justify-between items-center pb-3 border-b border-slate-100">
                  <View className="flex-row items-center gap-2 flex-1">
                    <View className={`w-9 h-9 rounded-full justify-center items-center ${isCredit ? 'bg-green-100' : 'bg-red-100'}`}>
                      {isCredit ? (
                        <ArrowDownLeft size={18} color="#2E7D32" />
                      ) : (
                        <ArrowUpRight size={18} color="#C62828" />
                      )}
                    </View>
                    <View className="flex-1 gap-0.5">
                      <View className="flex-row items-center gap-1.5 flex-wrap">
                        <Text className="font-jakarta-bold text-[13px] text-[#191C1B]">{getPurposeLabel(tx.purpose)}</Text>
                        <View className={`px-1.5 py-0.5 rounded ${isSuccess ? 'bg-green-100' : tx.status === 'pending' ? 'bg-amber-100' : 'bg-red-100'}`}>
                          <Text className={`font-jakarta-bold text-[8px] ${isSuccess ? 'text-green-800' : tx.status === 'pending' ? 'text-amber-800' : 'text-red-800'}`}>
                            {tx.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text className="font-jakarta text-[10px] text-[#717875]">
                        {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                  <Text className={`font-sora-bold text-sm ${isCredit ? 'text-green-700' : 'text-red-700'}`}>
                    {isCredit ? '+' : '-'} ₹{tx.amount.toFixed(2)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default WalletScreen;
