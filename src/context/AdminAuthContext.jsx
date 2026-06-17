import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import adminApi, { getAdminToken, setAdminToken } from '../api/adminClient';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getAdminToken()) {
      setAdmin(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await adminApi.get('/auth/me');
      setAdmin(data.admin);
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (username, password) => {
    const { data } = await adminApi.post('/auth/login', { username, password });
    if (data.token) {
      setAdminToken(data.token);
      setAdmin(data.admin);
    }
    return data;
  };

  const verifyOtp = async (username, otp) => {
    const { data } = await adminApi.post('/auth/verify-otp', { username, otp });
    setAdminToken(data.token);
    setAdmin(data.admin);
    return data;
  };

  const bootstrap = async (payload) => {
    const { data } = await adminApi.post('/auth/bootstrap', payload);
    return data;
  };

  const resendOtp = async (username) => {
    const { data } = await adminApi.post('/auth/resend-otp', { username });
    return data;
  };

  const forgotPassword = async (identifier) => {
    const { data } = await adminApi.post('/auth/forgot-password', { identifier });
    return data;
  };

  const resetPassword = async (identifier, otp, newPassword) => {
    const { data } = await adminApi.post('/auth/reset-password', { identifier, otp, newPassword });
    return data;
  };

  const logout = () => {
    setAdminToken(null);
    setAdmin(null);
  };

  const value = { admin, loading, login, verifyOtp, bootstrap, resendOtp, forgotPassword, resetPassword, logout, refresh, setAdmin };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  return ctx;
}
