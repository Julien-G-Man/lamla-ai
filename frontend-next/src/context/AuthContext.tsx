'use client';

import React, { createContext, useContext, useState, useEffect } from "react";
import authService from "@/services/auth";

interface User {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  is_email_verified: boolean;
  profile_image?: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  login: (identifier: string, password: string) => Promise<{ user: User }>;
  signup: (email: string, password: string, username: string) => Promise<{ user: User }>;
  googleAuth: (googleToken: string) => Promise<{ user: User }>;
  logout: () => Promise<void>;
  markEmailVerified: (updatedUser: User) => void;
  resendVerificationEmail: () => Promise<unknown>;
  updateProfile: (username: string, email: string) => Promise<{ user: User }>;
  uploadProfileImage: (file: File) => Promise<{ user: User }>;
  changePassword: (old_password: string, new_password: string) => Promise<unknown>;
  getUserRole: () => "admin" | "user" | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  const login = async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      const { user } = await authService.login(identifier, password);
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

  const signup = async (email: string, password: string, username: string) => {
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

  const googleAuth = async (googleToken: string) => {
    setIsLoading(true);
    try {
      const { user } = await authService.googleAuth(googleToken);
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

  const markEmailVerified = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const resendVerificationEmail = async () => {
    return authService.resendVerificationEmail();
  };

  const updateProfile = async (username: string, email: string) => {
    const { user } = await authService.updateProfile(username, email);
    setUser(user);
    return { user };
  };

  const uploadProfileImage = async (file: File) => {
    const { user } = await authService.uploadProfileImage(file);
    setUser(user);
    return { user };
  };

  const changePassword = async (old_password: string, new_password: string) => {
    return authService.changePassword(old_password, new_password);
  };

  const getUserRole = (): "admin" | "user" | null => {
    if (!user) return null;
    return user.is_admin ? "admin" : "user";
  };

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated,
    isEmailVerified: user?.is_email_verified ?? false,
    login,
    signup,
    googleAuth,
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
