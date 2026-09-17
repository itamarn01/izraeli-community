import { ImagePlus, Percent, Facebook, Instagram, Phone, Globe } from 'lucide-react';

// One definition of "the fields a benefit has", shared by the member-facing
// suggestion form and the admin review screen — the two must stay identical,
// since approving a suggestion publishes it verbatim.

export const CATEGORIES = [
  'כללי', 'מסעדות', 'בריאות', 'ספורט', 'בידור', 'קניות', 'צרכנות',
  'חינוך', 'נסיעות', 'טכנולוגיה', 'אחר',
];

export const GEDUD_OPTIONS = [
  'משמר העמקים', 'אבישי', 'הכרמל', 'אבשלום', 'חרב שאול', 'מטה', 'שותף לדרך',
];

export const GEDUD_IMAGES = {
  'משמר העמקים': '/mishmar_haamakim.png',
  'אבישי': '/avishay.png',
  'הכרמל': '/carmel.png',
  'אבשלום': '/avshalom.png',
  'חרב שאול': '/herev_shaul.png',
  'מטה': '/mate.png',
};

/** The blank form, optionally seeded from an existing benefit or suggestion. */
export function emptyBenefitForm(initial = null) {
  return {
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
    imageUrl: initial?.imageUrl || '',
    discountType: initial?.discountType || 'percentage',
    discountPercent: initial?.discountPercent ?? '',
    originalPrice: initial?.originalPrice ?? '',
    discountedPrice: initial?.discountedPrice ?? '',
    whatYouGet: initial?.whatYouGet || '',
    howToRedeem: initial?.howToRedeem || '',
    redemptionCode: initial?.redemptionCode || '',
    redemptionLink: initial?.redemptionLink || '',
    validUntil: initial?.validUntil ? new Date(initial.validUntil).toISOString().slice(0, 10) : '',
    gedud: initial?.gedud || '',
    contactName: initial?.contactName || '',
    contactPhone: initial?.contactPhone || '',
  };
}

/** Number inputs come back as strings; the API wants numbers or nulls. */
export function benefitFormPayload(form) {
  return {
    ...form,
    discountPercent: form.discountPercent !== '' ? Number(form.discountPercent) : null,
    originalPrice: form.originalPrice !== '' ? Number(form.originalPrice) : null,
    discountedPrice: form.discountedPrice !== '' ? Number(form.discountedPrice) : null,
    validUntil: form.validUntil || null,
  };
}

/**
 * @param {object}   form        state from emptyBenefitForm()
 * @param {function} onChange    (key, value) => void
 * @param {function} onUpload    (file) => Promise<string|null> — returns the URL
 * @param {boolean}  uploading
 * @param {boolean}  [showContact] include the reviewer-only contact fields
 */
export default function BenefitFormFields({ form, onChange, onUpload, uploading, showContact = true }) {
  const setSocial = (k, v) => onChange('socialMedia', { ...form.socialMedia, [k]: v });

  const pickImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const url = await onUpload(file);
    if (url) onChange('imageUrl', url);
  };

  return (
    <>
      <div>
        <label className="label">תמונה של ההטבה או לוגו העסק</label>
        <label
          className={`flex items-center gap-3 rounded-xl border border-dashed border-ink-200 p-3 cursor-pointer hover:bg-ink-50 ${
            uploading ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          <ImagePlus className="h-5 w-5 text-ink-400 shrink-0" />
          <span className="text-sm text-ink-500 flex-1">
            {uploading ? 'מעלה…' : form.imageUrl ? 'תמונה נבחרה — להחלפה לחצו' : 'בחירת תמונה'}
          </span>
          {form.imageUrl && <img src={form.imageUrl} alt="" className="h-12 w-16 object-cover rounded-lg" />}
          <input type="file" accept="image/*" className="hidden" onChange={pickImage} disabled={uploading} />
        </label>
        {form.imageUrl && (
          <button type="button" onClick={() => onChange('imageUrl', '')} className="mt-1 text-xs text-accent hover:underline">
            הסרת תמונה
          </button>
        )}
        <p className="mt-1 text-xs text-ink-400">תמונה רוחבית נראית הכי טוב — מומלץ 1200×675 פיקסלים, עד 5MB.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">שם העסק *</label>
          <input className="input" value={form.businessName} onChange={(e) => onChange('businessName', e.target.value)} required />
        </div>
        <div>
          <label className="label">כותרת ההטבה *</label>
          <input
            className="input"
            placeholder="למשל: 20% הנחה על כל התפריט"
            value={form.title}
            onChange={(e) => onChange('title', e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className="label">תיאור ההטבה *</label>
        <textarea rows={3} className="input" value={form.description} onChange={(e) => onChange('description', e.target.value)} required />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">קטגוריה</label>
          <select className="input" value={form.category} onChange={(e) => onChange('category', e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">אתר העסק</label>
          <input dir="ltr" className="input" placeholder="https://..." value={form.website} onChange={(e) => onChange('website', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label">שיוך גדוד / שותף לדרך</label>
        <select className="input" value={form.gedud} onChange={(e) => onChange('gedud', e.target.value)}>
          <option value="">ללא שיוך</option>
          {GEDUD_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        {form.gedud && GEDUD_IMAGES[form.gedud] && (
          <img
            src={GEDUD_IMAGES[form.gedud]}
            alt={form.gedud}
            className="mt-2 h-10 w-10 object-contain rounded-full bg-ink-50 p-1 border border-ink-100"
          />
        )}
      </div>

      <div>
        <label className="label">סוג ההטבה</label>
        <div className="flex gap-3 flex-wrap">
          {[
            ['percentage', 'אחוז הנחה'],
            ['price_comparison', 'מחיר לפני ואחרי'],
            ['gift_with_purchase', 'מתנה בקנייה'],
          ].map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={form.discountType === value} onChange={() => onChange('discountType', value)} />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {form.discountType === 'percentage' && (
        <div>
          <label className="label">אחוז הנחה</label>
          <div className="relative">
            <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              type="number" min="0" max="100" className="input pr-9" placeholder="20"
              value={form.discountPercent} onChange={(e) => onChange('discountPercent', e.target.value)}
            />
          </div>
        </div>
      )}
      {form.discountType === 'price_comparison' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">מחיר מקורי (₪)</label>
            <input type="number" min="0" className="input" value={form.originalPrice} onChange={(e) => onChange('originalPrice', e.target.value)} />
          </div>
          <div>
            <label className="label">מחיר לאחר הנחה (₪)</label>
            <input type="number" min="0" className="input" value={form.discountedPrice} onChange={(e) => onChange('discountedPrice', e.target.value)} />
          </div>
        </div>
      )}
      {form.discountType === 'gift_with_purchase' && (
        <p className="text-sm text-ink-500 bg-ink-50 rounded-lg px-3 py-2">
          פרטו את המתנה בשדה "מה מקבלים?" ואת תנאי הקנייה בשדה "איך ממשים?" למטה.
        </p>
      )}

      <div>
        <label className="label">מה מקבלים?</label>
        <textarea rows={2} className="input" value={form.whatYouGet} onChange={(e) => onChange('whatYouGet', e.target.value)} />
      </div>
      <div>
        <label className="label">איך ממשים?</label>
        <textarea rows={2} className="input" value={form.howToRedeem} onChange={(e) => onChange('howToRedeem', e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">קוד מימוש</label>
          <input className="input" value={form.redemptionCode} onChange={(e) => onChange('redemptionCode', e.target.value)} />
        </div>
        <div>
          <label className="label">קישור למימוש</label>
          <input dir="ltr" className="input" placeholder="https://..." value={form.redemptionLink} onChange={(e) => onChange('redemptionLink', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label">תוקף ההטבה עד</label>
        <input type="date" className="input" value={form.validUntil} onChange={(e) => onChange('validUntil', e.target.value)} />
      </div>

      <div>
        <label className="label">רשתות חברתיות (אופציונלי)</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

      {showContact && (
        <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-4 space-y-3">
          <p className="text-xs text-ink-500">
            פרטי הקשר בעסק — לשימוש ההנהלה בלבד לצורך בדיקת ההטבה. לא יפורסמו.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">שם איש קשר בעסק</label>
              <input className="input" value={form.contactName} onChange={(e) => onChange('contactName', e.target.value)} />
            </div>
            <div>
              <label className="label">טלפון</label>
              <input dir="ltr" className="input" value={form.contactPhone} onChange={(e) => onChange('contactPhone', e.target.value)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
