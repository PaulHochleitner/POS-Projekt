import { create } from 'zustand';
import { authApi } from '../api/authApi';

interface AuthState {
  token: string | null;
  username: string | null;
  email: string | null;
  isAuthenticated: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  initFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  username: null,
  email: null,
  isAuthenticated: false,
  error: null,

  login: async (username, password) => {
    try {
      set({ error: null });
      const res = await authApi.login(username, password);
      localStorage.setItem('token', res.token);
      localStorage.setItem('username', res.username);
      localStorage.setItem('email', res.email);
      set({ token: res.token, username: res.username, email: res.email, isAuthenticated: true });
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Login fehlgeschlagen';
      set({ error: msg });
      throw e;
    }
  },

  register: async (username, email, password) => {
    try {
      set({ error: null });
      const res = await authApi.register(username, email, password);
      localStorage.setItem('token', res.token);
      localStorage.setItem('username', res.username);
      localStorage.setItem('email', res.email);
      set({ token: res.token, username: res.username, email: res.email, isAuthenticated: true });
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Registrierung fehlgeschlagen';
      set({ error: msg });
      throw e;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    set({ token: null, username: null, email: null, isAuthenticated: false, error: null });
  },

  initFromStorage: () => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const email = localStorage.getItem('email');
    if (token && username) {
      set({ token, username, email, isAuthenticated: true });
    }
  },
}));
