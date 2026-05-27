import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';

export default function AdminVerifyPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const username = params.get('u') || '';
  const { verifyOtp, resendOtp } = useAdminAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!username) return toast.error('חסר שם משתמש');
    setLoading(true);
    try {
      await verifyOtp(username, otp);
      toast.success('ברוך הבא');
      navigate('/admin');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'קוד שגוי');
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (!username) return;
    setResending(true);
    try {
      const data = await resendOtp(username);
      if (data.emailSent === false) {
        toast.error('שליחת המייל נכשלה — בדוק הגדרות SMTP בשרת');
      } else {
        toast.success('קוד חדש נשלח');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה בשליחת הקוד');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink-800 to-ink" />
      <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-accent/15 border border-accent/30 mb-3">
            <ShieldCheck className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-white brand-display">אימות מייל</h1>
        </div>

        <div className="card p-7 bg-white/95 backdrop-blur">
          <p className="text-sm text-ink-500 mb-5">
            הכנס את קוד האימות שנשלח למייל שלך עבור המשתמש <span className="font-bold" dir="ltr">{username}</span>.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label">קוד אימות (6 ספרות)</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                dir="ltr"
                className="input text-center text-2xl tracking-[0.5em] font-bold"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading || otp.length !== 6}>
              {loading ? 'מאמת…' : 'אימות וכניסה'}
            </button>

            <button
              type="button"
              onClick={onResend}
              disabled={resending}
              className="w-full text-sm text-accent hover:underline"
            >
              {resending ? 'שולח…' : 'שליחת קוד חדש'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/40 mt-4">
          <Link to="/admin/login" className="hover:text-white/70">← חזרה להתחברות</Link>
        </p>
      </motion.div>
    </div>
  );
}
