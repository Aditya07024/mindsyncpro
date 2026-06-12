import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
    { name: 'mymindtherapyfriend-store' }
  )
);

export const FREE_DAILY_LIMIT = 500;
