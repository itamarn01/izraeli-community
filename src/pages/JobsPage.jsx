import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, Briefcase, Building2, Send, EyeOff, Plus, X, Upload, ImagePlus,
  Globe, Facebook, Instagram, Phone, Pencil, Trash2, Users, FileText, ChevronDown,
} from 'lucide-react';
import api from '../api/client';
import { SkeletonList } from '../components/skeletons/Skeletons.jsx';
import { JOB_TYPE_LABELS, timeAgo } from '../utils/format.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useImageUpload } from '../hooks/useImageUpload.js';

const IMAGE_MAX_MB = 5;
const PAGE_SIZE = 10;

export default function JobsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('job');

  const [jobs, setJobs] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [myFilter, setMyFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [showApply, setShowApply] = useState(null);
  const [editJob, setEditJob] = useState(null);
  const sentinelRef = useRef(null);
  const jobRefs = useRef({});

  const fetchPage = async (p, replace = false, filters = { q, type, myFilter }) => {
    try {
      const params = new URLSearchParams({ page: p, limit: PAGE_SIZE });
      if (filters.type !== 'all') params.set('type', filters.type);
      if (filters.myFilter === 'mine') params.set('mine', 'true');
      if (filters.myFilter === 'applied') params.set('applied', 'true');
      const { data } = await api.get(`/jobs?${params}`);
      setJobs((prev) => replace ? data.jobs : [...prev, ...data.jobs]);
      setHasMore(data.hasMore);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setLoading(true);
    setJobs([]);
    fetchPage(1, true, { q, type, myFilter });
  }, [type, myFilter]);

  // Scroll to highlighted job
  useEffect(() => {
    if (!highlightId || loading) return;
    const el = jobRefs.current[highlightId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setSearchParams({}, { replace: true });
    }
  }, [highlightId, jobs, loading]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          const next = page + 1;
          setPage(next);
          setLoadingMore(true);
          fetchPage(next, false, { q, type, myFilter });
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, q, type, myFilter]);

  const filtered = useMemo(
    () => q
      ? jobs.filter((j) => `${j.title} ${j.company} ${j.description}`.toLowerCase().includes(q.toLowerCase()))
      : jobs,
    [jobs, q]
  );

  const deleteJob = async (jobId) => {
    if (!confirm('למחוק את המשרה? פעולה זו אינה הפיכה.')) return;
    try {
      await api.delete(`/jobs/${jobId}`);
      setJobs((prev) => prev.filter((j) => j._id !== jobId));
      toast.success('המשרה נמחקה');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה במחיקה');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-ink">לוח דרושים</h1>
          <p className="text-sm text-ink-400 mt-1">משרות מחברי הקהילה — עם אפשרות הגשה אנונימית</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          פרסום משרה
        </button>
      </header>

      <div className="card p-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input className="input pr-10" placeholder="חיפוש משרה…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select value={type} onChange={(e) => setType(e.target.value)} className="input sm:max-w-xs">
            <option value="all">כל סוגי המשרות</option>
            {Object.entries(JOB_TYPE_LABELS).map(([v, label]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          {[
            { v: 'all', label: 'כל המשרות' },
            { v: 'mine', label: 'המשרות שלי' },
            { v: 'applied', label: 'הגשות שלי' },
          ].map(({ v, label }) => (
            <button
              key={v}
              onClick={() => setMyFilter(v)}
              className={`rounded-xl px-3.5 py-1.5 text-sm font-medium transition ${
                myFilter === v ? 'bg-accent text-white' : 'bg-ink-50 text-ink-500 hover:bg-ink-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <SkeletonList count={4} />
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-ink-400">אין משרות תואמות כרגע.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((j) => (
            <div key={j._id} ref={(el) => { if (el) jobRefs.current[j._id] = el; }}>
              <JobCard
                job={j}
                highlight={j._id === highlightId}
                onApply={() => setShowApply(j)}
                onEdit={() => setEditJob(j)}
                onDelete={() => deleteJob(j._id)}
                currentUserId={user._id}
              />
            </div>
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />
      {loadingMore && <SkeletonList count={2} />}
      {!hasMore && jobs.length > 0 && (
        <p className="text-center text-sm text-ink-300 pb-4">אין עוד משרות</p>
      )}

      <AnimatePresence>
        {showForm && (
          <Modal title="פרסום משרה חדשה" onClose={() => setShowForm(false)}>
            <JobForm onDone={(newJob) => { setShowForm(false); if (newJob) setJobs((p) => [newJob, ...p]); }} />
          </Modal>
        )}
        {editJob && (
          <Modal title="עריכת משרה" onClose={() => setEditJob(null)}>
            <JobForm
              initial={editJob}
              onDone={(updated) => {
                setEditJob(null);
                if (updated) setJobs((prev) => prev.map((j) => j._id === updated._id ? updated : j));
              }}
            />
          </Modal>
        )}
        {showApply && (
          <Modal title={`הגשת מועמדות — ${showApply.title}`} onClose={() => setShowApply(null)}>
            <ApplyForm job={showApply} onDone={() => setShowApply(null)} />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function JobCard({ job, onApply, onEdit, onDelete, currentUserId, highlight }) {
  const ownerId = job.postedBy?._id ?? job.postedBy;
  const isOwner = String(ownerId) === String(currentUserId);
  const hasSocial = job.socialMedia && Object.values(job.socialMedia).some(Boolean);
  const [showApps, setShowApps] = useState(false);
  const [apps, setApps] = useState(null);
  const [appsLoading, setAppsLoading] = useState(false);

  const loadApplications = async () => {
    if (apps !== null) { setShowApps((s) => !s); return; }
    setAppsLoading(true);
    try {
      const { data } = await api.get(`/jobs/${job._id}/applications`);
      setApps(data.applications);
      setShowApps(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה בטעינת המועמדויות');
    } finally {
      setAppsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card overflow-hidden hover:shadow-soft transition ${highlight ? 'ring-2 ring-accent' : ''}`}
    >
      {job.imageUrl && (
        <div className="h-40 overflow-hidden">
          <img src={job.imageUrl} alt={job.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-ink-400">
              <Building2 className="h-3.5 w-3.5" />
              <span className="font-semibold text-muted-700">{job.company}</span>
              <span>·</span>
              <span>{timeAgo(job.createdAt)}</span>
            </div>
            <h3 className="mt-1 text-lg font-bold text-ink">{job.title}</h3>
            <p className="mt-1.5 text-sm text-ink-500 line-clamp-2">{job.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="chip"><Briefcase className="h-3 w-3" />{JOB_TYPE_LABELS[job.type] || job.type}</span>
              {job.location && <span className="chip"><MapPin className="h-3 w-3" />{job.location}</span>}
              {job.salaryRange && <span className="chip-accent">{job.salaryRange}</span>}
            </div>
            {(job.website || hasSocial) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {job.website && (
                  <a href={job.website} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="chip hover:bg-ink-100 transition">
                    <Globe className="h-3 w-3" />אתר
                  </a>
                )}
                {job.socialMedia?.facebook && (
                  <a href={job.socialMedia.facebook} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="chip hover:bg-ink-100 transition">
                    <Facebook className="h-3 w-3 text-blue-500" />פייסבוק
                  </a>
                )}
                {job.socialMedia?.instagram && (
                  <a href={job.socialMedia.instagram} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="chip hover:bg-ink-100 transition">
                    <Instagram className="h-3 w-3 text-pink-500" />אינסטגרם
                  </a>
                )}
                {job.socialMedia?.whatsapp && (
                  <a href={`https://wa.me/${job.socialMedia.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="chip hover:bg-ink-100 transition">
                    <Phone className="h-3 w-3 text-green-500" />וואטסאפ
                  </a>
                )}
                {job.socialMedia?.tiktok && (
                  <a href={job.socialMedia.tiktok} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="chip hover:bg-ink-100 transition">
                    <Globe className="h-3 w-3" />טיקטוק
                  </a>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 items-end">
            {!isOwner ? (
              <button onClick={onApply} className="btn-primary">
                <Send className="h-3.5 w-3.5" />
                הגשת מועמדות
              </button>
            ) : (
              <div className="flex flex-col gap-1.5 items-end">
                <span className="chip">המשרה שלי</span>
                <div className="flex gap-1.5">
                  <button onClick={onEdit} className="btn-outline !py-1.5 !px-2.5 text-xs">
                    <Pencil className="h-3.5 w-3.5" />
                    עריכה
                  </button>
                  <button onClick={onDelete} className="rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition !py-1.5 !px-2.5 text-xs flex items-center gap-1">
                    <Trash2 className="h-3.5 w-3.5" />
                    מחיקה
                  </button>
                </div>
                <button
                  onClick={loadApplications}
                  disabled={appsLoading}
                  className="btn-outline !py-1.5 !px-2.5 text-xs"
                >
                  <Users className="h-3.5 w-3.5" />
                  {appsLoading ? 'טוען…' : `מועמדויות`}
                  {apps !== null && <span className="font-bold">({apps.length})</span>}
                  <ChevronDown className={`h-3 w-3 transition-transform ${showApps ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Applications panel */}
        <AnimatePresence>
          {showApps && apps && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-ink-100">
                <h4 className="text-sm font-bold text-ink mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent" />
                  מועמדים ({apps.length})
                </h4>
                {apps.length === 0 ? (
                  <p className="text-sm text-ink-400">טרם הוגשו מועמדויות.</p>
                ) : (
                  <div className="space-y-3">
                    {apps.map((app) => {
                      const name = app.isAnonymous
                        ? 'מועמד אנונימי'
                        : [app.user?.profile?.firstName, app.user?.profile?.lastName].filter(Boolean).join(' ') || app.user?.email || '—';
                      return (
                        <div key={app._id} className="rounded-xl border border-ink-100 bg-canvas p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-muted-100 text-muted-700 flex items-center justify-center text-xs font-bold">
                                {name[0] || '?'}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-ink">{name}</div>
                                {!app.isAnonymous && app.user?.email && (
                                  <div className="text-xs text-ink-400" dir="ltr">{app.user.email}</div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {app.cvUrl && (
                                <a
                                  href={app.cvUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="chip hover:bg-ink-100 transition text-xs"
                                >
                                  <FileText className="h-3 w-3" />
                                  קו"ח
                                </a>
                              )}
                              <span className="text-xs text-ink-400">{timeAgo(app.createdAt)}</span>
                            </div>
                          </div>
                          {app.message && (
                            <p className="text-sm text-ink-600 bg-ink-50 rounded-lg p-2 leading-relaxed">{app.message}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function JobForm({ initial, onDone }) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    title: initial?.title || '',
    company: initial?.company || '',
    location: initial?.location || '',
    type: initial?.type || 'full_time',
    description: initial?.description || '',
    salaryRange: initial?.salaryRange || '',
    contactEmail: initial?.contactEmail || '',
    website: initial?.website || '',
    socialMedia: {
      facebook: initial?.socialMedia?.facebook || '',
      instagram: initial?.socialMedia?.instagram || '',
      whatsapp: initial?.socialMedia?.whatsapp || '',
      tiktok: initial?.socialMedia?.tiktok || '',
    },
  });
  const [loading, setLoading] = useState(false);
  const { upload, uploading, preview, clear } = useImageUpload(initial?.imageUrl);
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || '');

  const handleImagePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await upload(file);
    if (url) setImageUrl(url);
    e.target.value = '';
  };

  const setSocial = (k, v) => setForm((f) => ({ ...f, socialMedia: { ...f.socialMedia, [k]: v } }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, imageUrl };
      const { data } = isEdit
        ? await api.patch(`/jobs/${initial._id}`, payload)
        : await api.post('/jobs', payload);
      toast.success(isEdit ? 'המשרה עודכנה' : 'המשרה פורסמה');
      onDone(isEdit ? data.job : data.job);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="label">תמונה (אופציונלי, עד {IMAGE_MAX_MB}MB)</label>
        <label className={`flex items-center gap-3 rounded-xl border border-dashed border-ink-200 p-3 cursor-pointer hover:bg-ink-50 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <ImagePlus className="h-5 w-5 text-ink-400 shrink-0" />
          <span className="text-sm text-ink-500 flex-1">
            {uploading ? 'מעלה תמונה…' : preview || imageUrl ? 'תמונה נבחרה — לחצו להחלפה' : 'בחירת תמונה'}
          </span>
          {(preview || imageUrl) && <img src={preview || imageUrl} alt="" className="h-12 w-16 object-cover rounded-lg" />}
          <input type="file" accept="image/*" className="hidden" onChange={handleImagePick} disabled={uploading} />
        </label>
        {imageUrl && (
          <button type="button" onClick={() => { setImageUrl(''); clear(); }} className="mt-1 text-xs text-accent hover:underline">
            הסרת תמונה
          </button>
        )}
      </div>
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
        <label className="label">היקף משרה</label>
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
          <input className="input" value={form.salaryRange} onChange={(e) => setForm({ ...form, salaryRange: e.target.value })} placeholder="₪14,000–₪18,000" />
        </div>
        <div>
          <label className="label">מייל לפניות</label>
          <input dir="ltr" className="input" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="label">אתר החברה (אופציונלי)</label>
        <div className="relative">
          <Globe className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input dir="ltr" className="input pr-9" placeholder="https://..." value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="label">רשתות חברתיות (אופציונלי)</label>
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <Facebook className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
            <input dir="ltr" className="input pr-9" placeholder="פייסבוק" value={form.socialMedia.facebook} onChange={(e) => setSocial('facebook', e.target.value)} />
          </div>
          <div className="relative">
            <Instagram className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-pink-500" />
            <input dir="ltr" className="input pr-9" placeholder="אינסטגרם" value={form.socialMedia.instagram} onChange={(e) => setSocial('instagram', e.target.value)} />
          </div>
          <div className="relative">
            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
            <input dir="ltr" className="input pr-9" placeholder="וואטסאפ (מספר)" value={form.socialMedia.whatsapp} onChange={(e) => setSocial('whatsapp', e.target.value)} />
          </div>
          <div className="relative">
            <Globe className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input dir="ltr" className="input pr-9" placeholder="טיקטוק" value={form.socialMedia.tiktok} onChange={(e) => setSocial('tiktok', e.target.value)} />
          </div>
        </div>
      </div>
      <button type="submit" className="btn-primary w-full" disabled={loading || uploading}>
        {loading ? 'שומר…' : isEdit ? 'שמירת שינויים' : 'פרסום משרה'}
      </button>
    </form>
  );
}

function ApplyForm({ job, onDone }) {
  const { user } = useAuth();
  const [isAnonymous, setAnon] = useState(false);
  const [message, setMessage] = useState('');
  const [cvFile, setCvFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (cvFile) {
        const fd = new FormData();
        fd.append('cv', cvFile);
        await api.post('/users/me/cv', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      await api.post(`/jobs/${job._id}/apply`, { isAnonymous, message });
      toast.success('המועמדות נשלחה בהצלחה');
      onDone();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה בהגשת המועמדות');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="flex items-start gap-3 rounded-xl border border-ink-200 p-3 cursor-pointer hover:bg-ink-50">
        <input type="checkbox" checked={isAnonymous} onChange={(e) => setAnon(e.target.checked)} className="mt-1" />
        <div>
          <div className="font-semibold text-ink flex items-center gap-1.5">
            <EyeOff className="h-4 w-4 text-accent" />
            הגשה אנונימית
          </div>
          <div className="text-xs text-ink-500 mt-0.5">
            פרטיך האישיים יוסתרו מהמעסיק. רק קורות החיים והמסר יישלחו.
          </div>
        </div>
      </label>

      <div>
        <label className="label">קורות חיים (PDF, עד 5MB)</label>
        <label className="flex items-center gap-3 rounded-xl border border-dashed border-ink-200 p-4 cursor-pointer hover:bg-ink-50">
          <Upload className="h-5 w-5 text-ink-400" />
          <span className="text-sm text-ink-500">
            {cvFile ? cvFile.name : user?.cvUrl ? 'יש קובץ קיים — לחצו להחלפה' : 'בחירת קובץ PDF'}
          </span>
          <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setCvFile(e.target.files?.[0] || null)} />
        </label>
      </div>

      <div>
        <label className="label">הודעה למעסיק</label>
        <textarea rows={4} className="input" value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? 'שולח…' : 'שליחת מועמדות'}
      </button>
    </form>
  );
}

function Modal({ title, onClose, children }) {
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
        className="card w-full max-w-lg max-h-[90vh] overflow-y-auto"
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
