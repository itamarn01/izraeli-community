import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/client';
import AuthShell from '../../components/common/AuthShell.jsx';

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const { user, verifyOtp } = useAuth();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const refs = useRef([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

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
    for (let i = 0; i < 6; i += 1) next[i] = text[i] || '';
    setDigits(next);
    refs.current[Math.min(text.length, 5)]?.focus();
  };

  const submit = async (e) => {
    e?.preventDefault();
    const otp = digits.join('');
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      const data = await verifyOtp(user.email, otp);
      toast.success('המייל אומת בהצלחה');
      navigate(data.nextStep === 'dashboard' ? '/app' : '/onboarding');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'קוד לא תקין');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0) return;
    try {
      await api.post('/auth/resend-otp', { email: user.email });
      toast.success('נשלח קוד חדש');
      setCooldown(45);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה בשליחת קוד');
    }
  };

  return (
    <AuthShell
      title="אימות מייל"
      subtitle={`שלחנו קוד בן 6 ספרות אל ${user?.email || 'כתובת המייל שלך'}`}
      step={3}
      totalSteps={4}
    >
      <form onSubmit={submit} className="space-y-6">
        <div className="flex items-center justify-center gap-2 mb-2 text-accent">
          <ShieldCheck className="h-10 w-10" />
        </div>

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
              className="h-14 w-12 text-center text-2xl font-bold rounded-xl border border-ink-200 bg-white text-ink focus:border-accent focus:ring-2 focus:ring-accent-100 outline-none"
            />
          ))}
        </div>

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'מאמת…' : 'אימות קוד'}
        </button>

        <div className="text-center text-sm text-ink-400">
          לא קיבלת קוד?{' '}
          <button type="button" onClick={resend} disabled={cooldown > 0} className="text-accent font-semibold hover:underline disabled:text-ink-300 disabled:no-underline">
            {cooldown > 0 ? `שלח שוב בעוד ${cooldown} שנ׳` : 'שליחה מחדש'}
          </button>
        </div>
      </form>
    </AuthShell>
  );
}
