import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Search, Plus, Pencil, Trash2, Eye, EyeOff, X, Gift, ImagePlus, Tag, Calendar,
  Percent, Facebook, Instagram, Phone, Globe, ChevronLeft, ChevronRight, Filter,
} from 'lucide-react';
import adminApi from '../../api/adminClient.js';
import { formatDate } from '../../utils/format.js';
import { useImageUpload } from '../../hooks/useImageUpload.js';

const CATEGORIES = ['כללי', 'מסעדות', 'בריאות', 'ספורט', 'בידור', 'קניות', 'חינוך', 'נסיעות', 'טכנולוגיה', 'אחר'];
const PAGE_SIZE = 25;

export default function AdminBenefitsPage() {
  const [benefits, setBenefits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const [hidden, setHidden] = useState('all');
  const [orgs, setOrgs] = useState([]);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  const fetchBenefits = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: PAGE_SIZE });
      if (q) params.set('q', q);
      if (category !== 'all') params.set('category', category);
      if (hidden !== 'all') params.set('isHidden', hidden);
      const { data } = await adminApi.get(`/benefits?${params}`);
      setBenefits(data.benefits);
      setHasMore(data.hasMore);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    adminApi.get('/organizations?limit=100').then(({ data }) => setOrgs(data.organizations));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchBenefits(1); }, 300);
    return () => clearTimeout(t);
  }, [q, category, hidden]);

  const goPage = (p) => { setPage(p); fetchBenefits(p); };

  const remove = async (b) => {
    if (!confirm(`למחוק את ההטבה "${b.title}"? פעולה זו אינה הפיכה.`)) return;
    try {
      await adminApi.delete(`/benefits/${b._id}`);
      setBenefits((prev) => prev.filter((x) => x._id !== b._id));
      toast.success('ההטבה נמחקה');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה');
    }
  };

  const toggleHide = async (b) => {
    try {
      const { data } = await adminApi.post(`/benefits/${b._id}/toggle-hide`);
      setBenefits((prev) => prev.map((x) => (x._id === b._id ? { ...x, ...data.benefit } : x)));
      toast.success(data.benefit.isHidden ? 'ההטבה הוסתרה' : 'ההטבה הוצגה');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-ink">ניהול הטבות</h1>
          <p className="text-sm text-ink-400 mt-1">{total} הטבות סה"כ</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          הטבה חדשה
        </button>
      </header>

      <div className="card p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input className="input pr-10" placeholder="חיפוש: כותרת / עסק…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="relative">
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <select className="input pr-10" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">קטגוריה (הכל)</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
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
      ) : benefits.length === 0 ? (
        <div className="card p-10 text-center text-ink-400">לא נמצאו הטבות</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {benefits.map((b) => (
            <div key={b._id} className={`card overflow-hidden transition ${b.isHidden ? 'opacity-60' : ''}`}>
              <div className="h-32 bg-gradient-to-bl from-muted-200 to-olive-100 relative flex items-center justify-center">
                {b.imageUrl ? (
                  <img src={b.imageUrl} alt={b.title} className="h-full w-full object-cover" />
                ) : (
                  <Gift className="h-10 w-10 text-white/70" />
                )}
                {b.isHidden && (
                  <span className="absolute top-2 right-2 chip text-[10px] text-red-700 bg-red-50">מוסתר</span>
                )}
              </div>
              <div className="p-4">
                {b.businessName && <div className="text-xs font-semibold text-muted-700 mb-1">{b.businessName}</div>}
                <h3 className="font-bold text-ink line-clamp-1">{b.title}</h3>
                <p className="text-sm text-ink-500 line-clamp-2 mt-1">{b.description}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-ink-400 flex-wrap">
                  <span className="chip"><Tag className="h-3 w-3" />{b.category || 'כללי'}</span>
                  {b.organization?.name && <span className="chip text-[10px]">{b.organization.name}</span>}
                  {b.validUntil && <span className="chip"><Calendar className="h-3 w-3" />{formatDate(b.validUntil)}</span>}
                </div>
                <div className="mt-3 pt-3 border-t border-ink-100 flex items-center justify-end gap-1">
                  <button onClick={() => toggleHide(b)} title={b.isHidden ? 'הצגה' : 'הסתרה'} className="h-7 w-7 rounded-lg bg-ink-50 hover:bg-ink-100 text-ink-500 flex items-center justify-center">
                    {b.isHidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => setEditing(b)} title="עריכה" className="h-7 w-7 rounded-lg bg-ink-50 hover:bg-ink-100 text-ink-500 flex items-center justify-center">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => remove(b)} title="מחיקה" className="h-7 w-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
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
        {creating && (
          <BenefitFormModal
            orgs={orgs}
            onClose={() => setCreating(false)}
            onSaved={(b) => { setCreating(false); setBenefits((prev) => [b, ...prev]); }}
          />
        )}
        {editing && (
          <BenefitFormModal
            initial={editing}
            orgs={orgs}
            onClose={() => setEditing(null)}
            onSaved={(b) => { setEditing(null); setBenefits((prev) => prev.map((x) => (x._id === b._id ? { ...x, ...b } : x))); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function BenefitFormModal({ initial, orgs, onClose, onSaved }) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    category: initial?.category || 'כללי',
    businessName: initial?.businessName || '',
    website: initial?.website || '',
    socialMedia: {
      facebook: initial?.socialMedia?.facebook || '',
      instagram: initial?.socialMedia?.instagram || '',
      whatsapp: initial?.socialMedia?.whatsapp || '',
      tiktok: initial?.socialMedia?.tiktok || '',
    },
    discountType: initial?.discountType || 'percentage',
    discountPercent: initial?.discountPercent ?? '',
    originalPrice: initial?.originalPrice ?? '',
    discountedPrice: initial?.discountedPrice ?? '',
    whatYouGet: initial?.whatYouGet || '',
    howToRedeem: initial?.howToRedeem || '',
    redemptionCode: initial?.redemptionCode || '',
    redemptionLink: initial?.redemptionLink || '',
    validUntil: initial?.validUntil ? new Date(initial.validUntil).toISOString().slice(0, 10) : '',
    organization: initial?.organization?._id || initial?.organization || (orgs[0]?._id || ''),
  });
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || '');
  const [loading, setLoading] = useState(false);
  const { upload, uploading, preview, clear } = useImageUpload();

  const handleImagePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('יש להעלות תמונה');
    if (file.size > 5 * 1024 * 1024) return toast.error('גודל מקסימלי 5MB');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await adminApi.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setImageUrl(data.url);
      toast.success('התמונה הועלתה');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה בהעלאה');
    }
    e.target.value = '';
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setSocial = (k, v) => setForm((f) => ({ ...f, socialMedia: { ...f.socialMedia, [k]: v } }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        imageUrl,
        discountPercent: form.discountPercent !== '' ? Number(form.discountPercent) : null,
        originalPrice: form.originalPrice !== '' ? Number(form.originalPrice) : null,
        discountedPrice: form.discountedPrice !== '' ? Number(form.discountedPrice) : null,
        validUntil: form.validUntil || null,
      };
      const { data } = isEdit
        ? await adminApi.patch(`/benefits/${initial._id}`, payload)
        : await adminApi.post('/benefits', payload);
      toast.success(isEdit ? 'ההטבה עודכנה' : 'ההטבה נוצרה');
      onSaved(data.benefit);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה בשמירה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
        className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-ink-100 px-5 py-3 flex items-center justify-between z-10">
          <h3 className="font-bold text-ink">{isEdit ? 'עריכת הטבה' : 'הטבה חדשה'}</h3>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-ink-50 flex items-center justify-center text-ink-500">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {/* Image */}
          <div>
            <label className="label">תמונה</label>
            <label className={`flex items-center gap-3 rounded-xl border border-dashed border-ink-200 p-3 cursor-pointer hover:bg-ink-50 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              <ImagePlus className="h-5 w-5 text-ink-400 shrink-0" />
              <span className="text-sm text-ink-500 flex-1">{uploading ? 'מעלה…' : (preview || imageUrl) ? 'תמונה נבחרה — להחלפה לחצו' : 'בחירת תמונה'}</span>
              {(preview || imageUrl) && <img src={preview || imageUrl} alt="" className="h-12 w-16 object-cover rounded-lg" />}
              <input type="file" accept="image/*" className="hidden" onChange={handleImagePick} disabled={uploading} />
            </label>
            {imageUrl && (
              <button type="button" onClick={() => { setImageUrl(''); clear(); }} className="mt-1 text-xs text-accent hover:underline">הסרת תמונה</button>
            )}
          </div>

          {/* Organization (admin only) */}
          <div>
            <label className="label">ארגון</label>
            <select className="input" value={form.organization} onChange={(e) => set('organization', e.target.value)} required>
              <option value="" disabled>בחר ארגון</option>
              {orgs.map((o) => <option key={o._id} value={o._id}>{o.name} ({o.code})</option>)}
            </select>
          </div>

          {/* Title + business */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">כותרת ההטבה</label>
              <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} required />
            </div>
            <div>
              <label className="label">שם העסק</label>
              <input className="input" value={form.businessName} onChange={(e) => set('businessName', e.target.value)} />
            </div>
          </div>

          {/* Category + website */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">קטגוריה</label>
              <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">אתר</label>
              <input dir="ltr" className="input" placeholder="https://..." value={form.website} onChange={(e) => set('website', e.target.value)} />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label">תיאור</label>
            <textarea rows={3} className="input" value={form.description} onChange={(e) => set('description', e.target.value)} required />
          </div>

          {/* Discount */}
          <div>
            <label className="label">סוג הנחה</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={form.discountType === 'percentage'} onChange={() => set('discountType', 'percentage')} />
                <span className="text-sm">אחוז הנחה</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={form.discountType === 'price_comparison'} onChange={() => set('discountType', 'price_comparison')} />
                <span className="text-sm">מחיר לפני ואחרי</span>
              </label>
            </div>
          </div>
          {form.discountType === 'percentage' ? (
            <div>
              <label className="label">אחוז הנחה</label>
              <div className="relative">
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <input type="number" min="0" max="100" className="input pr-9" value={form.discountPercent} onChange={(e) => set('discountPercent', e.target.value)} placeholder="20" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">מחיר מקורי (₪)</label>
                <input type="number" min="0" className="input" value={form.originalPrice} onChange={(e) => set('originalPrice', e.target.value)} />
              </div>
              <div>
                <label className="label">מחיר לאחר הנחה (₪)</label>
                <input type="number" min="0" className="input" value={form.discountedPrice} onChange={(e) => set('discountedPrice', e.target.value)} />
              </div>
            </div>
          )}

          <div>
            <label className="label">מה מקבלים?</label>
            <textarea rows={2} className="input" value={form.whatYouGet} onChange={(e) => set('whatYouGet', e.target.value)} />
          </div>
          <div>
            <label className="label">איך ממשים?</label>
            <textarea rows={2} className="input" value={form.howToRedeem} onChange={(e) => set('howToRedeem', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">קוד מימוש</label>
              <input className="input" value={form.redemptionCode} onChange={(e) => set('redemptionCode', e.target.value)} />
            </div>
            <div>
              <label className="label">קישור למימוש</label>
              <input dir="ltr" className="input" placeholder="https://..." value={form.redemptionLink} onChange={(e) => set('redemptionLink', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">תוקף עד</label>
            <input type="date" className="input" value={form.validUntil} onChange={(e) => set('validUntil', e.target.value)} />
          </div>

          <div>
            <label className="label">רשתות חברתיות (אופציונלי)</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Facebook className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600" />
                <input dir="ltr" className="input pr-9" placeholder="פייסבוק" value={form.socialMedia.facebook} onChange={(e) => setSocial('facebook', e.target.value)} />
              </div>
              <div className="relative">
                <Instagram className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-pink-600" />
                <input dir="ltr" className="input pr-9" placeholder="אינסטגרם" value={form.socialMedia.instagram} onChange={(e) => setSocial('instagram', e.target.value)} />
              </div>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" />
                <input dir="ltr" className="input pr-9" placeholder="וואטסאפ (מספר)" value={form.socialMedia.whatsapp} onChange={(e) => setSocial('whatsapp', e.target.value)} />
              </div>
              <div className="relative">
                <Globe className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <input dir="ltr" className="input pr-9" placeholder="טיקטוק" value={form.socialMedia.tiktok} onChange={(e) => setSocial('tiktok', e.target.value)} />
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading || uploading}>
            {loading ? 'שומר…' : isEdit ? 'שמירת שינויים' : 'יצירת ההטבה'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
