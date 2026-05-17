import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useSocket } from './context/SocketContext';
import api from './services/api';
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages Auth
import Login  from './pages/Login';
import Signup from './pages/Signup';

// Pages Dashboard — Dev A
import Dashboard     from './pages/Dashboard';
import Patients      from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Profile       from './pages/Profile';

// Pages Dashboard — Dev B
import Appointments       from './pages/Appointments';
import Consultation       from './pages/Consultation';
import Chat               from './pages/Chat';
import PatientPortal      from './pages/PatientPortal';
import AssistantDashboard from './pages/AssistantDashboard';

// ─── Role-based index redirect ────────────────────────────────────────────────
// Patients must go to /patient-portal, secretaires to /assistant-dashboard.
// Letting them land on <Dashboard /> causes API errors and white screens.
const RoleBasedIndex = () => {
  const { user } = useAuth();
  if (!user) return null;
  const role = user.role?.toLowerCase().trim();
  if (role === 'patient')    return <Navigate to="/patient-portal"      replace />;
  if (role === 'secretaire') return <Navigate to="/assistant-dashboard" replace />;
  return <Dashboard />;
};

// ─── Route protégée ───────────────────────────────────────────────────────────
const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const socket = useSocket();

  useEffect(() => {
    if (!user) return;

    const checkUpcomingAppointments = async () => {
      try {
        const res = await api.get('/appointments/upcoming');
        const appointments = res.data?.appointments ?? [];

        const now = new Date();
        appointments.forEach(app => {
          const appTime = new Date(app.date_heure_debut);
          const diff = (appTime - now) / (1000 * 60);

          if (diff > 0 && diff <= 15) {
            const notifiedKey = `notified_app_${app.id}`;
            if (!sessionStorage.getItem(notifiedKey)) {
              api.post('/notifications/create', {
                type: 'appointment',
                title: 'Rendez-vous imminent',
                message: `Votre rendez-vous pour "${app.motif}" commence dans ${Math.round(diff)} minutes.`
              }).catch(() => {});
              sessionStorage.setItem(notifiedKey, 'true');
            }
          }
        });
      } catch {
        // ignore — 403 is expected for roles without appointment access
      }
    };

    const interval = setInterval(checkUpcomingAppointments, 60000);
    checkUpcomingAppointments();
    return () => clearInterval(interval);
  }, [user, socket]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth/login" replace />;

  if (allowedRoles && !allowedRoles.some(r => r.toLowerCase() === user.role?.toLowerCase().trim())) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  return (
    <Routes>
      {/* ── Routes Auth ── */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login"  element={<Login />} />
        <Route path="signup" element={<Signup />} />
      </Route>

      {/* ── Routes Dashboard protégées ── */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        {/* Role-aware index: patients→portal, secretaires→assistant, medecins/admin→Dashboard */}
        <Route index element={<RoleBasedIndex />} />

        {/* ── Dev A ── */}
        <Route path="patients"     element={<Patients />} />
        <Route path="patients/:id" element={<PatientDetail />} />
        <Route path="profile"      element={<Profile />} />

        {/* ── Dev B ── */}
        <Route path="appointments" element={<Appointments />} />
        <Route
          path="consultation/:appointmentId?"
          element={
            <PrivateRoute allowedRoles={['medecin']}>
              <Consultation />
            </PrivateRoute>
          }
        />
        <Route path="chat" element={<Chat />} />

        {/* ── Rôles spécifiques ── */}
        <Route
          path="assistant-dashboard"
          element={
            <PrivateRoute allowedRoles={['secretaire']}>
              <AssistantDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="patient-portal"
          element={
            <PrivateRoute allowedRoles={['patient']}>
              <PatientPortal />
            </PrivateRoute>
          }
        />
      </Route>

      {/* ── Redirection par défaut ── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;