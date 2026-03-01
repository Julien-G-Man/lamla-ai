import axios from "axios";

const DJANGO_API_URL = process.env.REACT_APP_DJANGO_API_URL;

const authApi = axios.create({
  baseURL: DJANGO_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Attach token to every request if available
authApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  // ── Signup ────────────────────────────────────────────────────────────────
  signup: async (email, password, username) => {
    try {
      const response = await authApi.post("/auth/signup/", {
        email,
        password,
        username,
      });
      const { token, user } = response.data;
      if (token) localStorage.setItem("auth_token", token);
      if (user)  localStorage.setItem("user", JSON.stringify(user));
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ── Login ─────────────────────────────────────────────────────────────────
  login: async (email, password) => {
    try {
      const response = await authApi.post("/auth/login/", { email, password });
      const { token, user } = response.data;
      if (token) localStorage.setItem("auth_token", token);
      if (user)  localStorage.setItem("user", JSON.stringify(user));
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ── Logout ────────────────────────────────────────────────────────────────
  logout: async () => {
    try {
      await authApi.post("/auth/logout/");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
    }
  },

  // ── Email Verification ────────────────────────────────────────────────────
  verifyEmail: async (uid, token) => {
    try {
      const response = await authApi.post("/auth/verify-email/", { uid, token });
      // Update stored user so the banner disappears immediately
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  resendVerificationEmail: async () => {
    try {
      const response = await authApi.post("/auth/resend-verification/");
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
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

  // ── Profile ───────────────────────────────────────────────────────────────
  changePassword: async (old_password, new_password) => {
    try {
      const response = await authApi.post("/auth/change-password/", {
        old_password,
        new_password,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateProfile: async (username, email) => {
    try {
      const response = await authApi.post("/auth/update-profile/", {
        username,
        email,
      });
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  uploadProfileImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append("profile_image", file);
      const response = await authApi.post("/auth/upload-profile-image/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default authApi;