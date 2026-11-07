import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  FileSpreadsheet,
  UserPlus,
  Play,
  RotateCcw,
  Terminal,
  ArrowUpFromLine
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import API from '../../lib/api';
import { Theme } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { useSyncStore } from '../../lib/syncStore';

export const OrgRequestsScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [manualEmail, setManualEmail] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string; size?: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Bind background sync worker store
  const {
    isSyncing,
    progress,
    currentStep,
    logs,
    fileName: activeFileName,
    matchedCount,
    startSync,
    resetSync
  } = useSyncStore();

  // Subscription check query
  const { data: subData, isLoading: isSubLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => API.subscription.get().catch(() => null),
    retry: false
  });

  const isSubscribed = subData?.subscription?.status === 'active';
  const hasRosterFeature = subData?.config?.enableRosterManagement !== false;

  // Query join requests
  const { data: reqData, isLoading, refetch } = useQuery({
    queryKey: ['org-join-requests'],
    queryFn: () => API.org.joinRequests(),
    retry: false
  });

  const handleJoinAction = async (userId: string, approve: boolean) => {
    setActionLoading(userId);
    try {
      if (approve) {
        await API.org.approveJoinRequest(userId);
        Alert.alert('Approved', 'Employee request approved successfully!');
      } else {
        await API.org.rejectJoinRequest(userId);
        Alert.alert('Rejected', 'Employee request rejected.');
      }
      refetch();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSelectSpreadsheet = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv'
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const file = result.assets[0];
      setSelectedFile({
        uri: file.uri,
        name: file.name,
        size: file.size
      });
    } catch (err: any) {
      Alert.alert('Selection Error', err.message || 'Failed to select spreadsheet');
    }
  };

  const handleUploadSpreadsheet = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const res = await API.org.uploadEmails(selectedFile.uri, selectedFile.name);
      
      Alert.alert(
        'Roster Synchronized!',
        res.message || `Spreadsheet whitelisted successfully in workspace database!`,
        [{ 
          text: 'Excellent', 
          onPress: () => {
            startSync(selectedFile.name, () => {
              refetch();
            });
            setSelectedFile(null);
            refetch();
          } 
        }]
      );
    } catch (err: any) {
      Alert.alert(
        'Upload Failed', 
        err.message || 'Server failed to extract clean email columns from file buffer.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleManualWhitelist = async () => {
    if (!manualEmail.trim() || !manualEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid corporate email address.');
      return;
    }

    try {
      await API.org.invite({ email: manualEmail.trim().toLowerCase() });
      Alert.alert(
        'Email Whitelisted',
        `"${manualEmail.trim().toLowerCase()}" has been manually whitelisted and an invitation was sent.`,
        [{ text: 'Ok', onPress: () => { setManualEmail(''); refetch(); } }]
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Manual whitelisting failed.');
    }
  };

  return (
    <View className="flex-1 bg-surface">
      <AppHeader
        userFirstName="BITS Wellness"
        role="org_admin"
        navigation={navigation}
      />

      {isSubLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : !isSubscribed || !hasRosterFeature ? (
        <View className="flex-1 justify-center items-center p-5">
          <View className="bg-white rounded-3xl p-6 border border-[#E0E2E0] items-center shadow-sm">
            <View className="w-12 h-12 rounded-full bg-[#FFF2F2] justify-center items-center mb-4 border border-[#FFCDD2]">
              <ArrowUpFromLine size={24} color={Theme.colors.primary} />
            </View>
            <Text className="font-sora text-lg text-onSurface text-center mb-2">
              {!isSubscribed ? 'Corporate Plan Required' : 'Roster Management Locked'}
            </Text>
            <Text className="font-jakarta text-[13px] text-[#71787D] text-center leading-[18px] px-4 mb-5">
              {!isSubscribed 
                ? 'As an organization or wellness sponsor, you need an active subscription plan to activate employee wellness seats and link network practitioners.'
                : 'Your current subscription plan tier does not include the employee roster management or whitelisting features. Upgrade to invite employees in bulk.'}
            </Text>

            <TouchableOpacity
              onPress={() => navigation.navigate('Plans', { role: 'org_admin' })}
              className="bg-primary px-5 py-3 rounded-2xl"
            >
              <Text className="font-jakarta-bold text-[13px] text-white">
                {!isSubscribed ? 'View Subscription Plans' : 'Upgrade Plan'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView contentContainerClassName="p-5 pb-16 gap-4">
          {/* Whitelist control board */}
          <View className="bg-white rounded-3xl p-4 border border-[#E0E2E0] shadow-sm">
            <Text className="font-sora text-base text-onSurface">Corporate Whitelist Manager</Text>
            <Text className="font-jakarta text-xs text-[#71787D] mt-0.5 leading-4 mb-3">
              Synchronize corporate directories to authorize users. Standard registrations matching whitelisted emails bypass admin screening automatically.
            </Text>

            {/* Sync status active view */}
            {(isSyncing || progress > 0) ? (
              <View className="bg-[#FAFDFD] border border-[#C3E5DE] rounded-3xl p-4 gap-2">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="font-sora text-sm text-onSurface">Background Whitelist Syncing</Text>
                    <Text className="font-jakarta text-[11px] text-outline mt-0.5" numberOfLines={1}>{activeFileName}</Text>
                  </View>
                  <View className={`px-2 py-1 rounded ${progress === 100 ? 'bg-[#D4EDDA]' : 'bg-[#FFF3CD]'}`}>
                    <Text className={`font-jakarta-bold text-[10px] ${progress === 100 ? 'text-[#155724]' : 'text-[#856404]'}`}>
                      {progress === 100 ? 'COMPLETE' : 'ACTIVE'}
                    </Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View className="h-1.5 bg-[#F0F2F1] rounded-full overflow-hidden mt-0.5">
                  <View className="h-full bg-primary" style={{ width: `${progress}%` }} />
                </View>

                <View className="flex-row justify-between mt-0.5">
                  <Text className="font-jakarta-bold text-[11px] text-primary">{currentStep}</Text>
                  <Text className="font-sora text-xs text-primary">{progress}%</Text>
                </View>

                {/* Real-time details counters */}
                <View className="flex-row gap-2 mt-1">
                  <View className="flex-1 bg-white border border-[#E6F4F1] rounded-2xl p-2 items-center">
                    <Text className="font-sora-bold text-base text-primary">{matchedCount}</Text>
                    <Text className="font-jakarta text-[9px] text-[#71787D] mt-0.5">Users Auto-Approved</Text>
                  </View>
                  <View className="flex-1 bg-white border border-[#E6F4F1] rounded-2xl p-2 items-center">
                    <Text className="font-sora-bold text-base text-primary">{progress >= 75 ? 'Yes' : 'Pending'}</Text>
                    <Text className="font-jakarta text-[9px] text-[#71787D] mt-0.5">Database Sync</Text>
                  </View>
                </View>

                {/* Monospace System Logs terminal */}
                <Text className="font-jakarta-bold text-[11px] text-onSurface mt-1.5 flex-row items-center gap-1">
                  <Terminal size={12} color={Theme.colors.outline} /> Real-time System Logs
                </Text>
                <View className="bg-[#1E1E1E] rounded-2xl p-2">
                  <ScrollView nestedScrollEnabled style={{ height: 110 }}>
                    {logs.map((log, index) => (
                      <Text key={index} className="font-mono text-[10px] text-[#00FF66] leading-3.5">
                        {log}
                      </Text>
                    ))}
                    {isSyncing && (
                      <View className="flex-row items-center gap-1.5 mt-0.5">
                        <ActivityIndicator size="small" color={Theme.colors.primary} style={{ transform: [{ scale: 0.7 }] }} />
                        <Text className="font-mono text-[10px] text-[#E0E0E0]">Background sync streaming...</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>

                {/* Actions */}
                {progress === 100 && (
                  <TouchableOpacity onPress={resetSync} className="h-[38px] border border-primary rounded-2xl flex-row justify-center items-center gap-1.5 mt-1">
                    <RotateCcw size={14} color={Theme.colors.primary} />
                    <Text className="font-sora text-xs text-primary">Reset Sync Worker</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View className="mt-1 gap-2">
                <Text className="font-jakarta-medium text-[13px] text-onSurface mb-1">Select Whitelist Directory Spreadsheet</Text>
                
                {!selectedFile ? (
                  <TouchableOpacity
                    onPress={handleSelectSpreadsheet}
                    className="h-[110px] border-2 border-dashed border-primary rounded-3xl bg-[#E6F4F1] justify-center items-center px-4 gap-1"
                  >
                    <ArrowUpFromLine size={28} color={Theme.colors.primary} className="mb-1" />
                    <Text className="font-sora text-[13px] text-primary">Pick Corporate Roster Spreadsheet</Text>
                    <Text className="font-jakarta text-[11px] text-outline">Supports Excel (.xlsx, .xls) and CSV formulas</Text>
                  </TouchableOpacity>
                ) : (
                  <View className="border border-[#E0E2E0] rounded-3xl p-3 bg-[#F0F2F1] gap-3">
                    <View className="flex-row items-center gap-2.5">
                      <FileSpreadsheet size={22} color={Theme.colors.primary} />
                      <View className="flex-1">
                        <Text className="font-sora text-[13px] text-onSurface" numberOfLines={1}>
                          {selectedFile.name}
                        </Text>
                        {selectedFile.size && (
                          <Text className="font-jakarta text-[11px] text-outline mt-0.5">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </Text>
                        )}
                      </View>
                    </View>

                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={handleUploadSpreadsheet}
                        disabled={uploading}
                        className={`flex-1 h-10 bg-primary rounded-2xl flex-row justify-center items-center gap-1.5 ${
                          uploading ? 'opacity-70' : ''
                        }`}
                      >
                        {uploading ? (
                          <ActivityIndicator color="#FFF" />
                        ) : (
                          <>
                            <Play size={13} color="#FFF" />
                            <Text className="font-sora text-xs text-white">Upload & Sync Roster</Text>
                          </>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setSelectedFile(null)}
                        disabled={uploading}
                        className="w-[65px] h-10 border border-outline rounded-2xl justify-center items-center"
                      >
                        <Text className="font-jakarta-bold text-xs text-outline">Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            <View className="h-[1px] bg-[#E0E2E0] my-4" />

            {/* Manual Entry */}
            <Text className="font-jakarta-medium text-[13px] text-onSurface mb-1">Add Single Email to Whitelist</Text>
            <View className="flex-row gap-2 mt-1">
              <TextInput
                placeholder="e.g. employee@company.com"
                placeholderTextColor={Theme.colors.outline}
                value={manualEmail}
                onChangeText={setManualEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                className="flex-1 h-12 border border-[#E0E2E0] rounded-2xl px-3 text-sm font-jakarta text-onSurface bg-[#F0F2F1]"
              />
              <TouchableOpacity onPress={handleManualWhitelist} className="w-12 h-12 rounded-2xl bg-primary justify-center items-center">
                <UserPlus size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Requests Logs */}
          <View className="gap-2">
            <Text className="font-sora text-base text-onSurface">Employee Join Requests</Text>
            <Text className="font-jakarta text-xs text-[#71787D] mt-0.5 leading-4 mb-3">
              Approve or deny employees and students requesting association with your workspace.
            </Text>

            {isLoading ? (
              <ActivityIndicator color={Theme.colors.primary} className="mt-6" />
            ) : !reqData?.joinRequests || reqData.joinRequests.length === 0 ? (
              <View className="items-center justify-center py-10 bg-white rounded-3xl border border-[#E0E2E0] gap-2">
                <Clock size={40} color={Theme.colors.outline} />
                <Text className="font-jakarta text-[13px] text-outline">No pending join requests.</Text>
              </View>
            ) : (
              reqData.joinRequests.map((req: any) => {
                const status = req.status || 'pending';
                const name = req.fullName || 'mymindtherapyfriend User';
                const emailText = req.email || req.phoneMasked || 'No Contact Info';

                return (
                  <View key={req.userId} className="bg-white rounded-3xl p-4 border border-[#E0E2E0] shadow-sm mb-2 gap-2">
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1 pr-2">
                        <Text className="font-sora text-[15px] text-onSurface">{name}</Text>
                        <Text className="font-jakarta text-xs text-outline mt-0.5">{emailText}</Text>
                        <Text className="font-jakarta text-[11px] text-[#71787D] mt-1">
                          Requested: {new Date(req.requestedAt || Date.now()).toLocaleDateString()}
                        </Text>
                      </View>
                      <View
                        className={`px-2 py-1 rounded ${
                          status === 'approved' ? 'bg-[#D4EDDA]' :
                          status === 'rejected' ? 'bg-[#F8D7DA]' : 'bg-[#FFF3CD]'
                        }`}
                      >
                        <Text
                          className={`font-jakarta-bold text-[10px] ${
                            status === 'approved' ? 'text-[#155724]' :
                            status === 'rejected' ? 'text-[#721C24]' : 'text-[#856404]'
                          }`}
                        >
                          {status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {req.autoApproved && (
                      <View className="flex-row items-center bg-[#E8F5E9] px-2 py-1.5 rounded-md gap-1.5">
                        <CheckCircle size={12} color="#155724" />
                        <Text className="font-jakarta-bold text-[11px] text-[#155724]">Auto-approved via whitelisted domain</Text>
                      </View>
                    )}

                    {status === 'pending' && (
                      <View className="flex-row gap-2 border-t border-[#E0E2E0] pt-2 mt-0.5">
                        <TouchableOpacity
                          disabled={actionLoading !== null}
                          onPress={() => handleJoinAction(req.userId, true)}
                          className={`flex-[2] h-[38px] bg-primary rounded-2xl flex-row justify-center items-center gap-1.5 ${
                            actionLoading === req.userId ? 'opacity-70' : ''
                          }`}
                        >
                          {actionLoading === req.userId ? (
                            <ActivityIndicator size="small" color="#FFF" />
                          ) : (
                            <>
                              <UserCheck size={14} color="#FFF" />
                              <Text className="font-sora text-xs text-white">Approve</Text>
                            </>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          disabled={actionLoading !== null}
                          onPress={() => handleJoinAction(req.userId, false)}
                          className={`flex-1 h-[38px] bg-[#FFF5F5] rounded-2xl border border-[#FFE3E3] flex-row justify-center items-center gap-1.5 ${
                            actionLoading === req.userId ? 'opacity-70' : ''
                          }`}
                        >
                          <UserX size={14} color="#FF6B6B" />
                          <Text className="font-sora text-xs text-[#FF6B6B]">Deny</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default OrgRequestsScreen;
