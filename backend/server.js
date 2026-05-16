import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectMongo from './config/db.mongo.js';

import authRoutes      from './routes/auth.routes.js';
import userRoutes      from './routes/user.routes.js';
import patientRoutes   from './routes/patient.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import medecinRoutes   from './routes/medecin.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import chatRoutes from './routes/chat.routes.js';
import consultationRoutes from './routes/consultation.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import activityLogRoutes from './routes/activitylog.routes.js';

dotenv.config();

const app        = express();
const httpServer = createServer(app);
const io         = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173' }
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth',      authRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/patients',  patientRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/medecins',  medecinRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activitylogs', activityLogRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: '🚀 Cabinet+ API fonctionne !' });
});

io.on('connection', (socket) => {
  console.log('🔌 Client connecté:', socket.id);

  socket.on('join_conversation', (conversationId) => {
    socket.join(`conv_${conversationId}`);
    console.log(`👤 Client ${socket.id} a rejoint conv_${conversationId}`);
  });

  socket.on('send_message', (data) => {
    // data: { conversation_id, message }
    socket.to(`conv_${data.conversation_id}`).emit('receive_message', data.message);
  });

  socket.on('delete_message', (data) => {
    // data: { conversation_id, message_id }
    socket.to(`conv_${data.conversation_id}`).emit('message_deleted', data.message_id);
  });

  socket.on('join_notifications', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`🔔 Client ${socket.id} a rejoint la salle de notifications de l'utilisateur ${userId}`);
  });

  socket.on('disconnect', () => console.log('🔌 Client déconnecté:', socket.id));
});
connectMongo();

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});