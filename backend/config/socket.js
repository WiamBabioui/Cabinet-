import { Server } from 'socket.io';

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    transports: ['polling', 'websocket'],
    pingTimeout: 60000,
    pingInterval: 25000,
    cors: {
      origin: (origin, callback) => {
        if (!origin || origin.startsWith('http://localhost:')) {
          return callback(null, true);
        }
        const allowed = (process.env.CLIENT_URL || '')
          .split(',')
          .map(o => o.trim());
        if (allowed.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Blocked by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST']
    }
  });
  return io;
};

export const getSocket = () => {
  if (!io) throw new Error('Socket.io non initialisé !');
  return io;
};