import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Trash2, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, Phone, Globe,
  User2, Pencil, X, Gift, Percent, Tag, Calendar, ExternalLink,
} from 'lucide-react';
import adminApi from '../../api/adminClient.js';
import { timeAgo, formatDate } from '../../utils/format.js';
import BenefitFormFields, { emptyBenefitForm, benefitFormPayload, GEDUD_IMAGES } from '../../components/benefits/BenefitFormFields.jsx';

const STATUS_LABELS = { pending: 'ממתינה', approved: 'פורסמה', rejected: 'נדחתה' };
const STATUS_CLASSES = {
  pending: 'bg-yellow-50 text-yellow-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
};

const PAGE_SIZE = 25;

export default function AdminBenefitSuggestionsPage() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const fetchSuggestions = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: PAGE_SIZE });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const { data } = await adminApi.get(`/benefit-suggestions?${params}`);
      setSuggestions(data.suggestions);
      setHasMore(data.hasMore);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchSuggestions(1);
  }, [statusFilter]);

  const goPage = (p) => { setPage(p); fetchSuggestions(p); };

  const replace = (s) => setSuggestions((prev) => prev.map((x) => (x._id === s._id ? s : x)));

  const updateStatus = async (id, status) => {
    if (status === 'approved' && !confirm('לאשר ולפרסם את ההטבה? היא תופיע מיד בעמוד ההטבות לכל חברי הקהילה.')) return;
    if (status === 'rejected' && !confirm('לדחות את ההצעה? אם היא כבר פורסמה — היא תוסתר מעמוד ההטבות.')) return;
    setBusyId(id);
    try {
      const { data } = await adminApi.patch(`/benefit-suggestions/${id}/status`, { status });
      replace(data.suggestion);
      toast.success(status === 'approved' ? 'ההטבה אושרה ופורסמה' : `ההצעה ${STATUS_LABELS[status]}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id) => {
    if (!confirm('למחוק את ההצעה? הטבה שכבר פורסמה תישאר בעמוד ההטבות וניתן לנהל אותה משם.')) return;
    try {
      await adminApi.delete(`/benefit-suggestions/${id}`);
      setSuggestions((prev) => prev.filter((s) => s._id !== id));
      setTotal((t) => t - 1);
      toast.success('ההצעה נמחקה');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-ink">הצעות הטבות</h1>
          <p className="text-sm text-ink-400 mt-1">
            {total} הצעות סה"כ · אישור מפרסם את ההטבה מיד בעמוד ההטבות
          </p>
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                statusFilter === s ? 'bg-accent text-white' : 'bg-ink-50 text-ink-500 hover:bg-ink-100'
              }`}
            >
              {s === 'all' ? 'הכל' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="card p-10 text-center text-ink-400">טוען…</div>
      ) : suggestions.length === 0 ? (
        <div className="card p-10 text-center text-ink-400">לא נמצאו הצעות</div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((s) => (
            <SuggestionCard
              key={s._id}
              suggestion={s}
              busy={busyId === s._id}
              onEdit={() => setEditing(s)}
              onStatus={(status) => updateStatus(s._id, status)}
              onRemove={() => remove(s._id)}
            />
          ))}
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
          <SuggestionEditModal
            suggestion={editing}
            onClose={() => setEditing(null)}
            onSaved={(s) => { replace(s); setEditing(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function discountLabel(s) {
  if (s.discountType === 'percentage' && s.discountPercent) return `${s.discountPercent}% הנחה`;
  if (s.discountType === 'price_comparison' && s.discountedPrice != null) {
    return `₪${s.originalPrice ?? '?'} ← ₪${s.discountedPrice}`;
  }
  if (s.discountType === 'gift_with_purchase') return 'מתנה בקנייה';
  return null;
}

function SuggestionCard({ suggestion: s, busy, onEdit, onStatus, onRemove }) {
  const submitter =
    [s.submittedBy?.profile?.firstName, s.submittedBy?.profile?.lastName].filter(Boolean).join(' ') ||
    s.submittedBy?.email || '—';
  const discount = discountLabel(s);

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-start gap-4">
        <div className="h-20 w-28 shrink-0 rounded-xl overflow-hidden bg-ink-50 border border-ink-100 flex items-center justify-center">
          {s.imageUrl ? (
            <img src={s.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <Gift className="h-7 w-7 text-ink-300" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-ink text-base">{s.businessName}</h3>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_CLASSES[s.status]}`}>
              {STATUS_LABELS[s.status]}
            </span>
            {discount && <span className="chip-accent text-xs">{discount}</span>}
          </div>
          <p className="text-sm font-semibold text-ink-600 mt-1">{s.title}</p>
          <p className="text-sm text-ink-600 mt-1 leading-relaxed">{s.description}</p>

          <div className="mt-2 flex flex-wrap gap-2 text-xs text-ink-500">
            {s.category && <span className="chip"><Tag className="h-3.5 w-3.5" />{s.category}</span>}
            {s.validUntil && <span className="chip"><Calendar className="h-3.5 w-3.5" />עד {formatDate(s.validUntil)}</span>}
            {s.gedud && (
              <span className="chip">
                {GEDUD_IMAGES[s.gedud] && <img src={GEDUD_IMAGES[s.gedud]} alt="" className="h-3.5 w-3.5 object-contain" />}
                {s.gedud}
              </span>
            )}
            {s.redemptionCode && <span className="chip"><Percent className="h-3.5 w-3.5" />קוד: {s.redemptionCode}</span>}
          </div>

          {(s.whatYouGet || s.howToRedeem) && (
            <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {s.whatYouGet && (
                <div className="rounded-lg bg-ink-50 p-2.5">
                  <dt className="text-ink-400 mb-0.5">מה מקבלים</dt>
                  <dd className="text-ink-600 leading-relaxed">{s.whatYouGet}</dd>
                </div>
              )}
              {s.howToRedeem && (
                <div className="rounded-lg bg-ink-50 p-2.5">
                  <dt className="text-ink-400 mb-0.5">איך ממשים</dt>
                  <dd className="text-ink-600 leading-relaxed">{s.howToRedeem}</dd>
                </div>
              )}
            </dl>
          )}
        </div>

        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            onClick={onEdit}
            title="עריכת פרטי ההטבה"
            className="h-8 w-8 rounded-lg bg-ink-50 hover:bg-ink-100 text-ink-600 flex items-center justify-center"
          >
            <Pencil className="h-4 w-4" />
          </button>
          {s.status !== 'approved' && (
            <button
              onClick={() => onStatus('approved')}
              disabled={busy}
              title="אישור ופרסום"
              className="h-8 w-8 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 flex items-center justify-center disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
          )}
          {s.status !== 'rejected' && (
            <button
              onClick={() => onStatus('rejected')}
              disabled={busy}
              title="דחייה"
              className="h-8 w-8 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 flex items-center justify-center disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
          {s.status !== 'pending' && (
            <button
              onClick={() => onStatus('pending')}
              disabled={busy}
              title="החזרה להמתנה"
              className="h-8 w-8 rounded-lg bg-yellow-50 hover:bg-yellow-100 text-yellow-600 flex items-center justify-center disabled:opacity-50"
            >
              <Clock className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onRemove}
            title="מחיקה"
            className="h-8 w-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {s.status === 'approved' && s.publishedBenefit && (
        <p className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          ההטבה מפורסמת. ניתן לערוך אותה גם ממסך ההטבות.
        </p>
      )}

      <div className="flex flex-wrap gap-3 text-xs text-ink-500 border-t border-ink-100 pt-3">
        <span className="inline-flex items-center gap-1">
          <User2 className="h-3.5 w-3.5" />
          {submitter}
          {s.submittedBy?.email && <span dir="ltr" className="text-ink-300">({s.submittedBy.email})</span>}
        </span>
        {s.contactName && <span className="inline-flex items-center gap-1"><User2 className="h-3.5 w-3.5" />איש קשר: {s.contactName}</span>}
        {s.contactPhone && <span className="inline-flex items-center gap-1" dir="ltr"><Phone className="h-3.5 w-3.5" />{s.contactPhone}</span>}
        {s.website && (
          <a href={s.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline">
            <Globe className="h-3.5 w-3.5" />{s.website}
          </a>
        )}
        <span className="mr-auto text-ink-300">{timeAgo(s.createdAt)}</span>
      </div>
    </div>
  );
}

function SuggestionEditModal({ suggestion, onClose, onSaved }) {
  const [form, setForm] = useState(() => emptyBenefitForm(suggestion));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // The admin panel has its own token, so the shared member upload hook does
  // not apply here.
  const upload = async (file) => {
    if (!file.type.startsWith('image/')) { toast.error('יש להעלות תמונה'); return null; }
    if (file.size > 5 * 1024 * 1024) { toast.error('גודל מקסימלי 5MB'); return null; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await adminApi.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      return data.url;
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה בהעלאה');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await adminApi.patch(`/benefit-suggestions/${suggestion._id}`, benefitFormPayload(form));
      toast.success(suggestion.publishedBenefit ? 'הפרטים עודכנו — גם בהטבה המפורסמת' : 'הפרטים עודכנו');
      onSaved(data.suggestion);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50"
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        role="dialog"
        aria-modal="true"
        className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-ink-100 px-5 py-3 flex items-center justify-between z-10">
          <div className="min-w-0">
            <h3 className="font-bold text-ink truncate">עריכת ההטבה המוצעת</h3>
            <p className="text-xs text-ink-400">הוגש על ידי {suggestion.submittedBy?.email || '—'}</p>
          </div>
          <button onClick={onClose} aria-label="סגירה" className="h-8 w-8 rounded-lg hover:bg-ink-50 flex items-center justify-center text-ink-500">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {suggestion.publishedBenefit && (
            <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              ההטבה כבר מפורסמת — שמירה כאן תעדכן גם אותה.
            </p>
          )}

          <BenefitFormFields form={form} onChange={set} onUpload={upload} uploading={uploading} />

          <button type="submit" className="btn-primary w-full" disabled={saving || uploading}>
            {saving ? 'שומר…' : 'שמירת שינויים'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
