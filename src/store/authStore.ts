import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/database.types';

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  isInitializing: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  isInitializing: true,

  setSession: (session) => set({ session, isInitializing: false }),

  setProfile: (profile) => set({ profile }),

  refreshProfile: async () => {
    const userId = get().session?.user.id;
    if (!userId) {
      set({ profile: null });
      return;
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) {
      console.warn('Failed to load profile', error.message);
      return;
    }
    set({ profile: data });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null });
  },
}));

let initialized = false;

export function initAuthListener() {
  if (initialized) return;
  initialized = true;

  supabase.auth.getSession().then(({ data }) => {
    useAuthStore.getState().setSession(data.session);
    if (data.session) {
      useAuthStore.getState().refreshProfile();
    }
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.getState().setSession(session);
    if (session) {
      useAuthStore.getState().refreshProfile();
    } else {
      useAuthStore.getState().setProfile(null);
    }
  });
}
