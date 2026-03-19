'use client';
import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  setLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  setAuth: (token, user) => {
    if (typeof window !== 'undefined') localStorage.setItem('bieli_token', token);
    set({ token, user, isAuthenticated: true, isLoading: false });
  },
  logout: () => {
    if (typeof window !== 'undefined') localStorage.removeItem('bieli_token');
    set({ user: null, token: null, isAuthenticated: false });
  },
  setLoading: (v) => set({ isLoading: v }),
}));
