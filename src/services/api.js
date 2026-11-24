import axios from "axios";

const DEFAULT_API_BASE_URL = import.meta.env.PROD
  ? "https://taantira-backend.vercel.app/api"
  : "http://localhost:5000/api";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;

export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, "");

let accessTokenMemory = localStorage.getItem("taantira_access_token") || null;
let refreshTokenMemory = localStorage.getItem("taantira_refresh_token") || null;

export const setAuthToken = (token) => {
  accessTokenMemory = token || null;
  if (token) {
    localStorage.setItem("taantira_access_token", token);
  } else {
    localStorage.removeItem("taantira_access_token");
  }
};

export const setRefreshToken = (token) => {
  refreshTokenMemory = token || null;
  if (token) {
    localStorage.setItem("taantira_refresh_token", token);
  } else {
    localStorage.removeItem("taantira_refresh_token");
  }
};

export const clearAuthTokens = () => {
  setAuthToken(null);
  setRefreshToken(null);
};

export const getAuthToken = () => accessTokenMemory;
export const getRefreshToken = () => refreshTokenMemory;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (accessTokenMemory) {
    config.headers.Authorization = `Bearer ${accessTokenMemory}`;
  }
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !originalRequest?.url?.includes("/auth/login") &&
      !originalRequest?.url?.includes("/auth/register") &&
      !originalRequest?.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(
              `${API_BASE_URL}/auth/refresh`,
              refreshTokenMemory ? { refreshToken: refreshTokenMemory } : {},
              { withCredentials: true },
            )
            .finally(() => {
              refreshPromise = null;
            });
        }
        const res = await refreshPromise;
        const newToken = res.data?.data?.accessToken;
        const nextRefresh = res.data?.data?.refreshToken;
        if (newToken) {
          setAuthToken(newToken);
          if (nextRefresh) {
            setRefreshToken(nextRefresh);
          }
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshErr) {
        const status = refreshErr?.response?.status;
        if (status === 401 || status === 403) {
          clearAuthTokens();
          window.dispatchEvent(new CustomEvent("taantira:auth-expired"));
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
