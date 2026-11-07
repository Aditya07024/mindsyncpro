import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, ScrollView } from 'react-native';
import { ArrowLeft, Play, Pause, RefreshCw, Wind, Square, Hand, User, Zap, ChevronRight } from 'lucide-react-native';
import { Theme } from '../../theme';

interface BreatheScreenProps {
  navigation: any;
}

type Phase = { label: string; seconds: number };

interface Exercise {
  id: string;
  title: string;
  desc: string;
  icon: any;
  phases: Phase[];
  cycles: number;
  emergency?: boolean;
}

const EXERCISES: Exercise[] = [
  {
    id: '478',
    title: '4-7-8 Breath',
    desc: 'Calms a racing mind. Best before sleep.',
    icon: Wind,
    phases: [
      { label: 'Inhale', seconds: 4 },
      { label: 'Hold', seconds: 7 },
      { label: 'Exhale', seconds: 8 },
    ],
    cycles: 4,
  },
  {
    id: 'box',
    title: 'Box Breathing',
    desc: 'Used by Navy SEALs. Resets your nervous system.',
    icon: Square,
    phases: [
      { label: 'Inhale', seconds: 4 },
      { label: 'Hold', seconds: 4 },
      { label: 'Exhale', seconds: 4 },
      { label: 'Hold', seconds: 4 },
    ],
    cycles: 5,
  },
  {
    id: 'grounding',
    title: '5-4-3-2-1 Grounding',
    desc: 'Pull yourself back to the present.',
    icon: Hand,
    phases: [
      { label: 'Notice 5 things you SEE', seconds: 15 },
      { label: 'Notice 4 things you can TOUCH', seconds: 12 },
      { label: 'Notice 3 things you HEAR', seconds: 10 },
      { label: 'Notice 2 things you SMELL', seconds: 8 },
      { label: 'Notice 1 thing you TASTE', seconds: 5 },
    ],
    cycles: 1,
  },
  {
    id: 'scan',
    title: 'Body Scan',
    desc: 'Release tension you didn\'t know you held.',
    icon: User,
    phases: [
      { label: 'Soften your forehead', seconds: 8 },
      { label: 'Relax your jaw', seconds: 8 },
      { label: 'Drop your shoulders', seconds: 8 },
      { label: 'Unclench your hands', seconds: 8 },
      { label: 'Feel your feet', seconds: 8 },
    ],
    cycles: 1,
  },
  {
    id: 'emergency',
    title: 'Emergency Calm',
    desc: '3 cycles. For when you need it now.',
    icon: Zap,
    emergency: true,
    phases: [
      { label: 'Inhale slowly', seconds: 4 },
      { label: 'Hold', seconds: 2 },
      { label: 'Long exhale', seconds: 6 },
    ],
    cycles: 3,
  },
];

export const BreatheScreen: React.FC<BreatheScreenProps> = ({ navigation }) => {
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);

  // Player state
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cycle, setCycle] = useState(1);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const circleScale = useRef(new Animated.Value(1.0)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Set up details for active exercise
  useEffect(() => {
    if (activeExercise) {
      setPhaseIdx(0);
      setCycle(1);
      setSecondsLeft(activeExercise.phases[0].seconds);
      setIsPlaying(false);
      setIsDone(false);
      circleScale.setValue(1.0);
    }
  }, [activeExercise]);

  const getPhaseScale = (idx: number) => {
    if (!activeExercise) return 1.0;
    const label = activeExercise.phases[idx].label.toLowerCase();
    const isInhale = label.includes('inhale') || label.includes('notice');
    const isExhale =
      label.includes('exhale') ||
      label.includes('relax') ||
      label.includes('soften') ||
      label.includes('drop') ||
      label.includes('unclench');
    
    return isInhale ? 2.0 : isExhale ? 0.8 : 1.3;
  };

  const startPhaseAnimation = (durationMs: number) => {
    if (!activeExercise) return;
    const targetScale = getPhaseScale(phaseIdx);

    Animated.timing(circleScale, {
      toValue: targetScale,
      duration: durationMs,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const triggerAnimationForPhase = (idx: number) => {
    if (!activeExercise) return;
    const targetScale = getPhaseScale(idx);
    const duration = activeExercise.phases[idx].seconds * 1000;

    Animated.timing(circleScale, {
      toValue: targetScale,
      duration: duration,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  // Main ticking interval
  useEffect(() => {
    if (!activeExercise || isDone || !isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    // Start circle animation for current phase with remaining time
    startPhaseAnimation(secondsLeft * 1000);

    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s > 1) {
          return s - 1;
        }

        // Advance phase
        let nextPhaseIdx = phaseIdx + 1;
        if (nextPhaseIdx < activeExercise.phases.length) {
          setPhaseIdx(nextPhaseIdx);
          const nextSecs = activeExercise.phases[nextPhaseIdx].seconds;
          triggerAnimationForPhase(nextPhaseIdx);
          return nextSecs;
        } else {
          // Advance cycle
          const nextCycle = cycle + 1;
          if (nextCycle <= activeExercise.cycles) {
            setCycle(nextCycle);
            setPhaseIdx(0);
            const firstSecs = activeExercise.phases[0].seconds;
            triggerAnimationForPhase(0);
            return firstSecs;
          } else {
            // Exercise complete
            setIsDone(true);
            setIsPlaying(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
        }
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeExercise, isPlaying, phaseIdx, cycle, isDone]);

  const handleStart = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
    circleScale.stopAnimation();
  };

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(false);
    setIsDone(false);
    if (activeExercise) {
      setPhaseIdx(0);
      setCycle(1);
      setSecondsLeft(activeExercise.phases[0].seconds);
    }
    circleScale.setValue(1.0);
  };

  const handleBack = () => {
    if (activeExercise) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setActiveExercise(null);
    } else {
      navigation.goBack();
    }
  };

  // Rendering selection list
  if (!activeExercise) {
    return (
      <View className="flex-1 bg-surface">
        <View className="flex-row items-center pt-12 px-5 gap-2">
          <TouchableOpacity onPress={handleBack} className="w-[38px] h-[38px] rounded-full bg-white justify-center items-center border border-[#E0E2E0]">
            <ArrowLeft size={20} color={Theme.colors.onSurface} />
          </TouchableOpacity>
          <Text className="font-sora text-lg text-onSurface">Breathe & Ground</Text>
        </View>

        <ScrollView contentContainerClassName="px-5 pt-3 pb-8 gap-3">
          <View className="mb-1">
            <Text className="font-sora-bold text-3xl text-primary">Guided Exercises</Text>
            <Text className="font-jakarta text-sm text-[#71787D] mt-1">Choose a practice to calm your mind and body.</Text>
          </View>

          {EXERCISES.map((ex) => {
            const Icon = ex.icon;
            return (
              <TouchableOpacity
                key={ex.id}
                onPress={() => setActiveExercise(ex)}
                className={`flex-row items-center rounded-3xl p-4 border shadow-sm ${
                  ex.emergency ? 'bg-[#FFF5F5] border-crisis/25' : 'bg-white border-[#E0E2E0]'
                }`}
                activeOpacity={0.8}
              >
                <View
                  className={`w-12 h-12 rounded-2xl justify-center items-center mr-4 ${
                    ex.emergency ? 'bg-crisis' : 'bg-primary/10'
                  }`}
                >
                  <Icon size={22} color={ex.emergency ? '#FFF' : Theme.colors.primary} />
                </View>

                <View className="flex-1">
                  <Text className={`font-sora text-base mb-1 ${ex.emergency ? 'text-crisis' : 'text-onSurface'}`}>
                    {ex.title}
                  </Text>
                  <Text className="font-jakarta text-xs text-[#71787D] leading-4">{ex.desc}</Text>
                </View>

                <ChevronRight size={18} color={ex.emergency ? Theme.colors.error : Theme.colors.outline} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  // Rendering Player
  const currentPhase = activeExercise.phases[phaseIdx];
  const isHolding = currentPhase.label.toLowerCase().includes('hold');
  const ringColor = isHolding
    ? Theme.colors.gold + '25'
    : currentPhase.label.toLowerCase().includes('inhale') || currentPhase.label.toLowerCase().includes('notice')
    ? Theme.colors.primary + '30'
    : Theme.colors.secondaryContainer + '30';

  return (
    <View className="flex-1 bg-surface">
      <View className="flex-row items-center pt-12 px-5 gap-2">
        <TouchableOpacity onPress={handleBack} className="w-[38px] h-[38px] rounded-full bg-white justify-center items-center border border-[#E0E2E0]">
          <ArrowLeft size={20} color={Theme.colors.onSurface} />
        </TouchableOpacity>
        <Text className="font-sora text-lg text-onSurface">{activeExercise.title}</Text>
      </View>

      <View className="flex-1 justify-center items-center px-5 gap-6">
        {!isDone ? (
          <>
            <Text className="font-jakarta-bold text-[13px] text-primary bg-primary/15 px-3 py-1 rounded-full">
              Cycle {cycle}/{activeExercise.cycles}
            </Text>

            <View className="w-60 h-60 justify-center items-center relative">
              <Animated.View
                className="absolute w-[100px] h-[100px] rounded-full"
                style={{
                  transform: [{ scale: circleScale }],
                  backgroundColor: ringColor,
                }}
              />

              <View className="w-[120px] h-[120px] rounded-full bg-white border-[1.5px] border-[#E0E2E0] justify-center items-center shadow-md">
                <Text className="font-sora-bold text-3xl text-onSurface">{secondsLeft}s</Text>
                <Text className="font-jakarta-bold text-[9px] text-[#71787D] tracking-wider mt-0.5 text-center">
                  {isPlaying ? currentPhase.label.toUpperCase() : 'PAUSED'}
                </Text>
              </View>
            </View>

            <View className="items-center px-2">
              <Text className="font-sora-bold text-2xl text-primary text-center">{currentPhase.label}</Text>
              <Text className="font-jakarta text-[13px] text-onSurfaceVariant text-center mt-1.5 leading-[18px]">
                {isPlaying ? 'Follow the pacing circle...' : 'Tap start to begin'}
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              {isPlaying ? (
                <TouchableOpacity onPress={handlePause} className="flex-row border-[1.5px] border-primary px-6 py-3.5 rounded-full items-center gap-2">
                  <Pause size={22} color={Theme.colors.primary} />
                  <Text className="text-primary font-sora text-sm">Pause</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={handleStart} className="flex-row bg-primary px-6 py-3.5 rounded-full items-center gap-2">
                  <Play size={22} color="#FFF" fill="#FFF" />
                  <Text className="text-white font-sora text-sm">Start Practice</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={handleReset} className="w-12 h-12 rounded-full border border-[#E0E2E0] justify-center items-center bg-white">
                <RefreshCw size={18} color={Theme.colors.outline} />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View className="items-center px-4">
            <View className="w-[72px] h-[72px] rounded-full bg-primary/10 justify-center items-center mb-5">
              <Wind size={36} color={Theme.colors.primary} />
            </View>
            <Text className="font-sora-bold text-3xl text-primary text-center mb-2">Well done.</Text>
            <Text className="font-jakarta text-[15px] text-[#71787D] text-center leading-[22px] mb-8">Notice how your body and mind feel right now.</Text>
            
            <TouchableOpacity onPress={handleBack} className="bg-primary px-8 py-4 rounded-full">
              <Text className="text-white font-sora text-[15px]">Close Practice</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

export default BreatheScreen;
