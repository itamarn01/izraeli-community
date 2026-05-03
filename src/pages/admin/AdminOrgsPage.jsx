import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Search, Plus, Pencil, Trash2, Building2, X, Copy, Power } from 'lucide-react';
import adminApi from '../../api/adminClient.js';

export default function AdminOrgsPage() {
  const [orgs, setOrgs] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  const fetchOrgs = async (query = q) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      const { data } = await adminApi.get(`/organizations?${params}`);
      setOrgs(data.organizations);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrgs(); }, []);
  useEffect(() => {
    const t = setTimeout(() => fetchOrgs(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const remove = async (org) => {
    if (!confirm(`למחוק את הארגון "${org.name}"? פעולה זו אינה הפיכה.`)) return;
    try {
      await adminApi.delete(`/organizations/${org._id}`);
      toast.success('הארגון נמחק');
      setOrgs((prev) => prev.filter((o) => o._id !== org._id));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה במחיקה');
    }
  };

  const toggleActive = async (org) => {
    try {
      const { data } = await adminApi.patch(`/organizations/${org._id}`, { isActive: !org.isActive });
      setOrgs((prev) => prev.map((o) => (o._id === org._id ? { ...o, ...data.organization } : o)));
      toast.success(data.organization.isActive ? 'הארגון פעיל' : 'הארגון נוטרל');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה');
    }
  };

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code);
    toast.success('הקוד הועתק');
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-ink">ניהול ארגונים</h1>
          <p className="text-sm text-ink-400 mt-1">קודי ארגון לרישום משתמשים חדשים לקהילה</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          ארגון חדש
        </button>
      </header>

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input className="input pr-10" placeholder="חיפוש: שם / קוד…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="card p-10 text-center text-ink-400">טוען…</div>
      ) : orgs.length === 0 ? (
        <div className="card p-10 text-center text-ink-400">אין ארגונים</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {orgs.map((org) => (
            <div key={org._id} className={`card p-4 transition ${!org.isActive ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-4 w-4 text-accent" />
                    <h3 className="font-bold text-ink truncate">{org.name}</h3>
                  </div>
                  <button onClick={() => copyCode(org.code)} className="text-xs font-mono text-muted-700 bg-muted-50 hover:bg-muted-100 transition rounded-lg px-2 py-1 inline-flex items-center gap-1.5" dir="ltr">
                    {org.code}
                    <Copy className="h-3 w-3" />
                  </button>
                  {org.description && (
                    <p className="text-sm text-ink-500 mt-2 line-clamp-2">{org.description}</p>
                  )}
                </div>
                {!org.isActive && <span className="chip text-xs text-ink-400 bg-ink-50">לא פעיל</span>}
              </div>
              <div className="mt-3 pt-3 border-t border-ink-100 flex items-center justify-between text-xs text-ink-400">
                <span>{org.memberCount || 0} חברים</span>
                <div className="flex gap-1">
                  <button onClick={() => toggleActive(org)} title={org.isActive ? 'נטרול' : 'הפעלה'} className="h-7 w-7 rounded-lg bg-ink-50 hover:bg-ink-100 flex items-center justify-center">
                    <Power className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setEditing(org)} title="עריכה" className="h-7 w-7 rounded-lg bg-ink-50 hover:bg-ink-100 flex items-center justify-center">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => remove(org)} title="מחיקה" className="h-7 w-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {creating && (
          <OrgFormModal
            onClose={() => setCreating(false)}
            onSaved={(org) => { setCreating(false); setOrgs((prev) => [{ ...org, memberCount: 0 }, ...prev]); }}
          />
        )}
        {editing && (
          <OrgFormModal
            initial={editing}
            onClose={() => setEditing(null)}
            onSaved={(org) => { setEditing(null); setOrgs((prev) => prev.map((o) => (o._id === org._id ? { ...o, ...org } : o))); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function OrgFormModal({ initial, onClose, onSaved }) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    name: initial?.name || '',
    code: initial?.code || '',
    description: initial?.description || '',
    isActive: initial?.isActive ?? true,
    maxMembers: initial?.maxMembers || 0,
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, maxMembers: Number(form.maxMembers) || 0 };
      const { data } = isEdit
        ? await adminApi.patch(`/organizations/${initial._id}`, payload)
        : await adminApi.post('/organizations', payload);
      toast.success(isEdit ? 'הארגון עודכן' : 'הארגון נוצר');
      onSaved(data.organization);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה בשמירה');
    } finally {
      setLoading(false);
    }
  };

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
        className="card w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-ink-100 px-5 py-3 flex items-center justify-between">
          <h3 className="font-bold text-ink">{isEdit ? 'עריכת ארגון' : 'יצירת ארגון חדש'}</h3>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-ink-50 flex items-center justify-center text-ink-500">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="label">שם הארגון</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">קוד הצטרפות</label>
            <input
              dir="ltr"
              className="input font-mono uppercase tracking-wider"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              required
              minLength={3}
            />
            <p className="text-xs text-ink-400 mt-1">קוד שמשתמשים מזינים בעת ההצטרפות</p>
          </div>
          <div>
            <label className="label">תיאור (אופציונלי)</label>
            <textarea rows={3} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">מקסימום חברים (0 = ללא הגבלה)</label>
              <input type="number" min="0" className="input" value={form.maxMembers} onChange={(e) => setForm({ ...form, maxMembers: e.target.value })} />
            </div>
            <div>
              <label className="label">סטטוס</label>
              <label className="flex items-center gap-2 input cursor-pointer h-[42px]">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                <span className="text-sm">פעיל</span>
              </label>
            </div>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'שומר…' : isEdit ? 'שמירת שינויים' : 'יצירת ארגון'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
