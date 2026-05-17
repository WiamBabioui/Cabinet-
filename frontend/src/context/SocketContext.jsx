import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  // Keep a ref so the cleanup function always closes the right socket
  const socketRef = useRef(null);

  useEffect(() => {
    // Close any previous socket before creating a new one
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
      setSocket(null);
    }

    if (!user) return;

    const token = localStorage.getItem('cabinet_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const socketUrl = apiUrl.replace(/\/api\/?$/, '');

    const newSocket = io(socketUrl, {
      auth: { token },
      query: { userId: user.id },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket.IO connecté:', newSocket.id);
      newSocket.emit('join_notifications', user.id);
    });

    newSocket.on('connect_error', (err) => {
      console.warn('⚠️ Socket.IO erreur de connexion:', err.message);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO déconnecté:', reason);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.close();
      socketRef.current = null;
    };
  }, [user?.id]); // Only re-run when user ID changes, not the whole user object

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
