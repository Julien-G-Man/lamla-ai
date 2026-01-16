import axios from "axios";

const BASE_API_URL = "http://localhost:8000/api"; //import.meta.env.VITE_BASE_API_URL; // Django REST API
console.log("Django Backend URL:", BASE_API_URL);

const djangoApi = axios.create({
  baseURL: BASE_API_URL, 
  headers: { 
    "Content-Type": "application/json",
  },
});

export const healthApiEndpoint = `${BASE_API_URL}/health`;
export default djangoApi;
