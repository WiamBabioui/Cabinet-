import { Server } from 'socket.io';

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173' }
  });
  return io;
};

export const getSocket = () => {
  if (!io) {
    throw new Error("Socket.io non initialisé !");
  }
  return io;
};
