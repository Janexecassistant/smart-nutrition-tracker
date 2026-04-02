"use client";

import { create } from "zustand";
import { createClient } from "@supabase/supabase-js";
import { api } from "./api";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

interface AuthState {
  user: { id: string; email: string } | null;
  session: { access_token: string } | null;
  supabase: typeof supabase;
  isLoading: boolean;
  hasProfile: boolean | null; // null = not checked yet
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  checkProfile: () => Promise<boolean>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  supabase,
  isLoading: true,
  hasProfile: null,

  initialize: async () => {
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

    // Listen for auth state changes
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
    set({ user: null });
  },
}));
