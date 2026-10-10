import axios from "axios";
import { getToken, removeToken } from "../utils/token";

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8080/api";

const axiosInstance = axios.create({ baseURL: API_URL, timeout: 15000 });

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      if (
        window.location.pathname !== "/login" &&
        window.location.pathname !== "/signup"
      ) {
        window.location.assign("/login");
      }
    }
    if (error.response) {
      error.normalized = {
        message: error.response.data?.message || "Something went wrong",
        errors: error.response.data?.errors,
        status: error.response.status,
        retryAfter: error.response.headers?.["retry-after"],
      };
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
