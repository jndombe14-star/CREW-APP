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
      // A stale/expired persisted session can pass the client-side expiry check but still
      // get rejected by the server (invalid JWT) — sign out so the app doesn't stay stuck
      // holding a session it can never successfully use.
      if (/jwt|expired|invalid/i.test(error.message)) {
        await supabase.auth.signOut();
        set({ session: null, profile: null });
      }
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
let hasAppliedInitial = false;
let lastAccessToken: string | null = null;

// Circuit breaker: a corrupted/expired persisted session can make the SDK re-emit auth
// events in a tight burst while it retries a refresh that can never succeed. Without this,
// each event re-sets the store and re-renders the whole app, which can spiral into a
// "Maximum update depth exceeded" crash. If events fire faster than a real login/logout/
// refresh ever would, treat the session as unrecoverable and force a clean sign-out.
let recentEventTimestamps: number[] = [];
const BURST_WINDOW_MS = 2000;
const BURST_LIMIT = 6;

export function initAuthListener() {
  if (initialized) return;
  initialized = true;

  const applySession = (session: import('@supabase/supabase-js').Session | null) => {
    const nextToken = session?.access_token ?? null;
    if (hasAppliedInitial && nextToken === lastAccessToken) return;
    hasAppliedInitial = true;
    lastAccessToken = nextToken;

    useAuthStore.getState().setSession(session);
    if (session) {
      useAuthStore.getState().refreshProfile();
    } else {
      useAuthStore.getState().setProfile(null);
    }
  };

  supabase.auth.getSession().then(({ data }) => {
    applySession(data.session);
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    const now = Date.now();
    recentEventTimestamps = [...recentEventTimestamps, now].filter((t) => now - t < BURST_WINDOW_MS);
    if (recentEventTimestamps.length > BURST_LIMIT) {
      console.warn('Auth events firing in a tight burst — clearing session to break the loop.');
      recentEventTimestamps = [];
      lastAccessToken = null;
      supabase.auth.signOut();
      useAuthStore.setState({ session: null, profile: null, isInitializing: false });
      return;
    }
    applySession(session);
  });
}
