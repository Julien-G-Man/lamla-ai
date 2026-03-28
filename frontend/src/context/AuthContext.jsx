import React, { createContext, useContext, useState, useEffect } from "react";
import authService from "../services/auth";
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from "../services/emailService";

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

  //  Auth actions 

  const login = async (identifier, password) => {
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

  const signup = async (email, password, username) => {
    setIsLoading(true);
    try {
      const { user, verification } = await authService.signup(email, password, username);
      setUser(user);
      setIsAuthenticated(true);

      // Send verification email via EmailJS (non-fatal if it fails)
      if (verification?.uid && verification?.token) {
        const verifyLink = `${window.location.origin}/auth/verify-email?uid=${verification.uid}&token=${verification.token}`;
        sendVerificationEmail({ toEmail: email, userName: username, verifyLink }).catch((err) =>
          console.warn("[emailService] Verification email failed:", err)
        );
      }

      return { user };
    } catch (err) {
      setIsAuthenticated(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const googleAuth = async (googleToken) => {
    setIsLoading(true);
    try {
      const { user, created } = await authService.googleAuth(googleToken);
      setUser(user);
      setIsAuthenticated(true);

      // Send a welcome email only on first signup — returning users don't need it
      if (created && user?.email) {
        sendWelcomeEmail({ toEmail: user.email, userName: user.username || user.email }).catch((err) =>
          console.warn("[emailService] Welcome email failed:", err)
        );
      }

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
    const data = await authService.resendVerificationEmail();
    // data = { detail, uid, token }
    if (data?.uid && data?.token && user?.email) {
      const verifyLink = `${window.location.origin}/auth/verify-email?uid=${data.uid}&token=${data.token}`;
      sendVerificationEmail({
        toEmail: user.email,
        userName: user.username || user.email,
        verifyLink,
      }).catch((err) => console.warn("[emailService] Resend verification failed:", err));
    }
    return data;
  };

  const requestPasswordReset = async (email) => {
    const data = await authService.requestPasswordReset(email);
    // data = { detail, uid?, token? } — uid+token only when account exists
    if (data?.uid && data?.token) {
      const resetLink = `${window.location.origin}/auth/reset-password?uid=${data.uid}&token=${data.token}`;
      sendPasswordResetEmail({
        toEmail: email,
        userName: email.split("@")[0],
        resetLink,
      }).catch((err) => console.warn("[emailService] Password reset email failed:", err));
    }
    return data;
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

  //  Context value 
  const value = {
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
    requestPasswordReset,
    updateProfile,
    uploadProfileImage,
    changePassword,
    getUserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
