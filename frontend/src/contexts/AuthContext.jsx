import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const login = useCallback(async (credentials) => {
    setError(null);
    try {
      const { user: userData, token } = await authService.login(credentials);
      setUser(userData);
      localStorage.setItem('aevorix_token', token);
      if (credentials.rememberMe) {
        localStorage.setItem('aevorix_user', JSON.stringify(userData));
      }
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('aevorix_token');
    localStorage.removeItem('aevorix_user');
  }, []);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('aevorix_token');
    const storedUser = localStorage.getItem('aevorix_user');

    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch {
        localStorage.removeItem('aevorix_token');
        localStorage.removeItem('aevorix_user');
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value = {
    user,
    isLoading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}