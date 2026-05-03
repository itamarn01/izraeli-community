import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Search, Briefcase, Building2, MapPin, Eye, EyeOff, Trash2, Pencil, X,
  ChevronLeft, ChevronRight, Filter, User2,
} from 'lucide-react';
import adminApi from '../../api/adminClient.js';
import { JOB_TYPE_LABELS, timeAgo } from '../../utils/format.js';

const PAGE_SIZE = 25;

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [type, setType] = useState('all');
  const [hidden, setHidden] = useState('all');
  const [editing, setEditing] = useState(null);

  const fetchJobs = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: PAGE_SIZE });
      if (q) params.set('q', q);
      if (userQuery) params.set('userQuery', userQuery);
      if (type !== 'all') params.set('type', type);
      if (hidden !== 'all') params.set('isHidden', hidden);
      const { data } = await adminApi.get(`/jobs?${params}`);
      setJobs(data.jobs);
      setHasMore(data.hasMore);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchJobs(1); }, 300);
    return () => clearTimeout(t);
  }, [q, userQuery, type, hidden]);

  const goPage = (p) => { setPage(p); fetchJobs(p); };

  const remove = async (job) => {
    if (!confirm(`למחוק את המשרה "${job.title}"? פעולה זו אינה הפיכה.`)) return;
    try {
      await adminApi.delete(`/jobs/${job._id}`);
      setJobs((prev) => prev.filter((j) => j._id !== job._id));
      toast.success('המשרה נמחקה');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה');
    }
  };

  const toggleHide = async (job) => {
    try {
      const { data } = await adminApi.post(`/jobs/${job._id}/toggle-hide`);
      setJobs((prev) => prev.map((j) => (j._id === job._id ? { ...j, ...data.job } : j)));
      toast.success(data.job.isHidden ? 'המשרה הוסתרה' : 'המשרה הוצגה שוב');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה');
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-ink">ניהול דרושים</h1>
        <p className="text-sm text-ink-400 mt-1">{total} משרות סה"כ</p>
      </header>

      <div className="card p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input className="input pr-10" placeholder="חיפוש משרה…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="relative">
          <User2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input className="input pr-10" placeholder="סינון לפי יוזר: מייל / שם / טלפון" value={userQuery} onChange={(e) => setUserQuery(e.target.value)} />
        </div>
        <div className="relative">
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <select className="input pr-10" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">כל הסוגים</option>
            {Object.entries(JOB_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="relative">
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <select className="input pr-10" value={hidden} onChange={(e) => setHidden(e.target.value)}>
            <option value="all">סטטוס (הכל)</option>
            <option value="false">פעיל</option>
            <option value="true">מוסתר</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="card p-10 text-center text-ink-400">טוען…</div>
      ) : jobs.length === 0 ? (
        <div className="card p-10 text-center text-ink-400">לא נמצאו משרות</div>
      ) : (
        <div className="space-y-3">
          {jobs.map((j) => {
            const posterName = [j.postedBy?.profile?.firstName, j.postedBy?.profile?.lastName].filter(Boolean).join(' ') || j.postedBy?.email || '—';
            return (
              <div key={j._id} className={`card p-4 transition ${j.isHidden ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-ink-400 mb-1 flex-wrap">
                      <Building2 className="h-3.5 w-3.5" />
                      <span className="font-semibold text-muted-700">{j.company}</span>
                      <span>·</span>
                      <span>{timeAgo(j.createdAt)}</span>
                      {j.organization?.name && <span className="chip text-[10px]">{j.organization.name}</span>}
                      {j.isHidden && <span className="chip text-[10px] text-red-700 bg-red-50">מוסתר</span>}
                    </div>
                    <h3 className="font-bold text-ink">{j.title}</h3>
                    <p className="text-sm text-ink-500 mt-1 line-clamp-2">{j.description}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="chip"><Briefcase className="h-3 w-3" />{JOB_TYPE_LABELS[j.type] || j.type}</span>
                      {j.location && <span className="chip"><MapPin className="h-3 w-3" />{j.location}</span>}
                    </div>
                    <div className="mt-3 pt-3 border-t border-ink-100 text-xs text-ink-500">
                      <span className="font-semibold">פורסם על ידי:</span> {posterName}
                      {j.postedBy?.email && <span dir="ltr" className="text-ink-400 mr-2">{j.postedBy.email}</span>}
                      {j.postedBy?.profile?.phone && <span className="text-ink-400 mr-2" dir="ltr">{j.postedBy.profile.phone}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => toggleHide(j)} title={j.isHidden ? 'הצגה' : 'הסתרה'} className="h-8 w-8 rounded-lg bg-ink-50 hover:bg-ink-100 text-ink-500 flex items-center justify-center">
                      {j.isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button onClick={() => setEditing(j)} title="עריכה" className="h-8 w-8 rounded-lg bg-ink-50 hover:bg-ink-100 text-ink-500 flex items-center justify-center">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => remove(j)} title="מחיקה" className="h-8 w-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
        {editing && (
          <EditJobModal
            job={editing}
            onClose={() => setEditing(null)}
            onSaved={(updated) => {
              setJobs((prev) => prev.map((j) => (j._id === updated._id ? { ...j, ...updated } : j)));
              setEditing(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EditJobModal({ job, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: job.title || '',
    company: job.company || '',
    location: job.location || '',
    type: job.type || 'full_time',
    description: job.description || '',
    salaryRange: job.salaryRange || '',
    contactEmail: job.contactEmail || '',
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await adminApi.patch(`/jobs/${job._id}`, form);
      toast.success('המשרה עודכנה');
      onSaved(data.job);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
        className="card w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-ink-100 px-5 py-3 flex items-center justify-between">
          <h3 className="font-bold text-ink">עריכת משרה</h3>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-ink-50 flex items-center justify-center text-ink-500">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3">
          <div>
            <label className="label">תפקיד</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">חברה</label>
              <input className="input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required />
            </div>
            <div>
              <label className="label">מיקום</label>
              <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">סוג משרה</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {Object.entries(JOB_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="label">תיאור</label>
            <textarea rows={4} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">טווח שכר</label>
              <input className="input" value={form.salaryRange} onChange={(e) => setForm({ ...form, salaryRange: e.target.value })} />
            </div>
            <div>
              <label className="label">מייל לפניות</label>
              <input dir="ltr" className="input" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'שומר…' : 'שמירת שינויים'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
