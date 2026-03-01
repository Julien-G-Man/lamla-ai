// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import authService from "../services/auth";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Rehydrate auth state on mount
  useEffect(() => {
    const storedUser = authService.getCurrentUser();
    const token = localStorage.getItem("auth_token");

    if (storedUser && token) {
      setUser(storedUser);
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
    }

    setIsLoading(false);
  }, []);

  // ── Auth actions ───────────────────────────────────────────────────────────

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const { user } = await authService.login(email, password);
      setUser(user);
      setIsAuthenticated(true);
      return { user };
    } catch (err) {
      setIsAuthenticated(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email, password, username) => {
    setIsLoading(true);
    try {
      const { user } = await authService.signup(email, password, username);
      setUser(user);
      setIsAuthenticated(true);
      return { user };
    } catch (err) {
      setIsAuthenticated(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  const markEmailVerified = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const resendVerificationEmail = async () => {
    return authService.resendVerificationEmail();
  };

  const updateProfile = async (username, email) => {
    const { user } = await authService.updateProfile(username, email);
    setUser(user);
    return { user };
  };

  const uploadProfileImage = async (file) => {
    const { user } = await authService.uploadProfileImage(file);
    setUser(user);
    return { user };
  };

  const changePassword = async (old_password, new_password) => {
    return authService.changePassword(old_password, new_password);
  };

  const getUserRole = () => {
    if (!user) return null;
    return user.is_admin ? "admin" : "user";
  };

  // ── Context value ─────────────────────────────────────────────────────────
  const value = {
    user,
    isLoading,
    isAuthenticated,
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};