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

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: '🚀 Cabinet+ API fonctionne !' });
});

io.on('connection', (socket) => {
  console.log('🔌 Client connecté:', socket.id);
  socket.on('disconnect', () => console.log('🔌 Client déconnecté:', socket.id));
});

export { io };
connectMongo();

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});