import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
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

// ─── Route protégée ───────────────────────────────────────────────────────────
const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
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
          {/* Dashboard principal */}
          <Route index element={<Dashboard />} />

          {/* ── Dev A ── */}
          <Route path="patients"     element={<Patients />} />
          <Route path="patients/:id" element={<PatientDetail />} />
          <Route path="profile"      element={<Profile />} />

          {/* ── Dev B ── */}
          <Route path="appointments" element={<Appointments />} />
          <Route path="consultation/:appointmentId?" element={
            <PrivateRoute allowedRoles={['medecin']}>
              <Consultation />
            </PrivateRoute>
          } />

          <Route path="chat" element={<Chat />} />

          {/* ── Rôles spécifiques ── */}
          <Route path="assistant-dashboard" element={
            <PrivateRoute allowedRoles={['secretaire']}>
              <AssistantDashboard />
            </PrivateRoute>
          } />
          <Route path="patient-portal" element={
            <PrivateRoute allowedRoles={['patient']}>
              <PatientPortal />
            </PrivateRoute>
          } />
        </Route>

        {/* ── Redirection par défaut ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
  );
}

export default App;