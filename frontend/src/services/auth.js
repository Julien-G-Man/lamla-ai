import axios from "axios";

const DJANGO_API_URL = process.env.REACT_APP_DJANGO_API_URL;
const DJANGO_ROOT_URL = DJANGO_API_URL.replace(/\/api\/?$/, "");

const authApi = axios.create({
  baseURL: DJANGO_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for session-based auth
});

// Add token to requests if available
authApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API endpoints
export const authService = {
  // User signup
  signup: async (email, password, first_name, last_name) => {
    try {
      const response = await authApi.post("/auth/signup/", {
        email,
        password,
        first_name,
        last_name,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // User login
  login: async (email, password) => {
    try {
      const response = await authApi.post("/auth/login/", {
        email,
        password,
      });
      const { token, user } = response.data;
      
      // Store token in localStorage
      if (token) {
        localStorage.setItem("auth_token", token);
      }
      
      // Store user data
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // User logout
  logout: async () => {
    try {
      await authApi.post("/auth/logout/");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local storage regardless of API response
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
    }
  },

  // Get current user
  getCurrentUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem("auth_token");
  },

  // Get user role (admin or user)
  getUserRole: () => {
    const user = localStorage.getItem("user");
    if (!user) return null;
    try {
      const parsedUser = JSON.parse(user);
      return parsedUser.role || parsedUser.is_admin ? "admin" : "user";
    } catch {
      return null;
    }
  },

  // Change password
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

  // Update user profile
  updateProfile: async (first_name, last_name, email) => {
    try {
      const response = await authApi.post("/auth/update-profile/", {
        first_name,
        last_name,
        email,
      });
      
      // Update stored user data
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Upload profile image
  uploadProfileImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append("profile_image", file);
      
      const response = await authApi.post("/auth/upload-profile-image/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      // Update stored user data
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
