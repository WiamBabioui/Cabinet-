import { Server } from 'socket.io';

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || origin.startsWith('http://localhost:')) {
          callback(null, true);
        } else {
          const allowed = process.env.CLIENT_URL || 'http://localhost:5173';
          if (origin === allowed) {
            callback(null, true);
          } else {
            callback(new Error('Blocked by CORS'));
          }
        }
      },
      credentials: true
    }
  });
  return io;
};

export const getSocket = () => {
  if (!io) {
    throw new Error("Socket.io non initialisé !");
  }
  return io;
};
