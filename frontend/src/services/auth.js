// src/services/auth.js
import axios from "axios";

const API_URL = process.env.REACT_APP_DJANGO_API_URL || process.env.VITE_DJANGO_API_URL;

if (!API_URL) {
  throw new Error(
    "Missing API URL: set REACT_APP_DJANGO_API_URL or VITE_DJANGO_API_URL"
  );
}

const authApi = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  // withCredentials: true, // for cookies if using DRF auth
});

// Request interceptor: attach token if present
authApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

// Centralized error parser
const parseError = (error) => {
  if (!error) return "An unknown error occurred.";
  return (
    error.response?.data?.detail ||
    error.response?.data?.non_field_errors?.[0] ||
    error.response?.data?.message ||
    error.message ||
    "An unexpected error occurred."
  );
};

export const authService = {
  // ── Signup ────────────────────────────────────────────────────────────────
  signup: async (email, password, username) => {
    try {
      const response = await authApi.post("/auth/signup/", {
        email: email.trim().toLowerCase(),
        password,
        username: username.trim(),
      });
      const { token, user } = response.data;
      if (token) localStorage.setItem("auth_token", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));
      return { token, user };
    } catch (err) {
      throw parseError(err);
    }
  },

  // ── Login ─────────────────────────────────────────────────────────────────
  login: async (identifier, password) => {
    try {
      const response = await authApi.post("/auth/login/", {
        identifier: identifier.trim().toLowerCase(),
        password,
      });
      const { token, user } = response.data;
      if (token) localStorage.setItem("auth_token", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));
      return { token, user };
    } catch (err) {
      throw parseError(err);
    }
  },

  // ── Logout ────────────────────────────────────────────────────────────────
  logout: async () => {
    try {
      await authApi.post("/auth/logout/");
    } catch (err) {
      console.error("Logout error:", parseError(err));
    } finally {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
    }
  },

  // ── Email Verification ────────────────────────────────────────────────────
  verifyEmail: async (uid, token) => {
    try {
      const response = await authApi.post("/auth/verify-email/", { uid, token });
      if (response.data.user)
        localStorage.setItem("user", JSON.stringify(response.data.user));
      return response.data;
    } catch (err) {
      throw parseError(err);
    }
  },

  resendVerificationEmail: async () => {
    try {
      const response = await authApi.post("/auth/resend-verification/");
      return response.data;
    } catch (err) {
      throw parseError(err);
    }
  },

  // ── Profile / Password ───────────────────────────────────────────────────
  updateProfile: async (username, email) => {
    try {
      const response = await authApi.post("/profile/update-profile/", {
        username: username.trim(),
        email: email.trim().toLowerCase(),
      });
      if (response.data.user)
        localStorage.setItem("user", JSON.stringify(response.data.user));
      return response.data;
    } catch (err) {
      throw parseError(err);
    }
  },

  uploadProfileImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append("profile_image", file);
      const response = await authApi.post("/profile/upload-profile-image/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data.user)
        localStorage.setItem("user", JSON.stringify(response.data.user));
      return response.data;
    } catch (err) {
      throw parseError(err);
    }
  },

  changePassword: async (old_password, new_password) => {
    try {
      const response = await authApi.post("/auth/change-password/", {
        old_password,
        new_password,
      });
      return response.data;
    } catch (err) {
      throw parseError(err);
    }
  },

  // ── Helpers ───────────────────────────────────────────────────────────────
  getCurrentUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => !!localStorage.getItem("auth_token"),

  getUserRole: () => {
    const user = localStorage.getItem("user");
    if (!user) return null;
    try {
      const parsed = JSON.parse(user);
      return parsed.is_admin ? "admin" : "user";
    } catch {
      return null;
    }
  },
};

export default authService;