// backend/tests/setup/appFactory.js
// Creates a testable Express app WITHOUT starting the HTTP server / Socket.io
// This avoids port conflicts and allows Supertest to inject requests directly.

import express from 'express';
import cors from 'cors';

import authRoutes from '../../routes/auth.routes.js';
import userRoutes from '../../routes/user.routes.js';
import patientRoutes from '../../routes/patient.routes.js';
import appointmentRoutes from '../../routes/appointment.routes.js';
import chatRoutes from '../../routes/chat.routes.js';
import dashboardRoutes from '../../routes/dashboard.routes.js';
import medecinRoutes from '../../routes/medecin.routes.js';
import consultationRoutes from '../../routes/consultation.routes.js';
import notificationRoutes from '../../routes/notification.routes.js';

export const createTestApp = () => {
  const app = express();

  app.use(cors({ origin: '*' }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/patients', patientRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/medecins', medecinRoutes);
  app.use('/api/consultations', consultationRoutes);
  app.use('/api/notifications', notificationRoutes);

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Cabinet+ API fonctionne !' });
  });

  // Global error handler for tests
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ message: err.message || 'Erreur serveur' });
  });

  return app;
};
