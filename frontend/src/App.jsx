import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';

function AppContent() {
  const { isAuthenticated, isLoading, login } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Dashboard />
    </div>
  );
}

export default function App() {
  return <AppContent />;
}