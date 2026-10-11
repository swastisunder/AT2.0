import { useState, useCallback, useEffect } from "react";
import {
  setTokens,
  clearTokens,
  getAccessToken,
  getUserFromToken,
  isTokenValid,
} from "../utils/token";
import authApi from "../api/auth.api";
import { AuthContext } from "./auth-context";

export const AuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(() => {
    if (!isTokenValid()) {
      clearTokens();
      return null;
    }
    return getUserFromToken();
  });

  // Verify and fetch fresh user profile on initial mount
  useEffect(() => {
    let active = true;

    const initializeAuth = async () => {
      const token = getAccessToken();
      if (!token || !isTokenValid(token)) {
        if (active) {
          clearTokens();
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const userProfile = await authApi.getMe();
        if (active) {
          setUser(userProfile);
        }
      } catch (error) {
        // Axios interceptor will attempt refresh; if that also fails, clear
        if (active && (!error.config?._retry || error.response?.status === 401)) {
          clearTokens();
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      active = false;
    };
  }, []);

  /**
   * Log in user with email & password
   */
  const login = useCallback(async (email, password) => {
    const data = await authApi.login({ email, password });
    const { user: loggedInUser, accessToken, refreshToken } = data;

    setTokens({ accessToken, refreshToken });
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  /**
   * Register a new user
   */
  const register = useCallback(
    async ({ name, email, password, role = "user", preferences }) => {
      const data = await authApi.register({
        name,
        email,
        password,
        role,
        preferences,
      });
      const { user: registeredUser, accessToken, refreshToken } = data;

      setTokens({ accessToken, refreshToken });
      setUser(registeredUser);
      return registeredUser;
    },
    [],
  );

  // Backward compatibility alias for existing code
  const signup = useCallback(
    async (name, email, password) => {
      return register({ name, email, password });
    },
    [register],
  );

  /**
   * Logout user and revoke tokens
   */
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.warn("Backend logout failed or was unreachable:", error.message);
    } finally {
      clearTokens();
      setUser(null);
    }
  }, []);

  /**
   * Refetch current user profile
   */
  const refreshProfile = useCallback(async () => {
    try {
      const userProfile = await authApi.getMe();
      setUser(userProfile);
      return userProfile;
    } catch (error) {
      console.error("Failed to refresh profile:", error);
      return null;
    }
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    signup,
    logout,
    refreshProfile,
    isAuthenticated: Boolean(user),
    updateUser: setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
