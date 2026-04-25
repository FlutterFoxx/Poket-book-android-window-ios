import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";

const BASE = process.env.REACT_APP_BACKEND_URL;

// ── Token storage ────────────────────────────────────────────────────────────
// NOTE(security): Tokens are stored in sessionStorage to solve a Kubernetes
// ingress CORS issue that prevents httpOnly cookies from working cross-origin.
// The backend also sets httpOnly cookies as a secondary layer.
// Mitigation: Short token TTL (30 min), automatic refresh, XSS defense via CSP.
const getToken = () => sessionStorage.getItem("access_token");
const setToken = (t) => t ? sessionStorage.setItem("access_token", t) : sessionStorage.removeItem("access_token");
const setRefreshToken = (t) => t ? sessionStorage.setItem("refresh_token", t) : sessionStorage.removeItem("refresh_token");
const getRefreshToken = () => sessionStorage.getItem("refresh_token");

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
