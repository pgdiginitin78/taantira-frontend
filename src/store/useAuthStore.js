import { create } from 'zustand';
import api, { setAuthToken, getAuthToken } from '../services/api';
import { disconnectSocket } from '../services/socket';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: Boolean(getAuthToken()),
  loading: false,
  initialized: false,

  hydrate: async () => {
    const token = getAuthToken();
    if (!token) {
      set({ user: null, isAuthenticated: false, initialized: true });
      return null;
    }
    try {
      const res = await api.get('/auth/me');
      const user = res.data?.data?.user || null;
      set({ user, isAuthenticated: Boolean(user), initialized: true });
      return user;
    } catch {
      setAuthToken(null);
      set({ user: null, isAuthenticated: false, initialized: true });
      return null;
    }
  },

  login: async (credentials) => {
    set({ loading: true });
    try {
      const res = await api.post('/auth/login', credentials);
      const { accessToken, user } = res.data.data;
      setAuthToken(accessToken);
      set({ user, isAuthenticated: true, loading: false, initialized: true });
      return user;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  register: async (payload) => {
    set({ loading: true });
    try {
      const res = await api.post('/auth/register', payload);
      const { accessToken, user } = res.data.data;
      setAuthToken(accessToken);
      set({ user, isAuthenticated: true, loading: false, initialized: true });
      return user;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors during logout cleanup
    }
    setAuthToken(null);
    disconnectSocket();
    set({ user: null, isAuthenticated: false });
  },
}));
