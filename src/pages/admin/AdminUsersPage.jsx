import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Search, Mail, Trash2, KeyRound, Send, X, ShieldCheck, ShieldOff, Filter,
  ChevronLeft, ChevronRight, Download, Baby, Phone, MapPin, Calendar,
  Briefcase, Heart, Users, UserX, Clock, GraduationCap,
} from 'lucide-react';
import adminApi from '../../api/adminClient.js';
import { timeAgo, formatDate } from '../../utils/format.js';

const PAGE_SIZE = 25;

const GEDUDIM = ['משמר העמקים', 'אבישי', 'הכרמל', 'אבשלום', 'חרב שאול'];
const EMPLOY_OPTIONS = [
  { v: 'employee', label: 'שכיר/ה' }, { v: 'self_employed', label: 'עצמאי/ת' },
  { v: 'combined', label: 'משולב' }, { v: 'not_working', label: 'לא עובד/ת' },
  { v: 'student', label: 'סטודנט/ית' },
];
const GENDER_OPTIONS = [{ v: 'male', label: 'זכר' }, { v: 'female', label: 'נקבה' }, { v: 'other', label: 'אחר' }];
const MARITAL_OPTIONS = [
  { v: 'single', label: 'רווק/ה' }, { v: 'married', label: 'נשוי/אה' },
  { v: 'common_law', label: 'ידוע/ה בציבור' }, { v: 'in_relationship', label: 'בזוגיות' },
  { v: 'divorced', label: 'גרוש/ה' }, { v: 'other', label: 'אחר' },
];

const GENDER_HE = { male: 'זכר', female: 'נקבה', other: 'אחר' };
const MARITAL_HE = { single: 'רווק/ה', married: 'נשוי/אה', common_law: 'ידוע/ה בציבור', in_relationship: 'בזוגיות', divorced: 'גרוש/ה', other: 'אחר' };
const EMPLOY_HE = { employee: 'שכיר/ה', self_employed: 'עצמאי/ת', combined: 'משולב', not_working: 'לא עובד/ת', student: 'סטודנט/ית' };

const AVATAR_COLORS = ['#E74C3C','#9B59B6','#2980B9','#27AE60','#E67E22','#1ABC9C','#E91E63','#607D8B'];
function getUserColor(id) {
  let hash = 0;
  const str = String(id || '');
  for (let i = 0; i < str.length; i++) { hash = str.charCodeAt(i) + ((hash << 5) - hash); hash |= 0; }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function AdminUsersPage() {
  const [tab, setTab] = useState('active');

  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [deletedAccounts, setDeletedAccounts] = useState([]);
  const [deletedPage, setDeletedPage] = useState(1);
  const [deletedHasMore, setDeletedHasMore] = useState(false);
  const [deletedTotal, setDeletedTotal] = useState(0);
  const [deletedLoading, setDeletedLoading] = useState(false);

  const [q, setQ] = useState('');
  const [filterVerified, setFilterVerified] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterGedud, setFilterGedud] = useState('all');
  const [filterEmploy, setFilterEmploy] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [filterMarital, setFilterMarital] = useState('all');

  const [actionUser, setActionUser] = useState(null);
  const [actionType, setActionType] = useState(null);

  const buildParams = (p = page, opts = {}) => {
    const o = { q, filterVerified, filterRole, filterGedud, filterEmploy, filterGender, filterMarital, ...opts };
    const params = new URLSearchParams({ page: p, limit: PAGE_SIZE });
    if (o.q) params.set('q', o.q);
    if (o.filterVerified !== 'all') params.set('isEmailVerified', o.filterVerified);
    if (o.filterRole !== 'all') params.set('role', o.filterRole);
    if (o.filterGedud !== 'all') params.set('gedud', o.filterGedud);
    if (o.filterEmploy !== 'all') params.set('employmentStatus', o.filterEmploy);
    if (o.filterGender !== 'all') params.set('gender', o.filterGender);
    if (o.filterMarital !== 'all') params.set('maritalStatus', o.filterMarital);
    return params;
  };

  const fetchUsers = async (p = 1, opts = {}) => {
    setLoading(true);
    try {
      const { data } = await adminApi.get(`/users?${buildParams(p, opts)}`);
      setUsers(data.users);
      setHasMore(data.hasMore);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(1); }, []);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchUsers(1); }, 300);
    return () => clearTimeout(t);
  }, [q, filterVerified, filterRole, filterGedud, filterEmploy, filterGender, filterMarital]);

  const goPage = (p) => { setPage(p); fetchUsers(p); };

  const fetchDeleted = async (p = 1) => {
    setDeletedLoading(true);
    try {
      const { data } = await adminApi.get(`/users/deleted?page=${p}&limit=${PAGE_SIZE}`);
      setDeletedAccounts(data.accounts);
      setDeletedHasMore(data.hasMore);
      setDeletedTotal(data.total);
    } finally {
      setDeletedLoading(false);
    }
  };

  const goDeletedPage = (p) => { setDeletedPage(p); fetchDeleted(p); };

  useEffect(() => {
    if (tab === 'deleted') fetchDeleted(1);
  }, [tab]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = buildParams(1, {});
      params.delete('page');
      params.delete('limit');
      const { data } = await adminApi.get(`/users/export?${params}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([data], { type: 'text/csv;charset=utf-8;' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'users.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('שגיאה בייצוא');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`למחוק את ${user.email}? הפעולה תמחק גם פוסטים ומשרות שלו ואינה הפיכה.`)) return;
    try {
      await adminApi.delete(`/users/${user._id}`);
      toast.success('המשתמש נמחק');
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      setTotal((t) => t - 1);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה במחיקה');
    }
  };

  const toggleVerify = async (user) => {
    try {
      const { data } = await adminApi.patch(`/users/${user._id}`, { isEmailVerified: !user.isEmailVerified });
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
          <p className="text-sm text-ink-400 mt-1">
            {tab === 'active' ? `${total} משתמשים פעילים` : `${deletedTotal} חשבונות מחוקים`}
          </p>
        </div>
        {tab === 'active' && (
          <button onClick={handleExport} disabled={exporting} className="btn-outline">
            <Download className="h-4 w-4" />
            {exporting ? 'מייצא…' : 'ייצוא לאקסל'}
          </button>
        )}
      </header>

      {/* Tab toggle */}
      <div className="flex gap-1 bg-ink-50 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('active')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'active' ? 'bg-white text-ink shadow-sm' : 'text-ink-400 hover:text-ink'}`}
        >
          <span className="flex items-center gap-2"><Users className="h-4 w-4" />פעילים</span>
        </button>
        <button
          onClick={() => setTab('deleted')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'deleted' ? 'bg-white text-red-600 shadow-sm' : 'text-ink-400 hover:text-ink'}`}
        >
          <span className="flex items-center gap-2"><UserX className="h-4 w-4" />מחוקים</span>
        </button>
      </div>

      {tab === 'deleted' && (
        <>
          <div className="card overflow-hidden">
            {deletedLoading ? (
              <div className="p-10 text-center text-ink-400">טוען…</div>
            ) : deletedAccounts.length === 0 ? (
              <div className="p-10 text-center text-ink-400">אין חשבונות מחוקים</div>
            ) : (
              <div className="divide-y divide-ink-50">
                {deletedAccounts.map((a) => (
                  <div key={a._id} className="flex items-center gap-3 p-4 hover:bg-ink-50/40">
                    <div
                      className="h-10 w-10 rounded-full text-white flex items-center justify-center font-bold shrink-0 bg-red-400"
                    >
                      {(a.fullName?.[0] || a.email[0] || '?').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-ink">{a.fullName || '—'}</div>
                      <div className="text-xs text-ink-500 mt-0.5" dir="ltr">{a.email}</div>
                      <div className="text-xs text-ink-400 mt-0.5">
                        {a.organization?.name || 'ללא ארגון'}
                      </div>
                    </div>
                    <div className="shrink-0 text-left">
                      <div className="flex items-center gap-1 text-xs text-red-500">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(a.deletedAt).toLocaleDateString('he-IL')}
                      </div>
                      <div className="text-xs text-ink-400 mt-0.5 text-left">
                        {new Date(a.deletedAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {(deletedPage > 1 || deletedHasMore) && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => goDeletedPage(deletedPage - 1)} disabled={deletedPage <= 1} className="btn-outline disabled:opacity-50">
                <ChevronRight className="h-4 w-4" />
                הקודם
              </button>
              <span className="text-sm text-ink-500">עמוד {deletedPage}</span>
              <button onClick={() => goDeletedPage(deletedPage + 1)} disabled={!deletedHasMore} className="btn-outline disabled:opacity-50">
                הבא
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}

      {tab === 'active' && <><div className="card p-4 space-y-3">
        {/* Row 1: search + verified + role */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
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
        {/* Row 2: profile filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <select className="input" value={filterGedud} onChange={(e) => setFilterGedud(e.target.value)}>
            <option value="all">גדוד (הכל)</option>
            {GEDUDIM.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <select className="input" value={filterEmploy} onChange={(e) => setFilterEmploy(e.target.value)}>
            <option value="all">תעסוקה (הכל)</option>
            {EMPLOY_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
          </select>
          <select className="input" value={filterGender} onChange={(e) => setFilterGender(e.target.value)}>
            <option value="all">מגדר (הכל)</option>
            {GENDER_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
          </select>
          <select className="input" value={filterMarital} onChange={(e) => setFilterMarital(e.target.value)}>
            <option value="all">מצב משפחתי (הכל)</option>
            {MARITAL_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
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
                <div
                  key={u._id}
                  className="flex items-center gap-3 p-4 hover:bg-ink-50/40 cursor-pointer"
                  onClick={() => { setActionUser(u); setActionType('view'); }}
                >
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div
                      className="h-10 w-10 rounded-full text-white flex items-center justify-center font-bold shrink-0"
                      style={{ backgroundColor: getUserColor(u._id) }}
                    >
                      {(u.profile?.firstName?.[0] || u.email[0] || '?').toUpperCase()}
                    </div>
                  )}
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
                    <div className="text-xs text-ink-500 mt-0.5 truncate" dir="ltr">
                      {u.email}{u.profile?.phone ? ` · ${u.profile.phone}` : ''}
                    </div>
                    <div className="text-xs text-ink-400 mt-0.5">
                      {u.organization?.name || '—'} · {u.profile?.gedud || 'ללא גדוד'} · נוצר {timeAgo(u.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
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
      </>}

      <AnimatePresence>
        {actionUser && actionType === 'view' && (
          <UserProfileModal user={actionUser} onClose={() => { setActionUser(null); setActionType(null); }} />
        )}
        {actionUser && actionType === 'message' && (
          <SendMessageModal user={actionUser} onClose={() => { setActionUser(null); setActionType(null); }} />
        )}
        {actionUser && actionType === 'reset' && (
          <ResetPasswordModal user={actionUser} onClose={() => { setActionUser(null); setActionType(null); }} />
        )}
      </AnimatePresence>
    </div>
  );
}

function ModalFrame({ title, onClose, children, wide }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
        className={`card w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto`}
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

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="rounded-xl bg-canvas border border-ink-100 p-3">
      <div className="flex items-center gap-1.5 text-xs text-ink-400 mb-1">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-sm font-semibold text-ink">{value}</div>
    </div>
  );
}

const STUDENT_HE = { bachelors: 'תואר ראשון', masters: 'תואר שני', doctorate: 'דוקטורט', other: 'אחר' };

function calcAge(dob) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

function UserProfileModal({ user: initialUser, onClose }) {
  const [user, setUser] = useState(initialUser);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.get(`/users/${initialUser._id}`)
      .then(({ data }) => { setUser(data.user); setStats(data.stats); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [initialUser._id]);

  const p = user.profile || {};
  const name = [p.firstName, p.lastName].filter(Boolean).join(' ') || '—';
  const age = calcAge(p.dateOfBirth);

  return (
    <ModalFrame title="פרופיל משתמש" onClose={onClose} wide>
      {loading ? (
        <div className="py-8 text-center text-ink-400">טוען…</div>
      ) : (
        <div className="space-y-5">
          {/* Hero: avatar + name + badges */}
          <div className="flex items-start gap-3 pb-4 border-b border-ink-100">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-16 w-16 rounded-2xl object-cover shrink-0 shadow-sm" />
            ) : (
              <div
                className="h-16 w-16 rounded-2xl text-white flex items-center justify-center text-2xl font-bold shrink-0 shadow-sm"
                style={{ backgroundColor: getUserColor(user._id) }}
              >
                {(p.firstName?.[0] || user.email[0] || '?').toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-lg font-bold text-ink leading-tight">{name}</div>
                  {age && <div className="text-sm text-ink-400">בן/בת {age}</div>}
                  <div className="text-xs text-ink-400 mt-0.5 truncate" dir="ltr">{user.email}</div>
                </div>
                {stats && (
                  <div className="flex gap-2 shrink-0">
                    <div className="rounded-xl bg-ink-50 px-2.5 py-1.5 text-center min-w-[44px]">
                      <div className="text-base font-bold text-ink">{stats.postCount}</div>
                      <div className="text-[10px] text-ink-400">פוסטים</div>
                    </div>
                    <div className="rounded-xl bg-ink-50 px-2.5 py-1.5 text-center min-w-[44px]">
                      <div className="text-base font-bold text-ink">{stats.jobCount}</div>
                      <div className="text-[10px] text-ink-400">משרות</div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                {user.isEmailVerified
                  ? <span className="chip text-xs text-olive-700 bg-olive-50">מאומת</span>
                  : <span className="chip text-xs text-ink-400 bg-ink-50">לא מאומת</span>}
                {user.role === 'admin' && <span className="chip text-xs text-accent-700 bg-accent-50">מנהל</span>}
                {user.organization?.name && (
                  <span className="chip text-xs text-ink-600 bg-ink-50">{user.organization.name}</span>
                )}
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-2">יצירת קשר ומיקום</h4>
            <div className="grid grid-cols-2 gap-2">
              <InfoRow icon={Phone} label="טלפון" value={p.phone} />
              <InfoRow icon={MapPin} label="עיר" value={p.address?.city} />
              <InfoRow icon={MapPin} label="רחוב" value={p.address?.street} />
              <InfoRow icon={Calendar} label="תאריך לידה" value={p.dateOfBirth ? `${formatDate(p.dateOfBirth)}${age ? ` (גיל ${age})` : ''}` : null} />
            </div>
          </div>

          {/* Personal */}
          <div>
            <h4 className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-2">פרטים אישיים</h4>
            <div className="grid grid-cols-2 gap-2">
              <InfoRow icon={Users} label="גדוד" value={p.gedud} />
              <InfoRow icon={ShieldCheck} label="מגדר" value={GENDER_HE[p.gender]} />
              <InfoRow icon={Heart} label="מצב משפחתי" value={MARITAL_HE[p.maritalStatus]} />
              <InfoRow icon={Briefcase} label="תעסוקה" value={EMPLOY_HE[p.employmentStatus]} />
              {p.studentLevel && (
                <InfoRow icon={GraduationCap} label="תואר אקדמי" value={STUDENT_HE[p.studentLevel]} />
              )}
            </div>
          </div>

          {/* Children */}
          {p.children?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Baby className="h-3.5 w-3.5" />
                ילדים ({p.children.length})
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {p.children.map((c, i) => {
                  const childAge = calcAge(c.dateOfBirth);
                  return (
                    <div key={i} className="rounded-xl bg-canvas border border-ink-100 p-3 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-muted-100 text-muted-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {childAge ?? '?'}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-ink">{c.name}</div>
                        <div className="text-xs text-ink-400">{formatDate(c.dateOfBirth)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-ink-400 border-t border-ink-100 pt-3 flex-wrap gap-2">
            <span>נרשם {timeAgo(user.createdAt)}</span>
            {user.cvUrl && (
              <a href={user.cvUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline font-semibold">
                צפייה בקורות חיים ↗
              </a>
            )}
          </div>
        </div>
      )}
    </ModalFrame>
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
      const payload = mode === 'manual' ? { newPassword, sendEmail } : { sendEmail };
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
            <input type="text" dir="ltr" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} required />
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
