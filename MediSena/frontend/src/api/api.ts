import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL?.trim() || '/api';

const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
    const status = error.response?.status;
    if (status === 401) {
      const method = String(error.config?.method ?? 'get').toLowerCase();
      const url = String(error.config?.url ?? '');
      const isLoginPost =
        method === 'post' &&
        (url === '/auth/login' || url.endsWith('/auth/login'));

      if (!isLoginPost) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        const path = window.location.pathname.replace(/\/$/, '') || '/';
        if (path !== '/login') {
          window.location.assign('/login');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
