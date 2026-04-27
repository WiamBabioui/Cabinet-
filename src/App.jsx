import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';

// Lazy load pages for performance
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import Consultation from './pages/Consultation';
import Chat from './pages/Chat';
import PatientPortal from './pages/PatientPortal';
import AssistantDashboard from './pages/AssistantDashboard';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/auth/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;
  
  return children;
};

function App() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
      </Route>

      {/* Protected Dashboard Routes */}
      <Route path="/" element={
        <PrivateRoute>
          <DashboardLayout />
        </PrivateRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="patients" element={<Patients />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="consultation" element={
          <PrivateRoute allowedRoles={['Doctor']}>
            <Consultation />
          </PrivateRoute>
        } />
        <Route path="chat" element={<Chat />} />
        <Route path="assistant-dashboard" element={
          <PrivateRoute allowedRoles={['Assistant']}>
            <AssistantDashboard />
          </PrivateRoute>
        } />
        <Route path="patient-portal" element={
          <PrivateRoute allowedRoles={['Patient']}>
            <PatientPortal />
          </PrivateRoute>
        } />
      </Route>

      {/* Default Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
