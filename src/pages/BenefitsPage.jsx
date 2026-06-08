import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Search, Gift, ExternalLink, Tag, X, Calendar, Code2, Globe, Facebook,
  Instagram, Phone, Plus, Percent, Info, ShoppingBag, ImagePlus, Send,
} from 'lucide-react';
import api from '../api/client';
import { SkeletonGrid } from '../components/skeletons/Skeletons.jsx';
import { formatDate } from '../utils/format.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useImageUpload } from '../hooks/useImageUpload.js';

const CATEGORIES = ['כללי', 'מסעדות', 'בריאות', 'ספורט', 'בידור', 'קניות', 'חינוך', 'נסיעות', 'טכנולוגיה', 'אחר'];
const PAGE_SIZE = 12;

export default function BenefitsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('benefit');

  const [benefits, setBenefits] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const sentinelRef = useRef(null);

  const fetchPage = async (p, replace = false, filters = { category }) => {
    try {
      const params = new URLSearchParams({ page: p, limit: PAGE_SIZE });
      if (filters.category !== 'all') params.set('category', filters.category);
      const { data } = await api.get(`/benefits?${params}`);
      setBenefits((prev) => replace ? data.benefits : [...prev, ...data.benefits]);
      setHasMore(data.hasMore);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setLoading(true);
    setBenefits([]);
    fetchPage(1, true, { category });
  }, [category]);

  // Open modal for highlighted benefit
  useEffect(() => {
    if (!highlightId || loading) return;
    const found = benefits.find((b) => b._id === highlightId);
    if (found) {
      setSelected(found);
      setSearchParams({}, { replace: true });
    } else {
      // Fetch it directly if not in loaded list
      api.get(`/benefits/${highlightId}`)
        .then(({ data }) => { setSelected(data.benefit); setSearchParams({}, { replace: true }); })
        .catch(() => {});
    }
  }, [highlightId, benefits, loading]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          const next = page + 1;
          setPage(next);
          setLoadingMore(true);
          fetchPage(next, false, { category });
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, category]);

  const categories = useMemo(() => {
    const set = new Set(benefits.map((b) => b.category).filter(Boolean));
    return ['all', ...set];
  }, [benefits]);

  const filtered = benefits.filter((b) => {
    if (q && !`${b.title} ${b.description} ${b.businessName}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const discountBadge = (b) => {
    if (b.discountType === 'percentage' && b.discountPercent) return `${b.discountPercent}% הנחה`;
    if (b.discountType === 'price_comparison' && b.discountedPrice != null) return `₪${b.discountedPrice}`;
    return null;
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-ink">מועדון הטבות</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSuggest(true)} className="btn-outline">
            <Send className="h-4 w-4" />
            הצעת הטבה
          </button>
          {isAdmin && (
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus className="h-4 w-4" />
              הוספת הטבה
            </button>
          )}
        </div>
      </header>

      <div className="rounded-2xl border border-accent/20 bg-gradient-to-bl from-accent/5 to-olive/5 p-5 space-y-3">
        <p className="text-sm font-semibold text-ink leading-relaxed">
          הטבות ייחודיות לחברי חטיבת יזרעאלי ומשפחותיהם — ישירות מעסקים שבחרו לתת יחס מיוחד לקהילה שלנו.
        </p>
        <p className="text-sm text-ink-600 leading-relaxed">
          כאן תמצאו הנחות, מבצעים ושירותים מועדפים ממגוון תחומים: מסעדות, בריאות, ספורט, קניות ועוד. כל הטבה עברה בדיקה ואושרה על ידי ההנהלה לפני הפרסום.
        </p>
        <p className="text-sm text-ink-600 leading-relaxed">
          מכירים עסק שיכול להציע הטבה לקהילה? לחצו על "הצעת הטבה" ונבדוק יחד.
        </p>
        <p className="text-xs text-ink-400 font-medium border-t border-ink-100 pt-3">
          לחצו על כל הטבה לפרטים נוספים ואפשרויות מימוש.
        </p>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input className="input pr-10" placeholder="חיפוש הטבה…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                category === c ? 'bg-accent text-white' : 'bg-ink-50 text-ink-500 hover:bg-ink-100'
              }`}
            >
              {c === 'all' ? 'הכל' : c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <SkeletonGrid count={6} />
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-ink-400">לא נמצאו הטבות תואמות.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((b, i) => {
            const badge = discountBadge(b);
            return (
              <motion.button
                key={b._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 5) * 0.04 }}
                onClick={() => setSelected(b)}
                className={`card overflow-hidden hover:shadow-soft transition group text-right w-full ${b._id === highlightId ? 'ring-2 ring-accent' : ''}`}
              >
                <div className="h-36 bg-gradient-to-bl from-muted-200 to-olive-100 relative flex items-center justify-center overflow-hidden">
                  {b.imageUrl ? (
                    <img src={b.imageUrl} alt={b.title} className="h-full w-full object-cover group-hover:scale-105 transition duration-300" />
                  ) : (
                    <Gift className="h-12 w-12 text-white/70" />
                  )}
                  {badge && (
                    <span className="absolute top-3 right-3 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full shadow-soft">
                      {badge}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  {b.businessName && <div className="text-xs text-muted-700 font-semibold mb-1">{b.businessName}</div>}
                  <h3 className="font-bold text-ink leading-snug line-clamp-2">{b.title}</h3>
                  <p className="mt-1.5 text-sm text-ink-500 line-clamp-2">{b.description}</p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-ink-400">
                    <Tag className="h-3.5 w-3.5" />
                    {b.category || 'כללי'}
                    {b.validUntil && <span className="mr-auto">עד {formatDate(b.validUntil)}</span>}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />
      {loadingMore && <SkeletonGrid count={3} />}
      {!hasMore && benefits.length > 0 && (
        <p className="text-center text-sm text-ink-300 pb-4">אין עוד הטבות</p>
      )}

      <AnimatePresence>
        {selected && <BenefitModal benefit={selected} onClose={() => setSelected(null)} />}
        {showSuggest && <SuggestBenefitModal onClose={() => setShowSuggest(false)} />}
        {showForm && (
          <BenefitFormModal
            onClose={() => setShowForm(false)}
            onCreated={() => {
              setShowForm(false);
              setPage(1);
              setLoading(true);
              setBenefits([]);
              fetchPage(1, true, { category });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function BenefitModal({ benefit: b, onClose }) {
  const discountBadge = () => {
    if (b.discountType === 'percentage' && b.discountPercent) return `${b.discountPercent}% הנחה`;
    if (b.discountType === 'price_comparison' && b.discountedPrice != null) return `₪${b.discountedPrice}`;
    return null;
  };
  const badge = discountBadge();

  const hasSocial = b.socialMedia && Object.values(b.socialMedia).some(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: 'spring', duration: 0.4 }}
        className="card w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero */}
        <div className="relative h-56 bg-gradient-to-bl from-muted-300 to-olive-200 flex items-center justify-center shrink-0">
          {b.imageUrl ? (
            <img src={b.imageUrl} alt={b.title} className="h-full w-full object-cover" />
          ) : (
            <Gift className="h-20 w-20 text-white/70" />
          )}
          {badge && (
            <span className="absolute top-4 right-4 bg-accent text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-soft">
              {badge}
            </span>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 h-8 w-8 rounded-full bg-white/90 text-ink-600 hover:bg-white flex items-center justify-center shadow"
            aria-label="סגור"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Header */}
          <div>
            {b.businessName && <div className="text-sm font-semibold text-muted-700 mb-1">{b.businessName}</div>}
            <h2 className="text-xl font-bold text-ink">{b.title}</h2>
            <p className="text-ink-600 leading-relaxed mt-2">{b.description}</p>
          </div>

          {/* Price comparison */}
          {b.discountType === 'price_comparison' && b.originalPrice != null && b.discountedPrice != null && (
            <div className="flex items-center gap-4 rounded-xl bg-accent-50 border border-accent-100 p-4">
              <span className="text-lg font-bold text-accent-700 shrink-0">₪</span>
              <div className="flex items-baseline gap-3">
                <span className="text-ink-400 line-through text-sm">₪{b.originalPrice}</span>
                <span className="text-xl font-bold text-accent-700">₪{b.discountedPrice}</span>
              </div>
            </div>
          )}
          {b.discountType === 'percentage' && b.discountPercent && (
            <div className="flex items-center gap-3 rounded-xl bg-accent-50 border border-accent-100 p-4">
              <Percent className="h-5 w-5 text-accent-700 shrink-0" />
              <span className="text-lg font-bold text-accent-700">{b.discountPercent}% הנחה</span>
            </div>
          )}

          {/* What you get */}
          {b.whatYouGet && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <ShoppingBag className="h-4 w-4 text-accent" />
                מה מקבלים?
              </div>
              <p className="text-sm text-ink-600 leading-relaxed bg-ink-50 rounded-xl p-3">{b.whatYouGet}</p>
            </div>
          )}

          {/* How to redeem */}
          {b.howToRedeem && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Info className="h-4 w-4 text-muted-700" />
                איך ממשים?
              </div>
              <p className="text-sm text-ink-600 leading-relaxed bg-ink-50 rounded-xl p-3">{b.howToRedeem}</p>
            </div>
          )}

          {/* Meta chips */}
          <div className="flex flex-wrap gap-2 text-sm text-ink-500">
            {b.category && (
              <span className="inline-flex items-center gap-1.5 chip">
                <Tag className="h-3.5 w-3.5" />
                {b.category}
              </span>
            )}
            {b.validUntil && (
              <span className="inline-flex items-center gap-1.5 chip">
                <Calendar className="h-3.5 w-3.5" />
                בתוקף עד {formatDate(b.validUntil)}
              </span>
            )}
          </div>

          {/* Redemption code */}
          {b.redemptionCode && (
            <div className="rounded-xl bg-accent-50 border border-accent-100 p-3 flex items-center gap-3">
              <Code2 className="h-4 w-4 text-accent-700 shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-accent-600 mb-0.5">קוד מימוש</div>
                <code className="font-mono font-bold text-accent-800 text-sm tracking-widest select-all">
                  {b.redemptionCode}
                </code>
              </div>
            </div>
          )}

          {/* Social links */}
          {hasSocial && (
            <div className="flex flex-wrap gap-2">
              {b.socialMedia?.facebook && (
                <a href={b.socialMedia.facebook} target="_blank" rel="noreferrer" className="chip hover:bg-ink-100 transition">
                  <Facebook className="h-3.5 w-3.5 text-blue-600" />
                  פייסבוק
                </a>
              )}
              {b.socialMedia?.instagram && (
                <a href={b.socialMedia.instagram} target="_blank" rel="noreferrer" className="chip hover:bg-ink-100 transition">
                  <Instagram className="h-3.5 w-3.5 text-pink-600" />
                  אינסטגרם
                </a>
              )}
              {b.socialMedia?.whatsapp && (
                <a href={`https://wa.me/${b.socialMedia.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="chip hover:bg-ink-100 transition">
                  <Phone className="h-3.5 w-3.5 text-green-600" />
                  וואטסאפ
                </a>
              )}
              {b.socialMedia?.tiktok && (
                <a href={b.socialMedia.tiktok} target="_blank" rel="noreferrer" className="chip hover:bg-ink-100 transition">
                  <Globe className="h-3.5 w-3.5 text-ink" />
                  טיקטוק
                </a>
              )}
            </div>
          )}

          {/* Website / CTA */}
          {b.website && (
            <a href={b.website} target="_blank" rel="noreferrer" className="btn-outline w-full">
              <Globe className="h-4 w-4" />
              לאתר ההטבה
            </a>
          )}
          {b.redemptionLink && (
            <a href={b.redemptionLink} target="_blank" rel="noreferrer" className="btn-primary w-full">
              <ExternalLink className="h-4 w-4" />
              מימוש ההטבה
            </a>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function BenefitFormModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '', description: '', category: 'כללי',
    businessName: '', website: '',
    socialMedia: { facebook: '', instagram: '', whatsapp: '', tiktok: '' },
    discountType: 'percentage',
    discountPercent: '', originalPrice: '', discountedPrice: '',
    whatYouGet: '', howToRedeem: '',
    redemptionCode: '', redemptionLink: '',
    validUntil: '', imageUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const { upload, uploading, preview, clear } = useImageUpload();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setSocial = (k, v) => setForm((f) => ({ ...f, socialMedia: { ...f.socialMedia, [k]: v } }));

  const handleImagePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await upload(file);
    if (url) set('imageUrl', url);
    e.target.value = '';
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        discountPercent: form.discountPercent !== '' ? Number(form.discountPercent) : null,
        originalPrice: form.originalPrice !== '' ? Number(form.originalPrice) : null,
        discountedPrice: form.discountedPrice !== '' ? Number(form.discountedPrice) : null,
        validUntil: form.validUntil || null,
      };
      await api.post('/benefits', payload);
      toast.success('ההטבה נוספה בהצלחה');
      onCreated();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה בהוספת ההטבה');
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
        className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-ink-100 px-5 py-3 flex items-center justify-between z-10">
          <h3 className="font-bold text-ink">הוספת הטבה חדשה</h3>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-ink-50 flex items-center justify-center text-ink-500">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {/* Image */}
          <div>
            <label className="label">תמונה (אופציונלי)</label>
            <label className={`flex items-center gap-3 rounded-xl border border-dashed border-ink-200 p-3 cursor-pointer hover:bg-ink-50 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              <ImagePlus className="h-5 w-5 text-ink-400 shrink-0" />
              <span className="text-sm text-ink-500 flex-1">{uploading ? 'מעלה…' : preview ? 'תמונה נבחרה' : 'בחירת תמונה'}</span>
              {preview && <img src={preview} alt="" className="h-12 w-16 object-cover rounded-lg" />}
              <input type="file" accept="image/*" className="hidden" onChange={handleImagePick} disabled={uploading} />
            </label>
            {form.imageUrl && (
              <button type="button" onClick={() => { set('imageUrl', ''); clear(); }} className="mt-1 text-xs text-accent hover:underline">הסרת תמונה</button>
            )}
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
            <label className="label">תיאור ההטבה</label>
            <textarea rows={3} className="input" value={form.description} onChange={(e) => set('description', e.target.value)} required />
          </div>

          {/* Discount type */}
          <div>
            <label className="label">סוג הנחה</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="percentage" checked={form.discountType === 'percentage'} onChange={() => set('discountType', 'percentage')} />
                <span className="text-sm">אחוז הנחה</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="price_comparison" checked={form.discountType === 'price_comparison'} onChange={() => set('discountType', 'price_comparison')} />
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

          {/* What you get + how to redeem */}
          <div>
            <label className="label">מה מקבלים?</label>
            <textarea rows={2} className="input" value={form.whatYouGet} onChange={(e) => set('whatYouGet', e.target.value)} />
          </div>
          <div>
            <label className="label">איך ממשים?</label>
            <textarea rows={2} className="input" value={form.howToRedeem} onChange={(e) => set('howToRedeem', e.target.value)} />
          </div>

          {/* Redemption */}
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

          {/* Valid until */}
          <div>
            <label className="label">תוקף עד</label>
            <input type="date" className="input" value={form.validUntil} onChange={(e) => set('validUntil', e.target.value)} />
          </div>

          {/* Social media */}
          <div>
            <label className="label">רשתות חברתיות (אופציונלי)</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label text-xs flex items-center gap-1"><Facebook className="h-3.5 w-3.5 text-blue-600" />פייסבוק</label>
                <input dir="ltr" className="input" placeholder="https://facebook.com/..." value={form.socialMedia.facebook} onChange={(e) => setSocial('facebook', e.target.value)} />
              </div>
              <div>
                <label className="label text-xs flex items-center gap-1"><Instagram className="h-3.5 w-3.5 text-pink-600" />אינסטגרם</label>
                <input dir="ltr" className="input" placeholder="https://instagram.com/..." value={form.socialMedia.instagram} onChange={(e) => setSocial('instagram', e.target.value)} />
              </div>
              <div>
                <label className="label text-xs flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-green-600" />וואטסאפ (מספר)</label>
                <input dir="ltr" className="input" placeholder="972501234567" value={form.socialMedia.whatsapp} onChange={(e) => setSocial('whatsapp', e.target.value)} />
              </div>
              <div>
                <label className="label text-xs flex items-center gap-1"><Globe className="h-3.5 w-3.5" />טיקטוק</label>
                <input dir="ltr" className="input" placeholder="https://tiktok.com/@..." value={form.socialMedia.tiktok} onChange={(e) => setSocial('tiktok', e.target.value)} />
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading || uploading}>
            {loading ? 'שומר…' : 'הוספת הטבה'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

function SuggestBenefitModal({ onClose }) {
  const [form, setForm] = useState({ businessName: '', description: '', contactName: '', contactPhone: '', website: '' });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/benefits/suggest', form);
      toast.success('ההצעה נשלחה להנהלה, תודה!');
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה בשליחה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        className="card w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-accent" />
            <h3 className="font-bold text-ink">הצעת הטבה להנהלה</h3>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-ink-50 flex items-center justify-center text-ink-400">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <p className="text-sm text-ink-500">מכירים עסק שיכול להציע הטבה לחברי הקהילה? שלחו לנו את הפרטים ונבדוק.</p>
          <div>
            <label className="label">שם העסק *</label>
            <input className="input" value={form.businessName} onChange={(e) => set('businessName', e.target.value)} required />
          </div>
          <div>
            <label className="label">תיאור ההטבה המוצעת *</label>
            <textarea rows={3} className="input" value={form.description} onChange={(e) => set('description', e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">שם איש קשר</label>
              <input className="input" value={form.contactName} onChange={(e) => set('contactName', e.target.value)} />
            </div>
            <div>
              <label className="label">טלפון</label>
              <input dir="ltr" className="input" value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">אתר (אופציונלי)</label>
            <input dir="ltr" className="input" placeholder="https://..." value={form.website} onChange={(e) => set('website', e.target.value)} />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'שולח…' : 'שליחת ההצעה'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
