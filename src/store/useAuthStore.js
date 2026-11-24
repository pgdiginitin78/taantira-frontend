import { create } from "zustand";
import api, {
  setAuthToken,
  getAuthToken,
  setRefreshToken,
  getRefreshToken,
  clearAuthTokens,
} from "../services/api";
import { disconnectSocket } from "../services/socket";
import { useCartStore } from "./useCartStore";
import { useWishlistStore } from "./useWishlistStore";

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: Boolean(getAuthToken()),
  loading: false,
  initialized: false,

  hydrate: async () => {
    const token = getAuthToken();
    const refresh = getRefreshToken();
    if (!token && !refresh) {
      set({ user: null, isAuthenticated: false, initialized: true });
      useCartStore.getState().fetchCart();
      useWishlistStore.getState().fetchWishlist();
      return null;
    }
    try {
      let activeToken = token;
      if (!activeToken && refresh) {
        const refreshRes = await api.post("/auth/refresh", { refreshToken: refresh });
        activeToken = refreshRes.data?.data?.accessToken || null;
        if (activeToken) {
          setAuthToken(activeToken);
        }
        if (refreshRes.data?.data?.refreshToken) {
          setRefreshToken(refreshRes.data.data.refreshToken);
        }
      }
      if (!activeToken) {
        clearAuthTokens();
        set({ user: null, isAuthenticated: false, initialized: true });
        return null;
      }
      const res = await api.get("/auth/me");
      const user = res.data?.data?.user || null;
      set({ user, isAuthenticated: Boolean(user), initialized: true });
      await Promise.all([
        useCartStore.getState().fetchCart(),
        useWishlistStore.getState().fetchWishlist(),
      ]);
      return user;
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        clearAuthTokens();
      }
      set({ user: null, isAuthenticated: false, initialized: true });
      useCartStore.getState().fetchCart();
      useWishlistStore.getState().fetchWishlist();
      return null;
    }
  },

  login: async (credentials) => {
    set({ loading: true });
    try {
      const res = await api.post("/auth/login", credentials);
      const { accessToken, refreshToken, user } = res.data.data;
      setAuthToken(accessToken);
      if (refreshToken) {
        setRefreshToken(refreshToken);
      }
      await Promise.all([
        useCartStore.getState().syncGuestCartToServer(),
        useWishlistStore.getState().syncGuestWishlistToServer(),
      ]);
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
      const res = await api.post("/auth/register", payload);
      const { accessToken, refreshToken, user } = res.data.data;
      setAuthToken(accessToken);
      if (refreshToken) {
        setRefreshToken(refreshToken);
      }
      await Promise.all([
        useCartStore.getState().syncGuestCartToServer(),
        useWishlistStore.getState().syncGuestWishlistToServer(),
      ]);
      set({ user, isAuthenticated: true, loading: false, initialized: true });
      return user;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: async () => {
    const refreshToken = getRefreshToken();
    try {
      await api.post("/auth/logout", refreshToken ? { refreshToken } : {});
    } catch {
      // Ignore network errors during logout cleanup
    }
    clearAuthTokens();
    disconnectSocket();
    set({ user: null, isAuthenticated: false });
    useCartStore.getState().fetchCart();
    useWishlistStore.getState().fetchWishlist();
  },
}));

if (typeof window !== "undefined") {
  window.addEventListener("taantira:auth-expired", () => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
    useCartStore.getState().fetchCart();
    useWishlistStore.getState().fetchWishlist();
  });
}
