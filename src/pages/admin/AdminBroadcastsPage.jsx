import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Megaphone, Users, CalendarDays, Trash2, X, RefreshCw, AlertCircle,
  CheckCircle2, Loader2, Clock, Mail,
} from 'lucide-react';
import adminApi from '../../api/adminClient';
import { timeAgo } from '../../utils/format.js';

// Refresh only while something is still running, so an idle screen is quiet.
const LIVE_POLL_MS = 3000;

const STATUS = {
  queued: { label: 'ממתין', cls: '!bg-ink-100 !text-ink-600' },
  sending: { label: 'בשליחה', cls: '!bg-accent-50 !text-accent-700' },
  completed: { label: 'הושלם', cls: '!bg-olive-100 !text-olive-800' },
  completed_with_errors: { label: 'הושלם עם שגיאות', cls: '!bg-amber-100 !text-amber-800' },
  failed: { label: 'נכשל', cls: '!bg-red-100 !text-red-700' },
  cancelled: { label: 'בוטל', cls: '!bg-ink-100 !text-ink-500' },
};

function StatusChip({ broadcast }) {
  if (broadcast.isStalled) return <span className="chip !bg-amber-100 !text-amber-800">נתקע</span>;
  const s = STATUS[broadcast.status] || { label: broadcast.status, cls: '' };
  return <span className={`chip ${s.cls}`}>{s.label}</span>;
}

function ProgressBar({ broadcast }) {
  const handled = broadcast.sent + broadcast.failed;
  const pct = broadcast.total ? Math.round((handled / broadcast.total) * 100) : 0;
  return (
    <div className="w-full">
      <div className="h-1.5 rounded-full bg-ink-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${broadcast.failed > 0 ? 'bg-amber-500' : 'bg-accent'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 text-[11px] text-ink-400">
        {broadcast.sent} נשלחו
        {broadcast.failed > 0 && <span className="text-red-600"> · {broadcast.failed} נכשלו</span>}
        {' '}· מתוך {broadcast.total}
      </div>
    </div>
  );
}

function DetailModal({ broadcast, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        role="dialog"
        aria-modal="true"
        aria-label={broadcast.subject}
        className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-ink-100 px-5 py-3 flex items-center gap-3 z-10">
          <div className="min-w-0">
            <h3 className="font-bold text-ink truncate">{broadcast.subject}</h3>
            <p className="text-xs text-ink-400">{broadcast.audience?.label}</p>
          </div>
          <button onClick={onClose} aria-label="סגירה" className="h-8 w-8 rounded-lg hover:bg-ink-50 flex items-center justify-center text-ink-500 shrink-0 mr-auto">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-olive-50 border border-olive-100 p-3">
              <div className="text-xl font-bold text-olive-800">{broadcast.sent}</div>
              <div className="text-[11px] text-olive-700">נשלחו</div>
            </div>
            <div className="rounded-xl bg-red-50 border border-red-100 p-3">
              <div className="text-xl font-bold text-red-700">{broadcast.failed}</div>
              <div className="text-[11px] text-red-600">נכשלו</div>
            </div>
            <div className="rounded-xl bg-ink-50 border border-ink-100 p-3">
              <div className="text-xl font-bold text-ink">{broadcast.total}</div>
              <div className="text-[11px] text-ink-400">סה״כ</div>
            </div>
          </div>

          <dl className="rounded-xl border border-ink-100 bg-ink-50/40 p-4 text-sm space-y-1.5">
            <div className="flex gap-2">
              <dt className="text-ink-400 w-28 shrink-0">נשלח על ידי</dt>
              <dd className="font-semibold text-ink">{broadcast.adminName || '—'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-ink-400 w-28 shrink-0">מועד</dt>
              <dd className="text-ink">{new Date(broadcast.createdAt).toLocaleString('he-IL')}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-ink-400 w-28 shrink-0">ספק</dt>
              <dd className="text-ink">{broadcast.provider === 'flashy' ? 'Flashy' : broadcast.provider}</dd>
            </div>
          </dl>

          {broadcast.error && (
            <p className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-px" />
              {broadcast.error}
            </p>
          )}

          {broadcast.failures?.length > 0 && (
            <details className="rounded-xl border border-ink-100 p-3" open>
              <summary className="cursor-pointer text-sm font-semibold text-ink">
                כתובות שנכשלו ({broadcast.failures.length})
              </summary>
              <ul className="mt-2 space-y-1 max-h-56 overflow-y-auto text-xs">
                {broadcast.failures.map((f, i) => (
                  <li key={`${f.email}-${i}`} className="flex flex-wrap gap-x-2 text-ink-500">
                    <span dir="ltr" className="font-mono text-ink">{f.email}</span>
                    <span className="text-red-600">{f.error}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-ink mb-2">
              <Mail className="h-4 w-4 text-accent" />
              תוכן ההודעה
            </div>
            <div
              dir="rtl"
              className="form-doc-body rounded-xl border border-ink-100 p-4 text-sm text-ink-600"
              dangerouslySetInnerHTML={{ __html: broadcast.bodyHtml }}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminBroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [config, setConfig] = useState(null);
  const [checking, setChecking] = useState(false);

  const load = () =>
    adminApi
      .get('/broadcasts')
      .then(({ data }) => setBroadcasts(data.broadcasts))
      .catch(() => toast.error('שגיאה בטעינת התפוצות'))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    adminApi.get('/broadcasts/status').then(({ data }) => setConfig(data)).catch(() => {});
  }, []);

  // Keep the list live only while a send is in flight.
  const active = broadcasts.some((b) => ['queued', 'sending'].includes(b.status) && !b.isStalled);
  useEffect(() => {
    if (!active) return undefined;
    const t = setTimeout(load, LIVE_POLL_MS);
    return () => clearTimeout(t);
  }, [active, broadcasts]);

  const verify = async () => {
    setChecking(true);
    try {
      const { data } = await adminApi.get('/broadcasts/status', { params: { verify: true } });
      setConfig(data);
      if (data.verified) toast.success(`החיבור ל-Flashy תקין${data.account?.name ? ` · ${data.account.name}` : ''}`);
      else toast.error(data.message || 'החיבור ל-Flashy נכשל');
    } catch {
      toast.error('שגיאה בבדיקת החיבור');
    } finally {
      setChecking(false);
    }
  };

  const remove = async (broadcast) => {
    if (!window.confirm(`למחוק את הרישום של "${broadcast.subject}" מההיסטוריה?`)) return;
    try {
      await adminApi.delete(`/broadcasts/${broadcast._id}`);
      setBroadcasts((list) => list.filter((b) => b._id !== broadcast._id));
      toast.success('נמחק מההיסטוריה');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה במחיקה');
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">תפוצות מייל</h1>
          <p className="text-sm text-ink-500 mt-0.5">
            היסטוריה ומעקב אחר מיילים שנשלחו בתפוצה רחבה דרך Flashy.
          </p>
        </div>
        <button onClick={verify} disabled={checking} className="btn-outline mr-auto">
          {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          בדיקת החיבור ל-Flashy
        </button>
      </header>

      {config && !config.configured && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">שליחת תפוצה אינה מוגדרת</p>
            <p className="mt-0.5 text-xs leading-relaxed">{config.message}</p>
          </div>
        </div>
      )}
      {config?.configured && (
        <p className="text-xs text-ink-400">
          נשלח מ־<span dir="ltr" className="font-mono">{config.from?.name} &lt;{config.from?.email}&gt;</span>
          {config.verified === false && config.message ? ` · ${config.message}` : ''}
        </p>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : broadcasts.length === 0 ? (
        <div className="card p-12 text-center">
          <Megaphone className="h-10 w-10 text-ink-300 mx-auto" />
          <p className="mt-3 text-ink-400">
            עדיין לא נשלחו תפוצות. אפשר לשלוח מטאב המשתמשים או מתוך אירוע.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {broadcasts.map((b) => (
            <div key={b._id} className="card p-4 flex flex-col sm:flex-row gap-4">
              <div
                className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                  b.audience?.type === 'event' ? 'bg-accent-50 text-accent-700' : 'bg-muted-100 text-muted-700'
                }`}
              >
                {b.audience?.type === 'event' ? <CalendarDays className="h-5 w-5" /> : <Users className="h-5 w-5" />}
              </div>

              <button onClick={() => setSelected(b)} className="flex-1 min-w-0 text-right">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-ink">{b.subject}</h3>
                  <StatusChip broadcast={b} />
                </div>
                <p className="mt-0.5 text-xs text-ink-400">
                  {b.audience?.label} · {timeAgo(b.createdAt)}
                  {b.adminName ? ` · ${b.adminName}` : ''}
                </p>
                <div className="mt-2 max-w-md">
                  <ProgressBar broadcast={b} />
                </div>
              </button>

              <div className="flex sm:flex-col items-center gap-2 shrink-0">
                {['completed', 'completed_with_errors'].includes(b.status) && (
                  <CheckCircle2 className="h-4 w-4 text-olive-600" />
                )}
                {b.status === 'sending' && !b.isStalled && <Loader2 className="h-4 w-4 animate-spin text-accent" />}
                {b.isStalled && <Clock className="h-4 w-4 text-amber-600" />}
                <button
                  onClick={() => remove(b)}
                  aria-label="מחיקה מההיסטוריה"
                  className="h-9 w-9 rounded-xl border border-ink-200 text-red-500 hover:bg-red-50 flex items-center justify-center"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selected && <DetailModal broadcast={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}
