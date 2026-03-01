import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Rehydrate auth state on mount
  useEffect(() => {
    const initializeAuth = () => {
      const token      = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        } catch {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await authService.login(email, password);
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // AuthContext.signup(email, password, username)
  const signup = async (email, password, username) => {
    setIsLoading(true);
    try {
      const response = await authService.signup(email, password, username);
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  // Called by the VerifyEmail page after a successful /auth/verify-email/ POST
  const markEmailVerified = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // Called by the resend-verification banner button
  const resendVerificationEmail = async () => {
    return authService.resendVerificationEmail();
  };

  const updateProfile = async (username, email) => {
    const response = await authService.updateProfile(username, email);
    setUser(response.user);
    return response;
  };

  const uploadProfileImage = async (file) => {
    const response = await authService.uploadProfileImage(file);
    setUser(response.user);
    return response;
  };

  const changePassword = async (old_password, new_password) => {
    return authService.changePassword(old_password, new_password);
  };

  const getUserRole = () => {
    if (!user) return null;
    return user.is_admin ? 'admin' : 'user';
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    // Derived convenience flag — use this to show/hide the verification banner
    isEmailVerified: user?.is_email_verified ?? false,
    login,
    signup,
    logout,
    markEmailVerified,
    resendVerificationEmail,
    updateProfile,
    uploadProfileImage,
    changePassword,
    getUserRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};