import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";

const BASE = process.env.REACT_APP_BACKEND_URL;

// ── Token storage — localStorage for persistence across app restarts ─────────
// Mobile/desktop apps need tokens to survive close/reopen (15+ day sessions).
// localStorage persists indefinitely; tokens have 7-day expiry built in.
// Safe storage helpers — handle restricted storage environments (Capacitor, etc.)
const safeGet = (key) => { try { return localStorage.getItem(key) || sessionStorage.getItem(key); } catch { return null; } };
const safeSet = (key, val) => { try { if (val) { localStorage.setItem(key, val); sessionStorage.setItem(key, val); } else { localStorage.removeItem(key); sessionStorage.removeItem(key); } } catch (e) { /* storage restricted in this environment */ } };
const getToken = () => safeGet("access_token");
const setToken = (t) => safeSet("access_token", t);
const setRefreshToken = (t) => safeSet("refresh_token", t);
const getRefreshToken = () => safeGet("refresh_token");

export const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !original.url?.includes("/auth/")) {
      original._retry = true;
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const res = await axios.post(`${BASE}/api/auth/refresh`, { refresh_token: refreshToken });
          const newToken = res.data.access_token;
          setToken(newToken);
          original.headers["Authorization"] = `Bearer ${newToken}`;
          return api(original);
        } catch (refreshErr) {
          if (process.env.NODE_ENV === "development") {
            console.error("Token refresh failed:", refreshErr);
          }
          setToken(null); setRefreshToken(null);
          window.location.href = "/login";
        }
      } else {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // CRITICAL: If returning from Google OAuth, skip /me check — AuthCallback handles it
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }
    const token = getToken();
    if (!token) { setUser(false); setLoading(false); return; }
    api.get("/api/auth/me")
      .then((r) => setUser(r.data))
      .catch(() => { setUser(false); setToken(null); setRefreshToken(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback((userData) => {
    if (userData.access_token) setToken(userData.access_token);
    if (userData.refresh_token) setRefreshToken(userData.refresh_token);
    const { access_token, refresh_token, ...userInfo } = userData;
    setUser(userInfo);
  }, []);

  const logout = useCallback(async () => {
    try { await api.post("/api/auth/logout"); } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Logout error:", err);
      }
    }
    setToken(null); setRefreshToken(null); setUser(false);
    window.location.href = "/login";
  }, []);

  // Memoised context value prevents unnecessary re-renders of all consumers
  const contextValue = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
