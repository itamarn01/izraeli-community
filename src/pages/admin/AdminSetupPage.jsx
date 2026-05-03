import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ShieldCheck, User, Mail, Key } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';
import PasswordInput from '../../components/common/PasswordInput.jsx';

export default function AdminSetupPage() {
  const navigate = useNavigate();
  const { bootstrap } = useAdminAuth();
  const [form, setForm] = useState({
    username: '', email: '', password: '', fullName: '', setupKey: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await bootstrap(form);
      toast.success('חשבון נוצר. נשלח קוד אימות למייל');
      navigate(`/admin/verify?u=${encodeURIComponent(form.username)}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה ביצירת החשבון');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink-800 to-ink" />
      <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-lg"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-accent/15 border border-accent/30 mb-3">
            <ShieldCheck className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-white brand-display">הקמת חשבון מנהל</h1>
        </div>

        <div className="card p-7 bg-white/95 backdrop-blur">
          <p className="text-sm text-ink-500 mb-5">
            יצירת חשבון מנהל ראשון. אם כבר קיים מנהל במערכת, נדרש מפתח התקנה.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">שם משתמש</label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                  <input dir="ltr" className="input pr-10" value={form.username} onChange={(e) => set('username', e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="label">שם מלא</label>
                <input className="input" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="label">כתובת מייל</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <input type="email" dir="ltr" className="input pr-10" value={form.email} onChange={(e) => set('email', e.target.value)} required />
              </div>
            </div>

            <div>
              <label className="label">סיסמה (לפחות 8 תווים)</label>
              <PasswordInput value={form.password} onChange={(e) => set('password', e.target.value)} required minLength={8} />
            </div>

            <div>
              <label className="label">מפתח התקנה (אם נדרש)</label>
              <div className="relative">
                <Key className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <input dir="ltr" className="input pr-10" value={form.setupKey} onChange={(e) => set('setupKey', e.target.value)} placeholder="ADMIN_SETUP_KEY מהשרת" />
              </div>
              <p className="text-xs text-ink-400 mt-1">המנהל הראשון נוצר ללא מפתח. כל מנהל נוסף דורש מפתח שמוגדר במשתנה הסביבה.</p>
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'יוצר חשבון…' : 'יצירת חשבון'}
            </button>

            <div className="pt-1 text-center text-sm text-ink-400">
              <Link to="/admin/login" className="text-accent hover:underline font-semibold">
                כבר יש חשבון? כניסה
              </Link>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
