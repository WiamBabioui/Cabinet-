import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initSocket } from './config/socket.js';
import connectMongo from './config/db.mongo.js';
import { socketAuth } from './middleware/auth.middleware.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import patientRoutes from './routes/patient.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import medecinRoutes from './routes/medecin.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import chatRoutes from './routes/chat.routes.js';
import consultationRoutes from './routes/consultation.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import activityLogRoutes from './routes/activitylog.routes.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = initSocket(httpServer);
io.use(socketAuth);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowed = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(o => o.trim()) : [];
    if (allowed.includes(origin) || origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/medecins', medecinRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activitylogs', activityLogRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Cabinet+ API fonctionne !' });
});

io.on('connection', (socket) => {
  console.log('Client connecte:', socket.id);

  const joinUserRoom = (userId) => {
    if (!userId) return;
    socket.join(`user_${userId}`);
    console.log(`Client ${socket.id} a rejoint user_${userId}`);
  };

  joinUserRoom(socket.user?.id);

  socket.on('join', (roomOrUserId) => {
    if (!roomOrUserId) return;
    const room = String(roomOrUserId).startsWith('user_')
      ? String(roomOrUserId)
      : `user_${roomOrUserId}`;
    socket.join(room);
  });

  socket.on('join_notifications', joinUserRoom);

  socket.on('join_conversation', (conversationId) => {
    if (!conversationId) return;
    socket.join(`conv_${conversationId}`);
    console.log(`Client ${socket.id} a rejoint conv_${conversationId}`);
  });

  socket.on('delete_message', (data) => {
    if (!data?.conversation_id || !data?.message_id) return;
    socket.to(`conv_${data.conversation_id}`).emit('message_deleted', data.message_id);
  });

  socket.on('disconnect', () => console.log('Client deconnecte:', socket.id));
});

await connectMongo();

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Serveur lance sur http://localhost:${PORT}`);
});
