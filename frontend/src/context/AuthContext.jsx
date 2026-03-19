import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:5000';

const AuthContext = createContext(null);

// Axios instance with auto-refresh interceptor
export const api = axios.create({ baseURL: API, withCredentials: true });

let isRefreshing = false;
let refreshQueue = [];

api.interceptors.response.use(
  res => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !original._retry) {
      original._retry = true;
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      isRefreshing = true;
      try {
        const { data } = await axios.post(`${API}/auth/refresh`, {}, { withCredentials: true });
        const newToken = data.accessToken;
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        refreshQueue.forEach(({ resolve }) => resolve(newToken));
        refreshQueue = [];
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        refreshQueue.forEach(({ reject }) => reject(error));
        refreshQueue = [];
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken'));
  const [loading, setLoading] = useState(true);

  // Sync token to axios headers whenever it changes
  useEffect(() => {
    if (accessToken) {
      api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      localStorage.setItem('accessToken', accessToken);
    } else {
      delete api.defaults.headers.common.Authorization;
      localStorage.removeItem('accessToken');
    }
  }, [accessToken]);

  // On mount, verify token and load user
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    api.get('/auth/me')
      .then(({ data }) => {
        setUser(data);
        setAccessToken(token);
      })
      .catch(() => {
        setAccessToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (username, email, password) => {
    const { data } = await api.post('/auth/register', { username, email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout').catch(() => {});
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
