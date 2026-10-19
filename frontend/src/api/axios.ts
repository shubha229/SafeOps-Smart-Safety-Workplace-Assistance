import axios from "axios";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "https://safeops-backend.onrender.com/api"
).replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("safeops_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("safeops_token");
      localStorage.removeItem("safeops_user");
    }

    return Promise.reject(error);
  }
);

export default api;