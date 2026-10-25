import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from '../pages/LoginPage';
import { AuthProvider } from '../contexts/AuthContext';
import { ToastProvider } from '../components/Toast';
import { BrowserRouter } from 'react-router-dom';

// Mock auth service
vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
  },
}));

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          {component}
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders the gateway authentication title', () => {
    renderWithProviders(<LoginPage onLogin={vi.fn()} />);
    expect(screen.getByText('GATEWAY AUTHENTICATION')).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    renderWithProviders(<LoginPage onLogin={vi.fn()} />);
    expect(screen.getByText('Access your secure healthcare workspace')).toBeInTheDocument();
  });

  it('renders all four role tabs', () => {
    renderWithProviders(<LoginPage onLogin={vi.fn()} />);
    expect(screen.getByText('Doctor')).toBeInTheDocument();
    expect(screen.getByText('Nurse')).toBeInTheDocument();
    expect(screen.getByText('Lab')).toBeInTheDocument();
    expect(screen.getByText('Pharmacist')).toBeInTheDocument();
  });

  it('renders email and password fields', () => {
    renderWithProviders(<LoginPage onLogin={vi.fn()} />);
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('renders remember me checkbox and forgot password link', () => {
    renderWithProviders(<LoginPage onLogin={vi.fn()} />);
    expect(screen.getByText('Remember me')).toBeInTheDocument();
    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
  });

  it('renders sign in button', () => {
    renderWithProviders(<LoginPage onLogin={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('updates email placeholder when role changes', () => {
    renderWithProviders(<LoginPage onLogin={vi.fn()} />);
    const emailInput = screen.getByLabelText('Email Address');
    
    // Default is Doctor
    expect(emailInput).toHaveAttribute('placeholder', 'doctor@aevorix.com');
    
    // Click Nurse tab
    fireEvent.click(screen.getByText('Nurse'));
    expect(emailInput).toHaveAttribute('placeholder', 'nurse@aevorix.com');
  });

  it('toggles password visibility', () => {
    renderWithProviders(<LoginPage onLogin={vi.fn()} />);
    const passwordInput = screen.getByLabelText('Password');
    const toggleButton = screen.getByLabelText('Show password');
    
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('Hide password')).toBeInTheDocument();
  });
});

describe('AuthContext', () => {
  it('provides login and logout functions', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      ),
    });
    
    expect(result.current.login).toBeDefined();
    expect(result.current.logout).toBeDefined();
    expect(result.current.isAuthenticated).toBe(false);
  });
});