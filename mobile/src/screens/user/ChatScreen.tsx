import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import { Send, AlertTriangle, Sparkles } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useStore, FREE_DAILY_LIMIT } from '../../lib/store';
import { ManasAvatar } from '../../components/ManasAvatar';
import { CrisisOverlay } from '../../components/CrisisOverlay';
import { detectCrisis } from '../../lib/crisis';
import API from '../../lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export const ChatScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const maxBubbleWidth = Math.min(windowWidth * 0.82, 560);
  const [profileName, setProfileName] = useState(useStore.getState().firstName || 'friend');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [crisis, setCrisis] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subData, setSubData] = useState<any>(null);

  const scrollRef = useRef<ScrollView>(null);

  const keyboard = useAnimatedKeyboard();
  const footerAnimatedStyle = useAnimatedStyle(() => {
    const tabOffset = keyboard.height.value > 0 ? Math.min(keyboard.height.value, 80) : 0;
    return {
      transform: [{ translateY: -keyboard.height.value + tabOffset }],
    };
  });
  const spacerAnimatedStyle = useAnimatedStyle(() => ({
    height: keyboard.height.value,
  }));

  // Load message history from MongoDB whenever the screen gains focus
  useFocusEffect(
    useCallback(() => {
      const loadHistory = async () => {
        try {
          const subInfo = await API.subscription.get().catch(() => null);
          setSubData(subInfo);

          const profile = await API.user.profile().catch(() => null);
          const resolvedFirstName = profile?.user?.fullName?.split(" ")[0] || useStore.getState().firstName || 'friend';
          setProfileName(resolvedFirstName);

          const history = await API.chat.getMessages();
          if (history && Array.isArray(history.messages) && history.messages.length > 0) {
            const fifteenDaysAgo = Date.now() - 15 * 24 * 60 * 60 * 1000;
            const mapped: Message[] = history.messages
              .map((m: any) => ({
                id: m._id || Math.random().toString(),
                role: m.role,
                content: m.content,
                timestamp: m.timestamp ? new Date(m.timestamp).getTime() : Date.now()
              }))
              .filter((m: Message) => m.timestamp >= fifteenDaysAgo && !m.content.includes("I'm having trouble responding right now"));
            setMessages(mapped);
          } else {
            setMessages([
              {
                id: 'initial',
                role: 'assistant',
                content: `Hi ${resolvedFirstName}. I'm Manas. Whatever brought you here — let's just sit with it together. What's on your mind?`,
                timestamp: Date.now()
              }
            ]);
          }
        } catch (err) {
          console.warn("Failed to fetch conversation history:", err);
          const resolvedFirstName = useStore.getState().firstName || 'friend';
          setMessages([
            {
              id: 'initial',
              role: 'assistant',
              content: `Hi ${resolvedFirstName}. I'm Manas. Whatever brought you here — let's just sit with it together. What's on your mind?`,
              timestamp: Date.now()
            }
          ]);
        } finally {
          setLoading(false);
        }
      };

      loadHistory();
    }, [])
  );

  const todayStr = new Date().toLocaleDateString('en-CA');
  const dailyLimit = subData?.usage?.dailyLimit !== undefined ? subData.usage.dailyLimit : FREE_DAILY_LIMIT;
  const usedToday = subData?.usage?.messagesUsedToday !== undefined ? subData.usage.messagesUsedToday : (messages.filter(m => 
    m.role === 'user' && 
    new Date(m.timestamp).toLocaleDateString('en-CA') === todayStr
  ).length || 0);

  const isUnlimited = dailyLimit === null;
  const remaining = isUnlimited ? Infinity : Math.max(0, dailyLimit - usedToday);
  const limitHit = !isUnlimited && remaining === 0;

  const handleSend = async () => {
    const text = input.trim();
    if (!text || streaming || limitHit) return;

    if (detectCrisis(text)) {
      setCrisis(true);
    }

    const userMsg: Message = {
      id: Math.random().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setStreaming(true);

    const placeholderId = Math.random().toString();
    const assistantPlaceholder: Message = {
      id: placeholderId,
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, assistantPlaceholder]);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res = await API.chat.sendMessage({ message: text });
      API.subscription.get().then(setSubData).catch(() => null);
      
      let replyText = res?.reply || "I am here with you. Can you tell me more about that?";
      
      let index = 0;
      const interval = setInterval(() => {
        if (index < replyText.length) {
          setMessages(prev => prev.map(m => 
            m.id === placeholderId ? { ...m, content: replyText.substring(0, index + 1) } : m
          ));
          index += 2;
          scrollRef.current?.scrollToEnd({ animated: false });
        } else {
          clearInterval(interval);
          setStreaming(false);
        }
      }, 20);

    } catch (err) {
      console.warn("API Chat fetch error, using graceful local empathy responder:", err);
      const fallbackReplies = [
        "I hear you. That sounds like a heavy weight to carry. Let's breathe through it together.",
        "Take a slow breath. Whatever you are feeling right now is completely okay to feel. Tell me more.",
        "Thank you for sharing that with me. I am right here with you. What do you feel in your body right now?"
      ];
      const randomReply = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
      
      let index = 0;
      const interval = setInterval(() => {
        if (index < randomReply.length) {
          setMessages(prev => prev.map(m => 
            m.id === placeholderId ? { ...m, content: randomReply.substring(0, index + 1) } : m
          ));
          index += 2;
          scrollRef.current?.scrollToEnd({ animated: false });
        } else {
          clearInterval(interval);
          setStreaming(false);
        }
      }, 20);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-surface justify-center items-center">
        <ActivityIndicator size="large" color="#0D564D" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      {/* Dynamic top bar */}
      <View 
        className="flex-row justify-between items-center px-4 pb-2 bg-white border-b border-[#DFEBE7]" 
        style={{ paddingTop: insets.top + 8 }}
      >
        <View className="flex-row items-center gap-2">
          <ManasAvatar size={34} />
          <View>
            <Text className="font-sora-semibold text-base text-[#191C1B]">Manas</Text>
            <View className="flex-row items-center gap-1 mt-0.5">
              <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <Text className="font-jakarta text-[11px] text-[#717875]">AI companion · always here</Text>
            </View>
          </View>
        </View>
        <View className={`px-2 py-0.5 rounded-full ${limitHit ? 'bg-red-100' : 'bg-primary/10'}`}>
          <Text className={`font-jakarta-bold text-[10px] ${limitHit ? 'text-red-700' : 'text-primary'}`}>
            {isUnlimited ? 'Unlimited' : `${remaining} left`}
          </Text>
        </View>
      </View>

      {/* Messages Feed */}
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, gap: 10 }}
      >
        {messages.map(m => {
          const isUser = m.role === 'user';
          return (
            <View 
              key={m.id} 
              className={`flex-row items-end gap-2 ${isUser ? 'self-end flex-row-reverse' : 'self-start'}`}
              style={{ maxWidth: maxBubbleWidth }}
            >
              {!isUser && (
                <View className="w-6 h-6 rounded-full bg-primary justify-center items-center mb-0.5">
                  <Sparkles size={12} color="#FFF" />
                </View>
              )}
              <View className={`rounded-3xl p-3 flex-shrink shadow-sm ${
                isUser ? 'bg-primary rounded-br-sm' : 'bg-white rounded-bl-sm border border-[#DFEBE7]'
              }`}>
                {m.content === '' && streaming ? (
                  <View className="flex-row gap-1 px-2 py-1.5">
                    <View className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                    <View className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                    <View className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                  </View>
                ) : (
                  <Text className={`font-jakarta text-[15px] leading-[22px] flex-shrink ${
                    isUser ? 'text-white' : 'text-[#191C1B]'
                  }`}>
                    {m.content}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
        <Animated.View style={spacerAnimatedStyle} />
      </ScrollView>

      <Animated.View style={[footerAnimatedStyle, { backgroundColor: 'transparent' }]} pointerEvents="box-none">
        {/* Limit Warning banner */}
        {limitHit && (
          <View className="bg-secondary/10 border border-secondary/25 rounded-2xl p-3 mx-4 mb-2">
            <View className="flex-row items-center gap-1.5 mb-0.5">
              <AlertTriangle size={16} color="#9D4223" />
              <Text className="font-sora-semibold text-[13px] text-secondary">Daily limit reached</Text>
            </View>
            <Text className="font-jakarta text-[11px] text-[#717875] leading-4">
              {dailyLimit <= 7
                ? 'Come back tomorrow, or upgrade to Mann Shanti (₹199/mo) for 100 messages a day.'
                : 'Come back tomorrow, or upgrade to Apna Therapist for unlimited messages.'}
            </Text>
          </View>
        )}

        {/* Input container */}
        <View 
          className="flex-row items-center gap-2 px-4 py-1 bg-transparent"
          style={{ paddingBottom: Math.max(insets.bottom, 8) + 80 }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            editable={!streaming && !limitHit}
            placeholder={limitHit ? 'Daily limit reached' : 'Type what you feel…'}
            placeholderTextColor="#A1A1AA"
            className="flex-1 h-[50px] rounded-full border-[1.5px] border-slate-200 px-4.5 text-sm font-jakarta text-[#191C1B] bg-white shadow-sm"
            onFocus={() => {
              requestAnimationFrame(() => {
                scrollRef.current?.scrollToEnd({ animated: false });
              });
            }}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || streaming || limitHit}
            className={`w-[50px] h-[50px] rounded-full bg-primary justify-center items-center shadow-md ${
              (!input.trim() || streaming || limitHit) ? 'opacity-40' : ''
            }`}
          >
            <Send size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <CrisisOverlay open={crisis} onClose={() => setCrisis(false)} />
    </View>
  );
};

export default ChatScreen;
