import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000/api";

// Cookie helpers for middleware route protection.
// The middleware cannot read localStorage, so we sync a lightweight
// non-httpOnly flag cookie alongside the localStorage token.
const SESSION_COOKIE = "is_logged_in";

const setSessionCookie = () => {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE}=1; path=/; SameSite=Strict; max-age=86400`;
};

const clearSessionCookie = () => {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
};

const authApi = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

authApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

const parseError = (error: unknown): string => {
  if (!error) return "An unknown error occurred.";
  const err = error as {
    response?: { data?: { detail?: string; non_field_errors?: string[]; message?: string } };
    message?: string;
  };
  return (
    err.response?.data?.detail ||
    err.response?.data?.non_field_errors?.[0] ||
    err.response?.data?.message ||
    err.message ||
    "An unexpected error occurred."
  );
};

export const authService = {
  signup: async (email: string, password: string, username: string) => {
    try {
      const response = await authApi.post("/auth/signup/", {
        email: email.trim().toLowerCase(),
        password,
        username: username.trim(),
      });
      const { token, user } = response.data;
      if (token) localStorage.setItem("auth_token", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));
      setSessionCookie();
      return { token, user };
    } catch (err) {
      throw parseError(err);
    }
  },

  login: async (identifier: string, password: string) => {
    try {
      const response = await authApi.post("/auth/login/", {
        identifier: identifier.trim().toLowerCase(),
        password,
      });
      const { token, user } = response.data;
      if (token) localStorage.setItem("auth_token", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));
      setSessionCookie();
      return { token, user };
    } catch (err) {
      throw parseError(err);
    }
  },

  googleAuth: async (googleToken: string) => {
    try {
      const response = await authApi.post("/auth/google/", { token: googleToken });
      const { token, user } = response.data;
      if (token) localStorage.setItem("auth_token", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));
      setSessionCookie();
      return { token, user };
    } catch (err) {
      throw parseError(err);
    }
  },

  logout: async () => {
    try {
      await authApi.post("/auth/logout/");
    } catch (err) {
      console.error("Logout error:", parseError(err));
    } finally {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      clearSessionCookie();
    }
  },

  verifyEmail: async (uid: string, token: string) => {
    try {
      const response = await authApi.post("/auth/verify-email/", { uid, token });
      if (response.data.user) localStorage.setItem("user", JSON.stringify(response.data.user));
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

  updateProfile: async (username: string, email: string) => {
    try {
      const response = await authApi.post("/profile/update-profile/", {
        username: username.trim(),
        email: email.trim().toLowerCase(),
      });
      if (response.data.user) localStorage.setItem("user", JSON.stringify(response.data.user));
      return response.data;
    } catch (err) {
      throw parseError(err);
    }
  },

  uploadProfileImage: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("profile_image", file);
      const response = await authApi.post("/profile/upload-profile-image/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data.user) localStorage.setItem("user", JSON.stringify(response.data.user));
      return response.data;
    } catch (err) {
      throw parseError(err);
    }
  },

  changePassword: async (old_password: string, new_password: string) => {
    try {
      const response = await authApi.post("/auth/change-password/", { old_password, new_password });
      return response.data;
    } catch (err) {
      throw parseError(err);
    }
  },

  getCurrentUser: () => {
    if (typeof window === "undefined") return null;
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("auth_token");
  },

  getUserRole: (): "admin" | "user" | null => {
    if (typeof window === "undefined") return null;
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
