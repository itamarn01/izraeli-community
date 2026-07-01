import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import AuthShell from '../../components/common/AuthShell.jsx';
import PasswordInput from '../../components/common/PasswordInput.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginOtpRequest, loginOtpVerify } = useAuth();

  const [mode, setMode] = useState('password'); // 'password' | 'email-request' | 'email-verify'
  const [form, setForm] = useState({ email: '', password: '' });
  const [otpEmail, setOtpEmail] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const refs = useRef([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const goTo = (route) => navigate(route);

  // --- Password login ---
  const onPasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      toast.success('ברוך שובך');
      goTo(
        data.nextStep === 'verify_email' ? '/verify' :
        data.nextStep === 'questionnaire' ? '/onboarding' : '/app',
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאת התחברות');
    } finally {
      setLoading(false);
    }
  };

  // --- Email OTP request ---
  const onRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginOtpRequest(otpEmail);
      toast.success('קוד נשלח למייל שלך');
      setCooldown(45);
      setDigits(['', '', '', '', '', '']);
      setMode('email-verify');
      setTimeout(() => refs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה בשליחת קוד');
    } finally {
      setLoading(false);
    }
  };

  // --- OTP verify ---
  const onVerifyOtp = async (otp) => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await loginOtpVerify(otpEmail, otp);
      toast.success('ברוך שובך');
      goTo(data.nextStep === 'questionnaire' ? '/onboarding' : '/app');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'קוד לא תקין');
      setLoading(false);
    }
  };

  const setDigit = (idx, val) => {
    const v = val.replace(/\D/g, '').slice(0, 1);
    const next = [...digits];
    next[idx] = v;
    setDigits(next);
    if (v && idx < 5) refs.current[idx + 1]?.focus();
    if (v && idx === 5) {
      const full = next.join('');
      if (full.length === 6) onVerifyOtp(full);
    }
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
    if (text.length === 6) onVerifyOtp(text);
  };

  const resendOtp = async () => {
    if (cooldown > 0) return;
    try {
      await loginOtpRequest(otpEmail);
      toast.success('נשלח קוד חדש');
      setCooldown(45);
    } catch {
      toast.error('שגיאה בשליחת קוד');
    }
  };

  return (
    <AuthShell title="ברוכים השבים" subtitle="כניסה לחשבון הקהילה שלך.">

      {/* ── Password login ── */}
      {mode === 'password' && (
        <form onSubmit={onPasswordSubmit} className="space-y-4">
          <div>
            <label className="label">אימייל</label>
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
                שכחתי סיסמה?
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
            {loading ? 'מתחבר…' : 'התחבר עם סיסמה'}
          </button>

          <div className="relative flex items-center gap-3 py-1">
            <div className="flex-1 border-t border-ink-200" />
            <span className="text-xs text-ink-400 shrink-0">או</span>
            <div className="flex-1 border-t border-ink-200" />
          </div>

          <button
            type="button"
            onClick={() => { setOtpEmail(form.email); setMode('email-request'); }}
            className="btn-outline w-full flex items-center justify-center gap-2"
          >
            <Mail className="h-4 w-4" aria-hidden />
            התחבר עם קוד לאימייל
          </button>

          <div className="pt-1 text-center text-sm text-ink-400">
            הרשמה למערכת{' '}
            <Link to="/join" className="text-accent hover:underline font-semibold">
              הצטרפות עם קוד ארגון
            </Link>
          </div>
          <div className="text-center">
            <Link to="/" className="text-xs text-ink-400 hover:text-accent hover:underline">
              חזרה לדף הבית
            </Link>
          </div>
        </form>
      )}

      {/* ── Email OTP request ── */}
      {mode === 'email-request' && (
        <form onSubmit={onRequestOtp} className="space-y-4">
          <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 space-y-3">
            <p className="text-sm text-ink-600 text-center">
              הזן את כתובת האימייל שלך לקבלת קוד התחברות
            </p>
            <div>
              <label className="label">אימייל</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <input
                  type="email"
                  dir="ltr"
                  className="input pr-10"
                  placeholder="הכנס את האימייל שלך"
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'שולח…' : 'שלח קוד אימות'}
            </button>
            <button
              type="button"
              onClick={() => setMode('password')}
              className="w-full text-center text-sm text-ink-400 hover:text-accent py-1"
            >
              ביטול
            </button>
          </div>

          <div className="text-center">
            <Link to="/" className="text-xs text-ink-400 hover:text-accent hover:underline">
              חזרה לדף הבית
            </Link>
          </div>
        </form>
      )}

      {/* ── OTP verify ── */}
      {mode === 'email-verify' && (
        <div className="space-y-5">
          <div className="flex justify-center text-accent">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <p className="text-sm text-ink-500 text-center">
            שלחנו קוד בן 6 ספרות אל{' '}
            <span className="font-semibold text-ink" dir="ltr">{otpEmail}</span>
          </p>

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
                disabled={loading}
                className="h-14 w-12 text-center text-2xl font-bold rounded-xl border border-ink-200 bg-white text-ink focus:border-accent focus:ring-2 focus:ring-accent-100 outline-none disabled:opacity-50"
              />
            ))}
          </div>

          {loading && (
            <p className="text-center text-sm text-accent">מאמת…</p>
          )}

          <div className="text-center text-sm text-ink-400 space-y-2">
            <div>
              לא קיבלת קוד?{' '}
              <button
                type="button"
                onClick={resendOtp}
                disabled={cooldown > 0}
                className="text-accent font-semibold hover:underline disabled:text-ink-300 disabled:no-underline"
              >
                {cooldown > 0 ? `שלח שוב בעוד ${cooldown} שנ׳` : 'שליחה מחדש'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setMode('password')}
              className="text-xs text-ink-400 hover:text-accent hover:underline"
            >
              חזרה לכניסה עם סיסמה
            </button>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
