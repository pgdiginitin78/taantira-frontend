import { io } from 'socket.io-client';
import { getAuthToken } from './api';

const DEFAULT_SOCKET_URL = import.meta.env.PROD
  ? 'https://taantira-backend.vercel.app'
  : 'http://localhost:5000';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || DEFAULT_SOCKET_URL;

let socketInstance = null;

export const connectSocket = () => {
  const token = getAuthToken();
  if (!token) return null;

  if (socketInstance && socketInstance.connected) {
    return socketInstance;
  }

  socketInstance = io(SOCKET_URL, {
    auth: { token },
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
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
