import axios from 'axios';

// FIXED: hardcoded '/api' — never reads env vars, never calls Railway directly
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Confirm baseURL at startup — must always print exactly "/api"
if (typeof window !== 'undefined') {
  console.log('[bieli] Axios baseURL:', api.defaults.baseURL);
}

// ── Request interceptor: attach token ────────────────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('bieli_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Response interceptor: handle 401 ─────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    if (status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('bieli_token');
    }
    return Promise.reject(err);
  }
);

export default api;
