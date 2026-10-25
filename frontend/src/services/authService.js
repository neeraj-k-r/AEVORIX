const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class AuthService {
  async login({ email, password, role }) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, role }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    return data;
  }

  async verifyToken(token) {
    const response = await fetch(`${API_BASE}/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Token verification failed');
    }

    return response.json();
  }

  getStoredToken() {
    return localStorage.getItem('aevorix_token');
  }

  clearStorage() {
    localStorage.removeItem('aevorix_token');
    localStorage.removeItem('aevorix_user');
  }
}

export const authService = new AuthService();