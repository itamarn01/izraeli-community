import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { User, ShieldCheck } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';
import PasswordInput from '../../components/common/PasswordInput.jsx';
import Logo from '../../components/common/Logo.jsx';

export default function AdminForgotPasswordPage() {
  const navigate = useNavigate();
  const { forgotPassword, resetPassword } = useAdminAuth();

  const [step, setStep] = useState(1); // 1 = identifier, 2 = code + new password
  const [identifier, setIdentifier] = useState('');
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
    if (!identifier.trim()) return;
    setLoading(true);
    try {
      await forgotPassword(identifier.trim());
      toast.success('אם החשבון קיים — נשלח קוד לאיפוס');
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

  const submitReset = async (e) => {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length !== 6) { toast.error('יש להזין קוד בן 6 ספרות'); return; }
    if (newPassword.length < 8) { toast.error('הסיסמה חייבת להכיל לפחות 8 תווים'); return; }
    if (newPassword !== confirm) { toast.error('הסיסמאות אינן תואמות'); return; }
    setLoading(true);
    try {
      await resetPassword(identifier.trim(), otp, newPassword);
      toast.success('הסיסמה אופסה — ניתן להתחבר');
      navigate('/admin/login');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה באיפוס הסיסמה');
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
        <div className="text-center mb-8 flex justify-center">
          <Logo size={64} variant="light" />
        </div>

        <div className="card p-7 bg-white/95 backdrop-blur">
          {step === 1 ? (
            <>
              <h2 className="text-xl font-bold text-ink mb-1">איפוס סיסמת מנהל</h2>
              <p className="text-sm text-ink-400 mb-5">הזינו שם משתמש או מייל, ונשלח קוד איפוס למייל.</p>

              <form onSubmit={sendCode} className="space-y-4">
                <div>
                  <label className="label">שם משתמש או מייל</label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                    <input
                      type="text"
                      dir="ltr"
                      className="input pr-10"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="שם משתמש או name@example.com"
                      autoComplete="username"
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary w-full" disabled={loading}>
                  {loading ? 'שולח…' : 'שליחת קוד'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-ink mb-1">הזנת קוד איפוס</h2>
              <p className="text-sm text-ink-400 mb-5">הזינו את הקוד שנשלח למייל וסיסמה חדשה.</p>

              <form onSubmit={submitReset} className="space-y-5">
                <div className="flex items-center justify-center text-accent">
                  <ShieldCheck className="h-9 w-9" />
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
            </>
          )}

          <div className="pt-4 text-center text-sm text-ink-400">
            <Link to="/admin/login" className="text-accent hover:underline font-semibold">
              חזרה לכניסה
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-white/40 mt-4">
          <Link to="/" className="hover:text-white/70">← חזרה לאתר הראשי</Link>
        </p>
      </motion.div>
    </div>
  );
}
