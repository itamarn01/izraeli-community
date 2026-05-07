import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { useAdminAuth } from './context/AdminAuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import SplashScreen from './components/common/SplashScreen.jsx';
import DashboardLayout from './components/layout/DashboardLayout.jsx';
import AdminLayout from './components/admin/AdminLayout.jsx';

import OrgCodePage from './pages/auth/OrgCodePage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import VerifyOtpPage from './pages/auth/VerifyOtpPage.jsx';
import QuestionnairePage from './pages/auth/QuestionnairePage.jsx';

import DashboardPage from './pages/DashboardPage.jsx';
import BenefitsPage from './pages/BenefitsPage.jsx';
import JobsPage from './pages/JobsPage.jsx';
import FeedPage from './pages/FeedPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';
import TermsPage from './pages/TermsPage.jsx';
import PrivacyPage from './pages/PrivacyPage.jsx';

import AdminLoginPage from './pages/admin/AdminLoginPage.jsx';
import AdminVerifyPage from './pages/admin/AdminVerifyPage.jsx';
import AdminSetupPage from './pages/admin/AdminSetupPage.jsx';
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx';
import AdminOrgsPage from './pages/admin/AdminOrgsPage.jsx';
import AdminJobsPage from './pages/admin/AdminJobsPage.jsx';
import AdminPostsPage from './pages/admin/AdminPostsPage.jsx';
import AdminBenefitsPage from './pages/admin/AdminBenefitsPage.jsx';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <SplashScreen />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!user.isEmailVerified) return <Navigate to="/verify" replace />;
  if (!user.isProfileComplete) return <Navigate to="/onboarding" replace />;
  return children;
}

function GateOtp({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <SplashScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.isEmailVerified) {
    return <Navigate to={user.isProfileComplete ? '/app' : '/onboarding'} replace />;
  }
  return children;
}

function GateQuestionnaire({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <SplashScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isEmailVerified) return <Navigate to="/verify" replace />;
  if (user.isProfileComplete) return <Navigate to="/app" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { admin, loading } = useAdminAuth();
  if (loading) return <SplashScreen message="טוען מערכת ניהול…" />;
  if (!admin) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/join" element={<OrgCodePage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route
        path="/verify"
        element={
          <GateOtp>
            <VerifyOtpPage />
          </GateOtp>
        }
      />
      <Route
        path="/onboarding"
        element={
          <GateQuestionnaire>
            <QuestionnairePage />
          </GateQuestionnaire>
        }
      />

      <Route
        path="/app"
        element={
          <RequireAuth>
            <NotificationProvider>
              <DashboardLayout />
            </NotificationProvider>
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="benefits" element={<BenefitsPage />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="feed" element={<FeedPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Admin panel — separate auth */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/verify" element={<AdminVerifyPage />} />
      <Route path="/admin/setup" element={<AdminSetupPage />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="organizations" element={<AdminOrgsPage />} />
        <Route path="jobs" element={<AdminJobsPage />} />
        <Route path="posts" element={<AdminPostsPage />} />
        <Route path="benefits" element={<AdminBenefitsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
