import axios from "axios";

const DJANGO_API_URL = process.env.REACT_APP_DJANGO_API_URL; // Django API endpoint 
const FASTAPI_URL = process.env.REACT_APP_FASTAPI_URL;

if (!DJANGO_API_URL) {
  throw new Error("VITE_DJANGO_API_URL is not defined");
}

if (!FASTAPI_URL) {
  throw new Error("VITE_FASTAPI_URL is not defined");
}

const DJANGO_ROOT_URL = DJANGO_API_URL.replace(/\/api\/?$/, ""); // strip /api 

const djangoApi = axios.create({
  baseURL: DJANGO_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const DJANGO_HEALTH_ENDPOINT = `${DJANGO_ROOT_URL}/health/`;
export const DJANGO_WARMUP_ENDPOINT = `${DJANGO_ROOT_URL}/warmup/`;
export const FASTAPI_HEALTH_ENDPOINT = `${FASTAPI_URL}/health/`;

export default djangoApi;
