import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ensure we don't double-prefix "/api" when calling endpoints
  const API_URL = (import.meta.env.VITE_API_URL?.replace(/\/$/, '')) || 'http://localhost:5000';

  // Create axios instance with auth header
  const apiClient = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Important for cookies
  });

  // Add token to requests
  apiClient.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Handle token refresh on 401
  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401 && token) {
        try {
          const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {}, {
            withCredentials: true,
          });
          const newToken = data.token;
          setToken(newToken);
          localStorage.setItem('token', newToken);
          
          // Retry original request
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(error.config);
        } catch (refreshError) {
          logout();
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }
  );

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const { data } = await apiClient.get('/api/auth/me');
          setUser(data.user);
        } catch (err) {
          console.error('Auth check failed:', err);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  // Register
  const register = async (email, password, name) => {
    try {
      setError(null);
      const { data } = await apiClient.post('/api/auth/register', {
        email,
        password,
        name,
      });
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Registration failed';
      setError(errorMsg);
      throw err;
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      setError(null);
      const { data } = await apiClient.post('/api/auth/login', {
        email,
        password,
      });
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Login failed';
      setError(errorMsg);
      throw err;
    }
  };

  // Google Auth
  const googleAuth = async (googleId, email, name, profilePicture) => {
    try {
      setError(null);
      const { data } = await apiClient.post('/api/auth/google', {
        googleId,
        email,
        name,
        profilePicture,
      });
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Google authentication failed';
      setError(errorMsg);
      throw err;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
    }
  };

  // Update preferences
  const updatePreferences = async (preferences) => {
    try {
      setError(null);
      const { data } = await apiClient.put('/api/auth/preferences', preferences);
      setUser(data.user);
      return data.user;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to update preferences';
      setError(errorMsg);
      throw err;
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    apiClient,
    register,
    login,
    googleAuth,
    logout,
    updatePreferences,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
