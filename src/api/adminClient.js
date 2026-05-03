import axios from 'axios';

const adminApi = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || '/api') + '/admin',
  withCredentials: false,
});

const TOKEN_KEY = 'izraeli_admin_token';

export function getAdminToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setAdminToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

adminApi.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) setAdminToken(null);
    return Promise.reject(err);
  }
);

export default adminApi;
