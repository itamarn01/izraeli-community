import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import AuthShell from '../../components/common/AuthShell.jsx';
import PasswordInput from '../../components/common/PasswordInput.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      toast.success('ברוך שובך');
      const route =
        data.nextStep === 'verify_email' ? '/verify' :
        data.nextStep === 'questionnaire' ? '/onboarding' : '/app';
      navigate(route);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאת התחברות');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="ברוכים השבים" subtitle="כניסה לחשבון הקהילה שלך.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">כתובת מייל</label>
          <div className="relative">
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              type="email"
              dir="ltr"
              className="input pr-10"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label !mb-0">סיסמה</label>
            <Link to="/forgot-password" className="text-xs text-accent hover:underline">
              שכחתי סיסמה
            </Link>
          </div>
          <PasswordInput
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="current-password"
            required
          />
        </div>

        <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
          {loading ? 'מתחבר…' : 'כניסה'}
        </button>

        <div className="pt-1 text-center text-sm text-ink-400">
          חדש בקהילה?{' '}
          <Link to="/join" className="text-accent hover:underline font-semibold">
            הצטרפו עם קוד ארגון
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
