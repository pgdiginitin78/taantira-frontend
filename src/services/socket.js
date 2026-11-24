import { io } from 'socket.io-client';
import { getAuthToken } from './api';

const DEFAULT_SOCKET_URL = import.meta.env.PROD
  ? 'https://taantira-backend.vercel.app'
  : 'http://localhost:5000';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || DEFAULT_SOCKET_URL;
const IS_SERVERLESS_VERCEL =
  SOCKET_URL.includes('.vercel.app') && import.meta.env.VITE_ENABLE_VERCEL_SOCKET !== 'true';

let socketInstance = null;

export const connectSocket = () => {
  if (IS_SERVERLESS_VERCEL) return null;

  const token = getAuthToken();
  if (!token) return null;

  if (socketInstance && socketInstance.connected) {
    return socketInstance;
  }

  socketInstance = io(SOCKET_URL, {
    auth: { token },
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};

export const getSocket = () => socketInstance;
