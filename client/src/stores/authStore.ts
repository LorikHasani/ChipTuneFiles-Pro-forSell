import { create } from 'zustand';
import api, { getErrorMessage } from '../lib/api';
import type { User, AuthResponse } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Computed
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;

  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
}

interface RegisterData {
  email: string;
  password: string;
  contactName: string;
  companyName?: string;
  phone?: string;
  country?: string;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: true,
  isInitialized: false,
  isAuthenticated: false,
  isAdmin: false,
  isSuperAdmin: false,

  initialize: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isLoading: false, isInitialized: true });
      return;
    }

    try {
      const { data } = await api.get<{ user: User }>('/auth/me');
      set({
        user: data.user,
        token,
        isAuthenticated: true,
        isAdmin: data.user.role === 'ADMIN' || data.user.role === 'SUPERADMIN',
        isSuperAdmin: data.user.role === 'SUPERADMIN',
        isLoading: false,
        isInitialized: true,
      });
    } catch {
      // Token invalid
      localStorage.removeItem('token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isAdmin: false,
        isSuperAdmin: false,
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  login: async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    set({
      user: data.user,
      token: data.token,
      isAuthenticated: true,
      isAdmin: data.user.role === 'ADMIN' || data.user.role === 'SUPERADMIN',
      isSuperAdmin: data.user.role === 'SUPERADMIN',
    });
  },

  register: async (registerData: RegisterData) => {
    const { data } = await api.post<AuthResponse>('/auth/register', registerData);
    localStorage.setItem('token', data.token);
    set({
      user: data.user,
      token: data.token,
      isAuthenticated: true,
      isAdmin: false,
      isSuperAdmin: false,
    });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,
      isSuperAdmin: false,
    });
    window.location.href = '/login';
  },

  updateProfile: async (updates: Partial<User>) => {
    const { data } = await api.put<{ user: User }>('/auth/me', updates);
    set({
      user: data.user,
      isAdmin: data.user.role === 'ADMIN' || data.user.role === 'SUPERADMIN',
      isSuperAdmin: data.user.role === 'SUPERADMIN',
    });
  },

  refreshUser: async () => {
    try {
      const { data } = await api.get<{ user: User }>('/auth/me');
      set({
        user: data.user,
        isAdmin: data.user.role === 'ADMIN' || data.user.role === 'SUPERADMIN',
        isSuperAdmin: data.user.role === 'SUPERADMIN',
      });
    } catch {
      // Silently fail
    }
  },

  setUser: (user: User) => {
    set({
      user,
      isAdmin: user.role === 'ADMIN' || user.role === 'SUPERADMIN',
      isSuperAdmin: user.role === 'SUPERADMIN',
    });
  },
}));
