import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, Briefcase, Building2, Send, EyeOff, Plus, X, Upload, ImagePlus,
  Globe, Facebook, Instagram, Phone,
} from 'lucide-react';
import api from '../api/client';
import { SkeletonList } from '../components/skeletons/Skeletons.jsx';
import { JOB_TYPE_LABELS, timeAgo } from '../utils/format.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useImageUpload } from '../hooks/useImageUpload.js';

const IMAGE_MAX_MB = 5;

export default function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [showApply, setShowApply] = useState(null);

  const fetchJobs = async () => {
    try {
      const { data } = await api.get('/jobs');
      setJobs(data.jobs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  const filtered = useMemo(
    () => jobs.filter((j) => {
      if (type !== 'all' && j.type !== type) return false;
      if (q && !`${j.title} ${j.company} ${j.description}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    }),
    [jobs, q, type]
  );

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

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
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

      {loading ? (
        <SkeletonList count={4} />
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-ink-400">אין משרות תואמות כרגע.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((j) => (
            <JobCard key={j._id} job={j} onApply={() => setShowApply(j)} currentUserId={user._id} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <Modal title="פרסום משרה חדשה" onClose={() => setShowForm(false)}>
            <NewJobForm onCreated={() => { setShowForm(false); fetchJobs(); }} />
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

function JobCard({ job, onApply, currentUserId }) {
  const isOwner = job.postedBy?._id === currentUserId;
  const hasSocial = job.socialMedia && Object.values(job.socialMedia).some(Boolean);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden hover:shadow-soft transition">
      {job.imageUrl && (
        <div className="h-40 overflow-hidden">
          <img src={job.imageUrl} alt={job.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-5 flex items-start justify-between gap-3 flex-wrap">
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
        <div>
          {!isOwner ? (
            <button onClick={onApply} className="btn-primary">
              <Send className="h-3.5 w-3.5" />
              הגשת מועמדות
            </button>
          ) : (
            <span className="chip">המשרה שלי</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function NewJobForm({ onCreated }) {
  const [form, setForm] = useState({
    title: '', company: '', location: '', type: 'full_time',
    description: '', salaryRange: '', contactEmail: '', website: '',
    socialMedia: { facebook: '', instagram: '', whatsapp: '', tiktok: '' },
  });
  const [loading, setLoading] = useState(false);
  const { upload, uploading, preview, clear } = useImageUpload();
  const [imageUrl, setImageUrl] = useState('');

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
      await api.post('/jobs', { ...form, imageUrl });
      toast.success('המשרה פורסמה');
      onCreated();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה ביצירת המשרה');
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
            {uploading ? 'מעלה תמונה…' : preview ? 'תמונה נבחרה — לחצו להחלפה' : 'בחירת תמונה'}
          </span>
          {preview && <img src={preview} alt="" className="h-12 w-16 object-cover rounded-lg" />}
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
        {loading ? 'שומר…' : 'פרסום משרה'}
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
        <div className="sticky top-0 bg-white border-b border-ink-100 px-5 py-3 flex items-center justify-between">
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
