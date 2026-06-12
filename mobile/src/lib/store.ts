import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Concern = 'work' | 'family' | 'loneliness' | 'health' | 'relationships' | 'money';
export type NeedType = 'talk' | 'tools' | 'express';

type State = {
  hasOnboarded: boolean;
  firstName: string;
  initialMood: number | null;
  concerns: Concern[];
  need: NeedType | null;

  completeOnboarding: (data: { firstName: string; mood: number; concerns: Concern[]; need: NeedType }) => void;
  reset: () => void;
};

export const useStore = create<State>()(
  persist(
    (set) => ({
      hasOnboarded: false,
      firstName: '',
      initialMood: null,
      concerns: [],
      need: null,

      completeOnboarding: ({ firstName, mood, concerns, need }) => {
        set({
          hasOnboarded: true,
          firstName,
          initialMood: mood,
          concerns,
          need,
        });
      },
      reset: () =>
        set({
          hasOnboarded: false,
          firstName: '',
          initialMood: null,
          concerns: [],
          need: null,
        }),
    }),
    {
      name: 'mymindtherapyfriend-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const FREE_DAILY_LIMIT = 300;
export const ADMIN_PASSWORD = process.env.EXPO_PUBLIC_ADMIN_PASSWORD || 'admin'; // For Admin Portal protection
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.mymindtherapyfriend.online';
