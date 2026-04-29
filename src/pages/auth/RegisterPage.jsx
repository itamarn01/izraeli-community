import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import AuthShell from '../../components/common/AuthShell.jsx';
import PasswordInput from '../../components/common/PasswordInput.jsx';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', confirm: '', organizationCode: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('orgCode');
    if (saved) setForm((f) => ({ ...f, organizationCode: saved }));
    else navigate('/join');
  }, [navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('הסיסמה חייבת להכיל לפחות 8 תווים'); return; }
    if (form.password !== form.confirm) { toast.error('הסיסמאות אינן תואמות'); return; }
    setLoading(true);
    try {
      await register({ email: form.email, password: form.password, organizationCode: form.organizationCode });
      toast.success('נרשמת בהצלחה — שלחנו קוד אימות למייל');
      navigate('/verify');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה בהרשמה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="פרטי חשבון" subtitle="כתובת המייל והסיסמה שלך לכניסה." step={2} totalSteps={4}>
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
              placeholder="name@example.com"
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div>
          <label className="label">סיסמה</label>
          <PasswordInput
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="לפחות 8 תווים"
            minLength={8}
            autoComplete="new-password"
            required
          />
        </div>

        <div>
          <label className="label">אימות סיסמה</label>
          <PasswordInput
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            placeholder="הזן שוב את הסיסמה"
            autoComplete="new-password"
            required
          />
        </div>

        <div className="rounded-xl bg-muted-50 border border-muted-100 p-3 text-xs text-muted-700">
          קוד הארגון: <strong className="font-mono">{form.organizationCode}</strong>
        </div>

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'יוצר חשבון…' : 'יצירת חשבון'}
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center justify-between pt-1 text-sm">
          <Link to="/" className="inline-flex items-center gap-1.5 text-ink-400 hover:text-ink">
            <Home className="h-3.5 w-3.5" />
            דף הבית
          </Link>
          <Link to="/login" className="text-accent hover:underline font-semibold">
            יש לי חשבון
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
