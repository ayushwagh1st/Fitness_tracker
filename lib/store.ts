import { create } from 'zustand';
import { User } from 'firebase/auth';

export interface UserProfile {
  name?: string;
  email: string;
  age?: number;
  weight?: number;
  goal?: 'Weight Loss' | 'Muscle Gain' | 'Maintain';
  xp: number;
  level: number;
  createdAt?: string;
  streak?: number;
  achievements?: string[];
}

interface AppState {
  user: User | null;
  profile: UserProfile | null;
  isAuthReady: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setAuthReady: (ready: boolean) => void;
  addXp: (amount: number) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  profile: null,
  isAuthReady: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setAuthReady: (ready) => set({ isAuthReady: ready }),
  addXp: (amount) => set((state) => {
    if (!state.profile) return state;
    const newXp = state.profile.xp + amount;
    const newLevel = Math.floor(newXp / 100);
    return {
      profile: {
        ...state.profile,
        xp: newXp,
        level: newLevel,
      }
    };
  }),
}));
