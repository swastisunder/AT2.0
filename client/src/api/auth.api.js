import axiosInstance from "./axios.js";

/**
 * Authentication API Service
 * Maps to backend server routes mounted under /api/auth
 */
export const authApi = {
  /**
   * Register a new user
   * @param {{ name: string, email: string, password: string, preferences?: object }} data
   * @returns {Promise<{ user: object, accessToken: string, refreshToken: string }>}
   */
  async register(data) {
    const response = await axiosInstance.post("/auth/register", data);
    return response.data.data;
  },

  /**
   * Authenticate user with email and password
   * @param {{ email: string, password: string }} credentials
   * @returns {Promise<{ user: object, accessToken: string, refreshToken: string }>}
   */
  async login(credentials) {
    const response = await axiosInstance.post("/auth/login", credentials);
    return response.data.data;
  },

  /**
   * Refresh expired access token using refreshToken
   * @param {string} refreshToken
   * @returns {Promise<{ accessToken: string, refreshToken: string }>}
   */
  async refreshToken(refreshToken) {
    const response = await axiosInstance.post("/auth/refresh", {
      refreshToken,
    });
    return response.data.data;
  },

  /**
   * Fetch current authenticated user profile
   * @returns {Promise<object>} User profile
   */
  async getMe() {
    const response = await axiosInstance.get("/auth/me");
    return response.data.data;
  },

  /**
   * Revoke current user session on server
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async logout() {
    const response = await axiosInstance.post("/auth/logout");
    return response.data;
  },
};

export default authApi;
