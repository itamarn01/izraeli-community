import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, ShieldCheck } from 'lucide-react';
import api from '../../api/client';
import AuthShell from '../../components/common/AuthShell.jsx';
import PasswordInput from '../../components/common/PasswordInput.jsx';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = enter email, 2 = enter OTP + new pass
  const [email, setEmail] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const refs = useRef([]);

  useEffect(() => {
    if (step === 2) refs.current[0]?.focus();
  }, [step]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendCode = async (e) => {
    e?.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('אם הכתובת קיימת — נשלח קוד לאיפוס');
      setStep(2);
      setCooldown(45);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה בשליחת הקוד');
    } finally {
      setLoading(false);
    }
  };

  const setDigit = (idx, val) => {
    const v = val.replace(/\D/g, '').slice(0, 1);
    const next = [...digits];
    next[idx] = v;
    setDigits(next);
    if (v && idx < 5) refs.current[idx + 1]?.focus();
  };

  const onKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) refs.current[idx - 1]?.focus();
  };

  const onPaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = [...digits];
    for (let i = 0; i < 6; i++) next[i] = text[i] || '';
    setDigits(next);
    refs.current[Math.min(text.length, 5)]?.focus();
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length !== 6) { toast.error('יש להזין קוד בן 6 ספרות'); return; }
    if (newPassword.length < 8) { toast.error('הסיסמה חייבת להכיל לפחות 8 תווים'); return; }
    if (newPassword !== confirm) { toast.error('הסיסמאות אינן תואמות'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', { email, otp, newPassword });
      toast.success('הסיסמה אופסה — ניתן להתחבר');
      navigate('/login');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה באיפוס הסיסמה');
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <AuthShell title="שכחתי סיסמה" subtitle="הזינו את כתובת המייל שלכם ונשלח קוד לאיפוס.">
        <form onSubmit={sendCode} className="space-y-4">
          <div>
            <label className="label">כתובת מייל</label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
              <input
                type="email"
                dir="ltr"
                className="input pr-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                autoFocus
              />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'שולח…' : 'שליחת קוד'}
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="text-center text-sm text-ink-400">
            נזכרת?{' '}
            <Link to="/login" className="text-accent hover:underline font-semibold">
              חזרה לכניסה
            </Link>
          </div>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="איפוס סיסמה" subtitle={`הזינו את קוד האיפוס שנשלח אל ${email}`}>
      <form onSubmit={resetPassword} className="space-y-5">
        <div className="flex items-center justify-center text-accent mb-2">
          <ShieldCheck className="h-10 w-10" />
        </div>

        <div>
          <label className="label text-center block mb-2">קוד אימות</label>
          <div className="flex justify-center gap-2" dir="ltr" onPaste={onPaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => (refs.current[i] = el)}
                value={d}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                inputMode="numeric"
                maxLength={1}
                className="h-12 w-11 text-center text-xl font-bold rounded-xl border border-ink-200 bg-white text-ink focus:border-accent focus:ring-2 focus:ring-accent-100 outline-none"
              />
            ))}
          </div>
          <div className="text-center mt-2">
            <button
              type="button"
              onClick={sendCode}
              disabled={cooldown > 0 || loading}
              className="text-xs text-accent hover:underline disabled:text-ink-400 disabled:no-underline"
            >
              {cooldown > 0 ? `שלח שוב בעוד ${cooldown} שנ׳` : 'שליחת קוד מחדש'}
            </button>
          </div>
        </div>

        <div>
          <label className="label">סיסמה חדשה</label>
          <PasswordInput
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="לפחות 8 תווים"
            minLength={8}
            required
          />
        </div>

        <div>
          <label className="label">אימות סיסמה</label>
          <PasswordInput
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="הזן שוב את הסיסמה"
            required
          />
        </div>

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'מאפס…' : 'שמירת סיסמה חדשה'}
        </button>
      </form>
    </AuthShell>
  );
}
