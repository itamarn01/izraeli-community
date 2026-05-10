import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { KeyRound, ArrowLeft } from 'lucide-react';
import api from '../../api/client';
import AuthShell from '../../components/common/AuthShell.jsx';

export default function OrgCodePage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [org, setOrg] = useState(null);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/check-org-code', { code: code.trim() });
      if (data.valid) {
        setOrg(data.organization);
        toast.success('קוד תקין — אפשר להמשיך לרישום');
        sessionStorage.setItem('orgCode', code.trim().toUpperCase());
        setTimeout(() => navigate('/register'), 800);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'קוד ארגון לא תקין');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="הצטרפות לקהילה"
      subtitle="כדי להצטרף, נדרש קוד הארגון שקיבלת מהחטיבה."
      step={1}
      totalSteps={4}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">קוד ארגון</label>
          <div className="relative">
            <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              className="input pr-10 tracking-widest text-center font-semibold"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="הזן מזהה ארגון"
              autoFocus
              required
            />
          </div>
          <p className="mt-2 text-xs text-ink-400">
            הקוד מאומת מול מסד הנתונים של הארגון. בלי קוד תקף לא ניתן להירשם.
          </p>
        </div>

        {org && (
          <div className="rounded-xl bg-olive-50 border border-olive-200 p-3 text-sm text-olive-800">
            ✓ קוד תקין — שיוך לארגון <strong>{org.name}</strong>
          </div>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'בודק…' : 'אימות והמשך'}
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="pt-2 text-center text-sm text-ink-400">
          כבר חבר?{' '}
          <Link to="/login" className="text-accent hover:underline font-semibold">
            כניסה
          </Link>
        </div>
        <div className="text-center">
          <Link to="/" className="text-xs text-ink-400 hover:text-accent hover:underline">
            חזרה לדף הבית
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
