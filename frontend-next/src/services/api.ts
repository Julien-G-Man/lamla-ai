import axios from "axios";

// Use fallback so the module loads during SSR/build without env vars.
// Real requests only happen client-side where env vars are provided.
const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000/api";
const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8001";

const DJANGO_ROOT_URL = DJANGO_API_URL.replace(/\/api\/?$/, "");

const djangoApi = axios.create({
  baseURL: DJANGO_API_URL || "http://localhost:8000/api",
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

djangoApi.interceptors.request.use((config) => {
  if (!DJANGO_API_URL) console.warn("NEXT_PUBLIC_DJANGO_API_URL is not set.");
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

djangoApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      // Token expired or invalid — clear local session and redirect to login
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      document.cookie = "is_logged_in=; path=/; max-age=0";
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith("/auth/")) {
        window.location.href = `/auth/login?next=${encodeURIComponent(currentPath)}`;
      }
    }
    return Promise.reject(error);
  }
);

export const DJANGO_HEALTH_ENDPOINT = DJANGO_ROOT_URL ? `${DJANGO_ROOT_URL}/health/` : "";
export const DJANGO_WARMUP_ENDPOINT = DJANGO_ROOT_URL ? `${DJANGO_ROOT_URL}/warmup/` : "";
export const FASTAPI_HEALTH_ENDPOINT = FASTAPI_URL ? `${FASTAPI_URL}/health` : "";

export const getApiErrorMessage = (
  error: unknown,
  fallback = "Something went wrong."
): string => {
  if (!error) return fallback;
  const err = error as {
    response?: { data?: { detail?: string; error?: string; details?: Record<string, string[]> } };
    code?: string;
    message?: string;
  };
  const detail = err?.response?.data?.detail;
  if (typeof detail === "string" && detail.trim()) return detail;

  const message = err?.response?.data?.error;
  if (typeof message === "string" && message.trim()) return message;

  const validationDetails = err?.response?.data?.details;
  if (validationDetails && typeof validationDetails === "object") {
    const firstKey = Object.keys(validationDetails)[0];
    const firstValue = validationDetails[firstKey];
    if (Array.isArray(firstValue) && firstValue.length) {
      return `${firstKey}: ${String(firstValue[0])}`;
    }
  }

  if (err?.code === "ECONNABORTED") return "Request timed out. Please try again.";
  if (typeof err?.message === "string" && err.message.trim()) return err.message;
  return fallback;
};

export default djangoApi;
