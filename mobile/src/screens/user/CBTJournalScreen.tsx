import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { ArrowLeft, BookOpen, Sparkles, Check, AlertTriangle } from 'lucide-react-native';
import API from '../../lib/api';
import { Theme } from '../../theme';

interface CBTJournalScreenProps {
  navigation: any;
}

export const CBTJournalScreen: React.FC<CBTJournalScreenProps> = ({ navigation }) => {
  const [todayPrompt, setTodayPrompt] = useState('What thought has been on a loop today?');
  const [situation, setSituation] = useState('');
  const [thought, setThought] = useState('');
  const [feeling, setFeeling] = useState('');
  const [reframed, setReframed] = useState('');
  const [selectedDistortions, setSelectedDistortions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [tier, setTier] = useState('free');
  const [weekEntries, setWeekEntries] = useState(0);
  const [limitHit, setLimitHit] = useState(false);
  const [checkingLimit, setCheckingLimit] = useState(true);

  useEffect(() => {
    let active = true;
    API.journal.prompt()
      .then((res: any) => {
        if (active && res && res.prompt) {
          setTodayPrompt(res.prompt);
        }
      })
      .catch((err: any) => {
        console.warn("Failed to fetch random prompt from backend:", err);
      });

    Promise.all([
      API.subscription.get().catch(() => ({ tier: 'free' })),
      API.journal.list().catch(() => ({ entries: [] }))
    ]).then(([subRes, journalRes]: any) => {
      if (!active) return;
      const userTier = subRes?.tier ?? 'free';
      const journalsList = journalRes?.entries ?? [];
      
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentCount = journalsList.filter((j: any) => {
        const d = j.createdAt || j.date;
        return d && new Date(d) >= oneWeekAgo;
      }).length;
      
      setTier(userTier);
      setWeekEntries(recentCount);
      setLimitHit(userTier === 'free' && recentCount >= 3);
      setCheckingLimit(false);
    }).catch(err => {
      console.warn("Failed to load limit status:", err);
      if (active) setCheckingLimit(false);
    });

    return () => { active = false; };
  }, []);

  const distortionsList = [
    { id: 'all_or_nothing', label: 'All-or-Nothing', desc: 'Thinking in black-and-white' },
    { id: 'catastrophizing', label: 'Catastrophizing', desc: 'Expecting the absolute worst outcome' },
    { id: 'mind_reading', label: 'Mind Reading', desc: 'Assuming you know what others think' },
    { id: 'emotional_reasoning', label: 'Emotional Reasoning', desc: 'Taking feelings as absolute truth' },
    { id: 'overgeneralization', label: 'Overgeneralization', desc: 'Applying one negative event to all context' },
  ];

  const handleToggleDistortion = (id: string) => {
    if (selectedDistortions.includes(id)) {
      setSelectedDistortions(selectedDistortions.filter(x => x !== id));
    } else {
      setSelectedDistortions([...selectedDistortions, id]);
    }
  };

  const showAlert = (title: string, message: string, buttonText: string = 'OK', onPress?: () => void) => {
    if (Platform.OS === 'web') {
      alert(`${title}\n\n${message}`);
      if (onPress) onPress();
    } else {
      Alert.alert(title, message, [{ text: buttonText, onPress }]);
    }
  };

  const handleSave = async () => {
    if (!situation.trim()) {
      showAlert('Situation Required', 'Please describe what happened.');
      return;
    }
    if (!thought.trim()) {
      showAlert('Thought Required', 'Please write your automated negative thought.');
      return;
    }
    if (!feeling.trim()) {
      showAlert('Feeling Required', 'Please record your emotional feeling (e.g. anxious, sad).');
      return;
    }
    if (!reframed.trim()) {
      showAlert('Reframed Narrative Required', 'Please try reframing the thought objectively.');
      return;
    }

    setLoading(true);
    try {
      await API.journal.create({
        prompt: todayPrompt,
        situation,
        thought,
        feeling,
        reframe: reframed,
      });

      showAlert(
        'Reframed & Saved!',
        'Excellent cognitive restructuring. Practice this skill daily to build emotional resilience.',
        'Great',
        () => navigation.goBack()
      );
    } catch (err: any) {
      console.warn("Failed to save journal to backend:", err);
      showAlert(
        'Error',
        err.message || 'Failed to save thought sheet to server. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerClassName="p-5 pb-8 gap-4">
      {/* Header back button */}
      <View className="flex-row items-center pt-12 gap-2">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-[38px] h-[38px] rounded-full bg-white justify-center items-center border border-[#E0E2E0]">
          <ArrowLeft size={20} color={Theme.colors.onSurface} />
        </TouchableOpacity>
        <Text className="font-sora text-lg text-onSurface">Thought Journal</Text>
      </View>

      {/* Intro info box */}
      <View className="flex-row items-center bg-[#0D564D10] p-3 rounded-2xl gap-2">
        <Sparkles size={16} color={Theme.colors.primary} />
        <Text className="font-jakarta text-xs text-primary flex-1 leading-4">
          Use cognitive restructuring to challenge distressing automated thoughts and reframe them logically.
        </Text>
      </View>

      {/* Limit warning banner */}
      {limitHit && (
        <View className="flex-row items-start bg-[#FDF2F2] border border-[#F8D7DA] p-4 rounded-2xl gap-3">
          <AlertTriangle size={18} color="#DE4E37" style={{ marginTop: 2 }} />
          <View className="flex-1">
            <Text className="font-sora-bold text-sm text-[#842029]">Weekly Limit Reached</Text>
            <Text className="font-jakarta text-xs text-[#842029] leading-4 mt-0.5">
              You've used your {weekEntries} / 3 free journal entries for this week. Please upgrade to unlock unlimited journaling and AI insights.
            </Text>
          </View>
        </View>
      )}

      {/* Today Prompt Section */}
      <View className="bg-white border border-[#E0E2E0] rounded-3xl p-4 gap-1">
        <Text className="font-jakarta-bold text-[9px] text-primary tracking-wider">TODAY'S PROMPT</Text>
        <Text className="font-sora text-base text-onSurface">{todayPrompt}</Text>
      </View>

      {/* Step 1: Situation */}
      <View className="bg-white rounded-3xl p-4 border border-[#E0E2E0] gap-1.5">
        <Text className="font-jakarta-bold text-[10px] text-secondary tracking-wider">STEP 1</Text>
        <Text className="font-sora text-base text-onSurface">The Situation</Text>
        <Text className="font-jakarta text-xs text-[#71787D] leading-4 mb-1">
          What happened? Describe the trigger event objectively.
        </Text>
        <TextInput
          multiline
          numberOfLines={2}
          value={situation}
          onChangeText={setSituation}
          editable={!limitHit}
          placeholder={limitHit ? "Journaling is locked" : "e.g. 'Receiving a brief feedback email from my project supervisor...'"}
          placeholderTextColor={Theme.colors.outline}
          className={`border border-[#E0E2E0] rounded-2xl bg-[#F0F2F1] p-3 text-sm font-jakarta text-onSurface h-[60px] ${limitHit ? 'opacity-60' : ''}`}
          textAlignVertical="top"
        />
      </View>

      {/* Step 2: Automated Negative Thought */}
      <View className="bg-white rounded-3xl p-4 border border-[#E0E2E0] gap-1.5">
        <Text className="font-jakarta-bold text-[10px] text-secondary tracking-wider">STEP 2</Text>
        <Text className="font-sora text-base text-onSurface">Automated Negative Thought</Text>
        <Text className="font-jakarta text-xs text-[#71787D] leading-4 mb-1">
          What absolute, distressing thought went through your mind?
        </Text>
        <TextInput
          multiline
          numberOfLines={3}
          value={thought}
          onChangeText={setThought}
          editable={!limitHit}
          placeholder={limitHit ? "Journaling is locked" : "e.g. 'I will stumble during this team presentation, and everyone will think I am incompetent…'"}
          placeholderTextColor={Theme.colors.outline}
          className={`border border-[#E0E2E0] rounded-2xl bg-[#F0F2F1] p-3 text-sm font-jakarta text-onSurface h-[75px] ${limitHit ? 'opacity-60' : ''}`}
          textAlignVertical="top"
        />
      </View>

      {/* Step 3: Cognitive Distortions */}
      <View className="bg-white rounded-3xl p-4 border border-[#E0E2E0] gap-1.5">
        <Text className="font-jakarta-bold text-[10px] text-secondary tracking-wider">STEP 3</Text>
        <Text className="font-sora text-base text-onSurface">Identify Cognitive Distortions</Text>
        <Text className="font-jakarta text-xs text-[#71787D] leading-4 mb-1">
          Which emotional traps or biases are active in this thought? (Select multiple)
        </Text>

        <View className="gap-2 mt-1">
          {distortionsList.map(dist => {
            const active = selectedDistortions.includes(dist.id);
            return (
              <TouchableOpacity
                key={dist.id}
                disabled={limitHit}
                onPress={() => handleToggleDistortion(dist.id)}
                className={`flex-row justify-between items-center border rounded-2xl p-3 ${
                  active ? 'border-primary border-[1.5px] bg-primary/5' : 'border-[#E0E2E0] bg-[#F0F2F1]'
                } ${limitHit ? 'opacity-60' : ''}`}
              >
                <View className="flex-1 mr-2">
                  <Text className="font-sora text-[13px] text-onSurface">{dist.label}</Text>
                  <Text className="font-jakarta text-[11px] text-[#71787D] mt-0.5">{dist.desc}</Text>
                </View>
                {active && (
                  <View className="w-[18px] h-[18px] rounded-full bg-primary justify-center items-center">
                    <Check size={12} color="#FFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Step 4: Emotional Feeling */}
      <View className="bg-white rounded-3xl p-4 border border-[#E0E2E0] gap-1.5">
        <Text className="font-jakarta-bold text-[10px] text-secondary tracking-wider">STEP 4</Text>
        <Text className="font-sora text-base text-onSurface">Emotional Feeling</Text>
        <Text className="font-jakarta text-xs text-[#71787D] leading-4 mb-1">
          What emotion did you experience, and how intensely?
        </Text>
        <TextInput
          value={feeling}
          onChangeText={setFeeling}
          editable={!limitHit}
          placeholder={limitHit ? "Journaling is locked" : "e.g. 'Anxious and insecure (8/10)'"}
          placeholderTextColor={Theme.colors.outline}
          className={`border border-[#E0E2E0] rounded-2xl bg-[#F0F2F1] p-3 text-sm font-jakarta text-onSurface ${limitHit ? 'opacity-60' : ''}`}
        />
      </View>

      {/* Step 5: Logical Reframing */}
      <View className="bg-white rounded-3xl p-4 border border-[#E0E2E0] gap-1.5">
        <Text className="font-jakarta-bold text-[10px] text-secondary tracking-wider">STEP 5</Text>
        <Text className="font-sora text-base text-onSurface">Objective Fact-Based Reframe</Text>
        <Text className="font-jakarta text-xs text-[#71787D] leading-4 mb-1">
          Now challenge that thought. What would a supportive, neutral observer say is the realistic truth?
        </Text>
        <TextInput
          multiline
          numberOfLines={3}
          value={reframed}
          onChangeText={setReframed}
          editable={!limitHit}
          placeholder={limitHit ? "Journaling is locked" : "e.g. 'I may feel nervous, but I have prepared my slides thoroughly. Stumbling slightly is normal, and it does not make me incompetent.'"}
          placeholderTextColor={Theme.colors.outline}
          className={`border border-[#E0E2E0] rounded-2xl bg-[#F0F2F1] p-3 text-sm font-jakarta text-onSurface h-[75px] ${limitHit ? 'opacity-60' : ''}`}
          textAlignVertical="top"
        />
      </View>

      {/* Action btn */}
      {limitHit ? (
        <TouchableOpacity 
          onPress={() => navigation.navigate('Plans')} 
          className="flex-row bg-secondary h-[52px] rounded-full justify-center items-center gap-2"
        >
          <Sparkles size={18} color="#FFF" />
          <Text className="text-white font-sora text-sm">Upgrade to Unlimited Journaling</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          onPress={handleSave} 
          disabled={loading || checkingLimit}
          className="flex-row bg-primary h-[52px] rounded-full justify-center items-center gap-2"
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <BookOpen size={18} color="#FFF" />
              <Text className="text-white font-sora text-sm">Record Thought Sheet</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

export default CBTJournalScreen;
