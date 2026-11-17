import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ssp_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('ssp_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize and verify session on initial load
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('ssp_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.success) {
            setUser(res.data.data);
            localStorage.setItem('ssp_user', JSON.stringify(res.data.data));
          }
        } catch (err) {
          console.warn('Session verification failed, logging out:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (identifier, password) => {
    try {
      const res = await api.post('/auth/login', {
        username: identifier,
        email: identifier,
        password,
      });
      if (res.data?.success) {
        const { access_token, user: userData } = res.data.data;
        setToken(access_token);
        setUser(userData);
        localStorage.setItem('ssp_token', access_token);
        localStorage.setItem('ssp_user', JSON.stringify(userData));
        toast.success(`Welcome back, ${userData.full_name}!`);
        return { success: true, user: userData };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Login failed. Please check your credentials.';
      toast.error(message);
      return { success: false, message };
    }
  };

  const register = async (registerData) => {
    try {
      const res = await api.post('/auth/register', registerData);
      if (res.data?.success) {
        const { access_token, user: userData } = res.data.data;
        setToken(access_token);
        setUser(userData);
        localStorage.setItem('ssp_token', access_token);
        localStorage.setItem('ssp_user', JSON.stringify(userData));
        toast.success('Registration successful! Welcome to SSP.');
        return { success: true, user: userData };
      }
      return { success: false, message: 'Registration failed.' };
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Registration failed. Please check your details.';
      toast.error(message);
      return { success: false, message };
    }
  };

  const registerAdmin = async (registerData) => {
    try {
      const res = await api.post('/auth/admin-register', registerData);
      if (res.data?.success) {
        const { access_token, user: userData } = res.data.data;
        setToken(access_token);
        setUser(userData);
        localStorage.setItem('ssp_token', access_token);
        localStorage.setItem('ssp_user', JSON.stringify(userData));
        toast.success('Administrator account created successfully.');
        return { success: true, user: userData };
      }
      return { success: false, message: 'Administrator registration failed.' };
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Administrator registration failed.';
      toast.error(message);
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout').catch(() => {});
      }
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('ssp_token');
      localStorage.removeItem('ssp_user');
      toast.success('Signed out successfully.');
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success) {
        setUser(res.data.data);
        localStorage.setItem('ssp_user', JSON.stringify(res.data.data));
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        registerAdmin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
