import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { api } from "../lib/api";

interface AuthState {
  user: { id: string; email: string } | null;
  session: { access_token: string } | null;
  isLoading: boolean;
  hasProfile: boolean | null;
  initialize: () => Promise<void>;
  checkProfile: () => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  hasProfile: null,

  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        api.setToken(session.access_token);
        set({
          user: { id: session.user.id, email: session.user.email! },
          session: { access_token: session.access_token },
          isLoading: false,
        });
      } else {
        set({ user: null, session: null, isLoading: false });
      }
    } catch {
      set({ user: null, session: null, isLoading: false });
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        api.setToken(session.access_token);
        set({
          user: { id: session.user.id, email: session.user.email! },
          session: { access_token: session.access_token },
        });
      } else {
        api.setToken(null);
        set({ user: null, session: null, hasProfile: null });
      }
    });
  },

  checkProfile: async () => {
    try {
      const data = await api.get<{ needsOnboarding: boolean }>("/profile");
      const hasProfile = !data.needsOnboarding;
      set({ hasProfile });
      return hasProfile;
    } catch {
      set({ hasProfile: false });
      return false;
    }
  },

  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    api.setToken(null);
    set({ user: null, session: null, hasProfile: null });
  },
}));
