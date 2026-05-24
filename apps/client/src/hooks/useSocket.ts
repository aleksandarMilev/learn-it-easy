import { useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';

export function useSocket(): Socket | null {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const newSocket = io('http://localhost:3000', {
      auth: { token: accessToken },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => setSocket(newSocket));

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [accessToken]);

  return socket;
}
