import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Role } from './types';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import ClassAdvisorDashboard from './pages/ClassAdvisorDashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import HODDashboard from './pages/HODDashboard';
import GateDashboard from './pages/GateDashboard';
import CompleteProfilePage from './pages/CompleteProfilePage';
import LoadingSpinner from './components/LoadingSpinner';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, requiresOnboarding } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Allow access to complete-profile page if onboarding is required
  if (requiresOnboarding && window.location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  // Allow users to revisit complete-profile to update details
  // if (!requiresOnboarding && window.location.pathname === '/complete-profile') {
  //   return <Navigate to="/dashboard" replace />;
  // }

  return <>{children}</>;
};

const DashboardRouter: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case Role.STUDENT:
      return <StudentDashboard />;
    case Role.CLASS_ADVISOR:
      return <ClassAdvisorDashboard />;
    case Role.HEALTH_RECEPTIONIST:
      return <ReceptionistDashboard />;
    case Role.DOCTOR:
      return <DoctorDashboard />;
    case Role.HOD:
      return <HODDashboard />;
    case Role.GATE_AUTHORITY:
      return <GateDashboard />;
    case Role.ADMIN:
      return <StudentDashboard />; // Admin can use student view as default
    default:
      return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/complete-profile" element={
            <ProtectedRoute>
              <CompleteProfilePage />
            </ProtectedRoute>
          } />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
