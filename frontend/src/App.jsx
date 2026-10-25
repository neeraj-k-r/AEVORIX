import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import PatientsPage from './pages/PatientsPage';
import PatientDetailPage from './pages/PatientDetailPage';
import { DashboardPatientPage } from './pages/dashboard/index';
import UnauthorizedPage from './pages/UnauthorizedPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function AppRoutes() {
  const { isAuthenticated, isLoading, login } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <LoginPage onLogin={login} />
        }
      />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-background">
              <Navbar />
              <Dashboard />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients"
        element={
          <ProtectedRoute allowedRoles={['Doctor', 'Nurse', 'Lab', 'Pharmacist', 'Admin']}>
            <PatientsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients/:patientCode"
        element={
          <ProtectedRoute allowedRoles={['Doctor', 'Nurse', 'Lab', 'Pharmacist', 'Admin']}>
            <PatientDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/patient/:patientCode"
        element={
          <ProtectedRoute allowedRoles={['Doctor', 'Nurse', 'Lab', 'Pharmacist', 'Admin']}>
            <DashboardPatientPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}