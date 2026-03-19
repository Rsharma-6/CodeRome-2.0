import { io } from 'socket.io-client';

const REALTIME_URL = import.meta.env.VITE_REALTIME_URL || 'http://localhost:5003';

export const initSocket = async () => {
  const options = {
    'force new connection': true,
    reconnectionAttempts: 5,
    timeout: 10000,
    transports: ['websocket'],
    withCredentials: true,
  };
  return io(REALTIME_URL, options);
};
