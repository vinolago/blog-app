import { createContext, useState, useEffect } from 'react';
import { authService } from '@/services/api';
import { DEV_CONFIG, FAKE_USER } from '@/config/development';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for fake user mode
    if (DEV_CONFIG.USE_FAKE_USER) {
      // Set fake user for development
      setUser(FAKE_USER);
      localStorage.setItem('user', JSON.stringify(FAKE_USER));
      localStorage.setItem('token', 'fake-token-for-development');
    } else {
      // Use real authentication
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      login, 
      register, 
      logout, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
