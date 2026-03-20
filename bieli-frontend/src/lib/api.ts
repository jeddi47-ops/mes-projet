import axios from 'axios';

// Always use relative URLs → proxied by Next.js API route to Railway
const api = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Request interceptor: attach token + log ──────────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('bieli_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  console.log(`[bieli] → ${config.method?.toUpperCase()} ${config.baseURL ?? ''}${config.url}`);
  return config;
});

// ── Response interceptor: log + handle 401 ──────────────────────────────────
api.interceptors.response.use(
  (res) => {
    console.log(`[bieli] ← ${res.status} ${res.config.url}`);
    return res;
  },
  (err) => {
    const status = err.response?.status;
    const url = err.config?.url;
    console.error(`[bieli] ✗ ${status ?? 'NETWORK'} ${url}`, err.response?.data ?? err.message);

    if (status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('bieli_token');
    }
    return Promise.reject(err);
  }
);

export default api;
