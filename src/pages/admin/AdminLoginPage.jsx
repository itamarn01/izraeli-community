import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { User, ShieldCheck } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';
import PasswordInput from '../../components/common/PasswordInput.jsx';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useAdminAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form.username, form.password);
      if (data.nextStep === 'verify_email') {
        toast('נשלח קוד אימות למייל', { icon: '✉️' });
        navigate(`/admin/verify?u=${encodeURIComponent(form.username)}`);
      } else {
        toast.success('התחברת בהצלחה');
        navigate('/admin');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאת התחברות');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink-800 to-ink" />
      <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-olive/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-accent/15 border border-accent/30 mb-3">
            <ShieldCheck className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-white brand-display">מערכת ניהול</h1>
          <p className="text-sm text-white/60 mt-1">קהילת חטיבת יזרעאלי</p>
        </div>

        <div className="card p-7 bg-white/95 backdrop-blur">
          <h2 className="text-xl font-bold text-ink mb-1">כניסה למנהל</h2>
          <p className="text-sm text-ink-400 mb-5">שם משתמש וסיסמה. נדרש אימות מייל בכניסה ראשונה.</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label">שם משתמש</label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <input
                  type="text"
                  dir="ltr"
                  className="input pr-10"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">סיסמה</label>
              <PasswordInput
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'מתחבר…' : 'כניסה'}
            </button>

            <div className="pt-1 text-center text-sm text-ink-400">
              אין חשבון מנהל?{' '}
              <Link to="/admin/setup" className="text-accent hover:underline font-semibold">
                הקמה ראשונית
              </Link>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-white/40 mt-4">
          <Link to="/" className="hover:text-white/70">← חזרה לאתר הראשי</Link>
        </p>
      </motion.div>
    </div>
  );
}
