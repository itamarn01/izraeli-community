import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Search, Mail, Trash2, KeyRound, Send, X, ShieldCheck, ShieldOff, Filter, ChevronLeft, ChevronRight,
} from 'lucide-react';
import adminApi from '../../api/adminClient.js';
import { timeAgo } from '../../utils/format.js';

const PAGE_SIZE = 25;

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filterVerified, setFilterVerified] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [actionUser, setActionUser] = useState(null);
  const [actionType, setActionType] = useState(null);

  const fetchUsers = async (p = 1, opts = { q, filterVerified, filterRole }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: PAGE_SIZE });
      if (opts.q) params.set('q', opts.q);
      if (opts.filterVerified !== 'all') params.set('isEmailVerified', opts.filterVerified);
      if (opts.filterRole !== 'all') params.set('role', opts.filterRole);
      const { data } = await adminApi.get(`/users?${params}`);
      setUsers(data.users);
      setHasMore(data.hasMore);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(1); }, []);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchUsers(1, { q, filterVerified, filterRole }); }, 300);
    return () => clearTimeout(t);
  }, [q, filterVerified, filterRole]);

  const goPage = (p) => { setPage(p); fetchUsers(p); };

  const handleDelete = async (user) => {
    if (!confirm(`למחוק את ${user.email}? הפעולה תמחק גם פוסטים ומשרות שלו ואינה הפיכה.`)) return;
    try {
      await adminApi.delete(`/users/${user._id}`);
      toast.success('המשתמש נמחק');
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה במחיקה');
    }
  };

  const toggleVerify = async (user) => {
    try {
      const { data } = await adminApi.patch(`/users/${user._id}`, {
        isEmailVerified: !user.isEmailVerified,
      });
      setUsers((prev) => prev.map((u) => (u._id === user._id ? data.user : u)));
      toast.success(data.user.isEmailVerified ? 'המייל אומת' : 'אימות המייל בוטל');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-ink">ניהול משתמשים</h1>
          <p className="text-sm text-ink-400 mt-1">{total} משתמשים סה"כ</p>
        </div>
      </header>

      <div className="card p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative md:col-span-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input className="input pr-10" placeholder="חיפוש: מייל / שם / טלפון…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="relative">
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <select className="input pr-10" value={filterVerified} onChange={(e) => setFilterVerified(e.target.value)}>
            <option value="all">סטטוס אימות (הכל)</option>
            <option value="true">מאומתים בלבד</option>
            <option value="false">לא מאומתים</option>
          </select>
        </div>
        <div className="relative">
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <select className="input pr-10" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="all">תפקיד (הכל)</option>
            <option value="member">חברי קהילה</option>
            <option value="admin">מנהלי קהילה</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-ink-400">טוען…</div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center text-ink-400">לא נמצאו משתמשים</div>
        ) : (
          <div className="divide-y divide-ink-50">
            {users.map((u) => {
              const name = [u.profile?.firstName, u.profile?.lastName].filter(Boolean).join(' ') || '—';
              return (
                <div key={u._id} className="flex items-center gap-3 p-4 hover:bg-ink-50/40">
                  <div className="h-10 w-10 rounded-full bg-accent text-white flex items-center justify-center font-bold shrink-0">
                    {(u.profile?.firstName?.[0] || u.email[0] || '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-ink">{name}</span>
                      {u.isEmailVerified ? (
                        <span className="chip text-xs text-olive-700 bg-olive-50">מאומת</span>
                      ) : (
                        <span className="chip text-xs text-ink-400 bg-ink-50">לא מאומת</span>
                      )}
                      {u.role === 'admin' && <span className="chip text-xs text-accent-700 bg-accent-50">מנהל</span>}
                    </div>
                    <div className="text-xs text-ink-500 mt-0.5 flex items-center gap-2 flex-wrap" dir="ltr">
                      <span>{u.email}</span>
                      {u.profile?.phone && <span className="text-ink-300">· {u.profile.phone}</span>}
                    </div>
                    <div className="text-xs text-ink-400 mt-0.5">
                      {u.organization?.name || '—'} · {u.profile?.gedud || 'ללא גדוד'} · נוצר {timeAgo(u.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => toggleVerify(u)}
                      title={u.isEmailVerified ? 'בטל אימות' : 'אמת מייל'}
                      className="h-8 w-8 rounded-lg bg-ink-50 hover:bg-ink-100 text-ink-500 flex items-center justify-center"
                    >
                      {u.isEmailVerified ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => { setActionUser(u); setActionType('message'); }}
                      title="שליחת מייל"
                      className="h-8 w-8 rounded-lg bg-ink-50 hover:bg-ink-100 text-ink-500 flex items-center justify-center"
                    >
                      <Mail className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => { setActionUser(u); setActionType('reset'); }}
                      title="איפוס סיסמה"
                      className="h-8 w-8 rounded-lg bg-ink-50 hover:bg-ink-100 text-ink-500 flex items-center justify-center"
                    >
                      <KeyRound className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(u)}
                      title="מחיקה"
                      className="h-8 w-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {(page > 1 || hasMore) && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => goPage(page - 1)} disabled={page <= 1} className="btn-outline disabled:opacity-50">
            <ChevronRight className="h-4 w-4" />
            הקודם
          </button>
          <span className="text-sm text-ink-500">עמוד {page}</span>
          <button onClick={() => goPage(page + 1)} disabled={!hasMore} className="btn-outline disabled:opacity-50">
            הבא
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      )}

      <AnimatePresence>
        {actionUser && actionType === 'message' && (
          <SendMessageModal user={actionUser} onClose={() => { setActionUser(null); setActionType(null); }} />
        )}
        {actionUser && actionType === 'reset' && (
          <ResetPasswordModal
            user={actionUser}
            onClose={() => { setActionUser(null); setActionType(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ModalFrame({ title, onClose, children }) {
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
        className="card w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-ink-100 px-5 py-3 flex items-center justify-between z-10">
          <h3 className="font-bold text-ink">{title}</h3>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-ink-50 flex items-center justify-center text-ink-500">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </motion.div>
    </motion.div>
  );
}

function SendMessageModal({ user, onClose }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminApi.post(`/users/${user._id}/send-message`, { subject, message });
      toast.success('המייל נשלח');
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה בשליחה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalFrame title={`שליחת מייל ל-${user.email}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">נושא</label>
          <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} required />
        </div>
        <div>
          <label className="label">תוכן ההודעה</label>
          <textarea rows={6} className="input" value={message} onChange={(e) => setMessage(e.target.value)} required />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          <Send className="h-4 w-4" />
          {loading ? 'שולח…' : 'שליחת מייל'}
        </button>
      </form>
    </ModalFrame>
  );
}

function ResetPasswordModal({ user, onClose }) {
  const [mode, setMode] = useState('auto');
  const [newPassword, setNewPassword] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = mode === 'manual'
        ? { newPassword, sendEmail }
        : { sendEmail };
      const { data } = await adminApi.post(`/users/${user._id}/reset-password`, payload);
      setGenerated(data.newPassword);
      toast.success(sendEmail ? 'הסיסמה אופסה ונשלחה במייל' : 'הסיסמה אופסה');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה');
    } finally {
      setLoading(false);
    }
  };

  if (generated) {
    return (
      <ModalFrame title="הסיסמה אופסה" onClose={onClose}>
        <div className="space-y-3">
          <p className="text-sm text-ink-500">סיסמה חדשה למשתמש <span className="font-bold" dir="ltr">{user.email}</span>:</p>
          <div className="rounded-xl bg-accent-50 border border-accent-100 p-4 text-center">
            <code className="font-mono font-bold text-accent-800 text-lg select-all" dir="ltr">{generated}</code>
          </div>
          {sendEmail && <p className="text-xs text-olive-700">✓ הסיסמה נשלחה גם למייל המשתמש</p>}
          <button onClick={onClose} className="btn-primary w-full">סיום</button>
        </div>
      </ModalFrame>
    );
  }

  return (
    <ModalFrame title={`איפוס סיסמה ל-${user.email}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="flex gap-3">
          <label className="flex items-center gap-2 cursor-pointer flex-1 rounded-xl border border-ink-200 p-3 hover:bg-ink-50">
            <input type="radio" checked={mode === 'auto'} onChange={() => setMode('auto')} />
            <span className="text-sm font-semibold text-ink">סיסמה אקראית</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer flex-1 rounded-xl border border-ink-200 p-3 hover:bg-ink-50">
            <input type="radio" checked={mode === 'manual'} onChange={() => setMode('manual')} />
            <span className="text-sm font-semibold text-ink">בחירה ידנית</span>
          </label>
        </div>

        {mode === 'manual' && (
          <div>
            <label className="label">סיסמה חדשה (לפחות 8 תווים)</label>
            <input
              type="text"
              dir="ltr"
              className="input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
        )}

        <label className="flex items-center gap-2 rounded-xl border border-ink-200 p-3 cursor-pointer hover:bg-ink-50">
          <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
          <span className="text-sm">שליחת הסיסמה החדשה למייל המשתמש</span>
        </label>

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          <KeyRound className="h-4 w-4" />
          {loading ? 'מאפס…' : 'איפוס סיסמה'}
        </button>
      </form>
    </ModalFrame>
  );
}
