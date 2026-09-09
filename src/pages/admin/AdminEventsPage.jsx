import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  CalendarDays, Plus, X, Pencil, Trash2, Users, Compass, ImagePlus, Loader2,
  FileSpreadsheet, ExternalLink, Search, Clock, Copy, ChevronDown, ChevronUp,
  UserMinus, AlertCircle, Megaphone,
} from 'lucide-react';
import adminApi from '../../api/adminClient';
import RichTextEditor from '../../components/common/RichTextEditor.jsx';
import BroadcastModal from '../../components/admin/BroadcastModal.jsx';
import { formatEventDate, formatEventDateShort } from '../../utils/eventDate.js';

const emptyTour = () => ({ title: '', description: '', slots: [{ time: '16:00', capacity: 25 }] });

// Fallback so a card never renders against a missing `stats` object.
const EMPTY_STATS = { registrations: 0, attendees: 0, spouses: 0, children: 0, tourRegistrations: 0 };

// datetime-local ⇄ ISO. The picker is naive local time; the API stores an instant.
function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function StatTile({ icon: Icon, label, value, tone = 'ink' }) {
  const tones = {
    ink: 'bg-ink-50 text-ink-600',
    accent: 'bg-accent-50 text-accent-700',
    olive: 'bg-olive-50 text-olive-700',
    muted: 'bg-muted-100 text-muted-700',
  };
  return (
    <div className="card p-4">
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${tones[tone]}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="mt-3 text-2xl font-bold text-ink">{value}</div>
      <div className="text-xs text-ink-400">{label}</div>
    </div>
  );
}

// ── Tour builder ────────────────────────────────────────────────────────

function TourEditor({ tours, onChange }) {
  const patch = (i, changes) => onChange(tours.map((t, idx) => (idx === i ? { ...t, ...changes } : t)));
  const patchSlot = (ti, si, changes) =>
    patch(ti, { slots: tours[ti].slots.map((s, idx) => (idx === si ? { ...s, ...changes } : s)) });

  // A booked hour can't be removed — the API refuses it, so the UI does too.
  const removeSlot = (ti, si) => {
    const slot = tours[ti].slots[si];
    if (slot.takenSeats > 0) {
      toast.error(`בשעה ${slot.time} כבר רשומים ${slot.takenSeats} משתתפים — יש לבטל את ההרשמות תחילה.`);
      return;
    }
    patch(ti, { slots: tours[ti].slots.filter((_, idx) => idx !== si) });
  };

  const removeTour = (ti) => {
    if (tours[ti].slots.some((s) => s.takenSeats > 0)) {
      toast.error('לא ניתן למחוק סיור שיש בו נרשמים.');
      return;
    }
    onChange(tours.filter((_, idx) => idx !== ti));
  };

  return (
    <div className="space-y-3">
      {tours.map((tour, ti) => (
        <div key={tour._id || ti} className="rounded-xl border border-ink-200 bg-ink-50/40 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-3">
              <div>
                <label className="label">כותרת הסיור</label>
                <input
                  className="input"
                  value={tour.title}
                  onChange={(e) => patch(ti, { title: e.target.value })}
                  placeholder="למשל: סיור בעתיקות הגן הלאומי בית שאן"
                />
              </div>
              <div>
                <label className="label">תיאור / שאלה שתוצג למשתמש (רשות)</label>
                <input
                  className="input"
                  value={tour.description}
                  onChange={(e) => patch(ti, { description: e.target.value })}
                  placeholder="האם תרצו להצטרף לסיור חינמי בעתיקות לפני תחילת העצרת?"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeTour(ti)}
              aria-label="מחיקת הסיור"
              className="h-9 w-9 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="label !mb-0">שעות ומכסות</span>
              <button
                type="button"
                onClick={() => {
                  const last = tour.slots[tour.slots.length - 1];
                  patch(ti, { slots: [...tour.slots, { time: last?.time || '16:00', capacity: last?.capacity || 25 }] });
                }}
                className="text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                הוספת שעה
              </button>
            </div>

            <div className="space-y-2">
              {tour.slots.map((slot, si) => (
                <div key={slot._id || si} className="flex items-center gap-2">
                  <input
                    type="time"
                    dir="ltr"
                    className="input !py-2 w-32 text-center"
                    value={slot.time}
                    onChange={(e) => patchSlot(ti, si, { time: e.target.value })}
                  />
                  <div className="flex items-center gap-1.5 flex-1">
                    <input
                      type="number"
                      min="1"
                      className="input !py-2 w-24"
                      value={slot.capacity}
                      onChange={(e) => patchSlot(ti, si, { capacity: e.target.value })}
                    />
                    <span className="text-xs text-ink-400">מקומות</span>
                  </div>
                  {slot.takenSeats > 0 && (
                    <span className="chip !bg-olive-100 !text-olive-800 text-[11px] whitespace-nowrap">
                      {slot.takenSeats} תפוסים
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeSlot(ti, si)}
                    aria-label={`מחיקת השעה ${slot.time}`}
                    className="h-8 w-8 rounded-lg text-ink-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {tour.slots.length === 0 && (
                <p className="text-xs text-ink-400">עדיין לא הוגדרו שעות לסיור זה.</p>
              )}
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...tours, emptyTour()])}
        className="btn-outline w-full !py-2 text-sm"
      >
        <Plus className="h-4 w-4" />
        הוספת סיור
      </button>
    </div>
  );
}

// ── Create / edit modal ─────────────────────────────────────────────────

function EventModal({ initial, orgs, onClose, onSaved }) {
  const isEdit = Boolean(initial?._id);
  const [form, setForm] = useState({
    title: initial?.title || '',
    slug: initial?.slug || '',
    summary: initial?.summary || '',
    date: initial?.date || '',
    startTime: initial?.startTime || '',
    endTime: initial?.endTime || '',
    location: initial?.location || '',
    locationUrl: initial?.locationUrl || '',
    capacity: initial?.capacity ?? 0,
    registrationClosesAt: toLocalInput(initial?.registrationClosesAt),
    allowSpouse: initial?.allowSpouse ?? true,
    toursEnabled: initial?.toursEnabled ?? false,
    childrenEnabled: initial?.childrenEnabled ?? false,
    childrenMinAge: initial?.childrenMinAge ?? 0,
    autoPopup: initial?.autoPopup ?? true,
    organization: initial?.organization?._id || initial?.organization || '',
  });
  const [descriptionHtml, setDescriptionHtml] = useState(initial?.descriptionHtml || '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || '');
  const [tours, setTours] = useState(
    initial?.tours?.length ? initial.tours.map((t) => ({ ...t, slots: [...t.slots] })) : [emptyTour()]
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleImagePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('יש להעלות תמונה');
    if (file.size > 5 * 1024 * 1024) return toast.error('גודל מקסימלי 5MB');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await adminApi.post('/upload/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageUrl(data.url);
      toast.success('התמונה הועלתה');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה בהעלאה');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (form.toursEnabled) {
      const bad = tours.find((t) => !t.title.trim() || t.slots.length === 0);
      if (bad) return toast.error('לכל סיור נדרשת כותרת ולפחות שעה אחת');
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        capacity: Number(form.capacity) || 0,
        childrenMinAge: Number(form.childrenMinAge) || 0,
        registrationClosesAt: form.registrationClosesAt ? new Date(form.registrationClosesAt).toISOString() : null,
        organization: form.organization || null,
        descriptionHtml,
        imageUrl,
        tours: form.toursEnabled
          ? tours.map((t) => ({
              ...(t._id ? { _id: t._id } : {}),
              title: t.title.trim(),
              description: t.description || '',
              slots: t.slots.map((s) => ({
                ...(s._id ? { _id: s._id } : {}),
                time: s.time,
                capacity: Number(s.capacity) || 1,
              })),
            }))
          : [],
      };

      const { data } = isEdit
        ? await adminApi.patch(`/events/${initial._id}`, payload)
        : await adminApi.post('/events', payload);

      toast.success(isEdit ? 'האירוע עודכן' : 'האירוע נוצר');
      onSaved(data.event);
      onClose();
    } catch (err) {
      const zod = err?.response?.data?.errors?.[0]?.message;
      toast.error(zod || err?.response?.data?.message || 'שגיאה בשמירה');
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
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? 'עריכת אירוע' : 'אירוע חדש'}
        className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-ink-100 px-5 py-3 flex items-center justify-between z-10">
          <h3 className="font-bold text-ink">{isEdit ? 'עריכת אירוע' : 'אירוע חדש'}</h3>
          <button
            onClick={onClose}
            aria-label="סגירה"
            className="h-8 w-8 rounded-lg hover:bg-ink-50 flex items-center justify-center text-ink-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {/* Image */}
          <div>
            <label className="label">תמונת האירוע (לדף הנחיתה ולפופאפ)</label>
            <label
              className={`flex items-center gap-3 rounded-xl border border-dashed border-ink-200 p-3 cursor-pointer hover:bg-ink-50 ${
                uploading ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <ImagePlus className="h-5 w-5 text-ink-400 shrink-0" />
              <span className="text-sm text-ink-500 flex-1">
                {uploading ? 'מעלה…' : imageUrl ? 'תמונה נבחרה — להחלפה לחצו' : 'בחירת תמונה'}
              </span>
              {imageUrl && <img src={imageUrl} alt="" className="h-12 w-20 object-cover rounded-lg" />}
              <input type="file" accept="image/*" className="hidden" onChange={handleImagePick} disabled={uploading} />
            </label>
            {imageUrl && (
              <button type="button" onClick={() => setImageUrl('')} className="mt-1 text-xs text-accent hover:underline">
                הסרת תמונה
              </button>
            )}
          </div>

          <div>
            <label className="label" htmlFor="ev-title">כותרת האירוע</label>
            <input
              id="ev-title"
              className="input"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="עצרת חטיבת יזרעאלי 186"
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="ev-summary">תקציר קצר (מוצג בכרטיסים, בהתראות ובמייל)</label>
            <input
              id="ev-summary"
              className="input"
              value={form.summary}
              onChange={(e) => set('summary', e.target.value)}
              maxLength={300}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label" htmlFor="ev-date">תאריך</label>
              <input
                id="ev-date"
                type="date"
                className="input"
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="ev-start">שעת התחלה</label>
              <input id="ev-start" type="time" dir="ltr" className="input text-center" value={form.startTime} onChange={(e) => set('startTime', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="ev-end">שעת סיום</label>
              <input id="ev-end" type="time" dir="ltr" className="input text-center" value={form.endTime} onChange={(e) => set('endTime', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="ev-location">מיקום</label>
              <input id="ev-location" className="input" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="גן לאומי בית שאן" />
            </div>
            <div>
              <label className="label" htmlFor="ev-map">קישור למפה (רשות)</label>
              <input id="ev-map" dir="ltr" className="input" value={form.locationUrl} onChange={(e) => set('locationUrl', e.target.value)} placeholder="https://maps.google.com/..." />
            </div>
          </div>

          <div>
            <label className="label">פרטים נוספים</label>
            <RichTextEditor
              value={descriptionHtml}
              onChange={setDescriptionHtml}
              showFields={false}
              placeholder="כתבו כאן את כל הפרטים על האירוע — סדר יום, הנחיות הגעה, חניה ועוד…"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="ev-org">ארגון</label>
              <select id="ev-org" className="input" value={form.organization} onChange={(e) => set('organization', e.target.value)}>
                <option value="">כל הארגונים</option>
                {orgs.map((o) => (
                  <option key={o._id} value={o._id}>
                    {o.name} ({o.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="ev-capacity">קיבולת (0 = ללא הגבלה)</label>
              <input id="ev-capacity" type="number" min="0" className="input" value={form.capacity} onChange={(e) => set('capacity', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="ev-closes">מועד סגירת ההרשמה (רשות)</label>
            <input
              id="ev-closes"
              type="datetime-local"
              className="input"
              value={form.registrationClosesAt}
              onChange={(e) => set('registrationClosesAt', e.target.value)}
            />
            <p className="mt-1 text-xs text-ink-400">אם לא הוגדר — ההרשמה נסגרת מעצמה ביום שאחרי האירוע.</p>
          </div>

          {isEdit && (
            <div>
              <label className="label" htmlFor="ev-slug">כתובת דף הנחיתה</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-400 shrink-0" dir="ltr">/e/</span>
                <input id="ev-slug" dir="ltr" className="input" value={form.slug} onChange={(e) => set('slug', e.target.value)} />
              </div>
            </div>
          )}

          {/* Switches */}
          <div className="space-y-2">
            {[
              { key: 'allowSpouse', label: 'לאפשר הגעה עם בן/בת זוג', hint: 'תוצג שאלה ושדה לשם בן/בת הזוג.' },
              { key: 'autoPopup', label: 'פתיחת פופאפ ההרשמה אוטומטית בכניסה למערכת', hint: 'עד שהמשתמש נרשם או מסמן שאינו מגיע.' },
              { key: 'toursEnabled', label: 'האירוע כולל סיורים', hint: 'הגדירו למטה כותרת, שעות ומכסה לכל שעה.' },
              { key: 'childrenEnabled', label: 'לאפשר הגעה עם ילדים', hint: 'בפופאפ יוצג ליוזר לבחור אילו מהילדים בפרופיל שלו מגיעים.' },
            ].map((s) => (
              <label key={s.key} className="flex items-start gap-3 rounded-xl border border-ink-100 p-3 cursor-pointer hover:bg-ink-50/60">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-[#CB8333]"
                  checked={form[s.key]}
                  onChange={(e) => set(s.key, e.target.checked)}
                />
                <span>
                  <span className="block text-sm font-semibold text-ink">{s.label}</span>
                  <span className="block text-xs text-ink-400 mt-0.5">{s.hint}</span>
                </span>
              </label>
            ))}
          </div>

          {form.childrenEnabled && (
            <div>
              <label className="label" htmlFor="ev-children-age">גיל כניסה מינימלי לילדים (בשנים, נכון לתאריך האירוע)</label>
              <input
                id="ev-children-age"
                type="number"
                min="0"
                max="120"
                className="input w-32"
                value={form.childrenMinAge}
                onChange={(e) => set('childrenMinAge', e.target.value)}
              />
              <p className="mt-1 text-xs text-ink-400">
                בפופאפ יוכל היוזר לבחור רק מבין הילדים בפרופיל שלו שהגיעו לגיל הזה.
              </p>
            </div>
          )}

          {form.toursEnabled && (
            <div>
              <label className="label">סיורים</label>
              <TourEditor tours={tours} onChange={setTours} />
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'שמירת שינויים' : 'יצירת האירוע'}
            </button>
            <button type="button" onClick={onClose} className="btn-outline">
              ביטול
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Registrations panel ─────────────────────────────────────────────────

function RegistrationsModal({ event, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [showSlots, setShowSlots] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [segment, setSegment] = useState('registered');
  const [slotId, setSlotId] = useState('');

  const load = () => {
    setLoading(true);
    adminApi
      .get(`/events/${event._id}/registrations`)
      .then(({ data: d }) => setData(d))
      .catch(() => toast.error('שגיאה בטעינת הנרשמים'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [event._id]);

  const registrations = useMemo(() => {
    const rows = (data?.registrations || []).filter((r) => r.status === 'registered');
    if (!q.trim()) return rows;
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      const name = [r.user?.profile?.firstName, r.user?.profile?.lastName].filter(Boolean).join(' ');
      const childrenNames = (r.childrenAttending || []).map((c) => c.name);
      return [name, r.spouseName, r.user?.email, r.user?.profile?.phone, r.user?.profile?.gedud, r.tour?.time, ...childrenNames]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [data, q]);

  // The xlsx arrives as a blob on an authenticated request, so it is downloaded
  // through an object URL rather than a plain link.
  const exportExcel = async () => {
    setExporting(true);
    try {
      const res = await adminApi.get(`/events/${event._id}/export`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${event.slug || 'event'}-registrations.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('שגיאה בייצוא');
    } finally {
      setExporting(false);
    }
  };

  const removeRegistration = async (reg) => {
    const name = [reg.user?.profile?.firstName, reg.user?.profile?.lastName].filter(Boolean).join(' ');
    if (!window.confirm(`להסיר את ההרשמה של ${name || 'המשתמש'}? המקומות שנתפסו ישוחררו.`)) return;
    try {
      await adminApi.delete(`/events/${event._id}/registrations/${reg._id}`);
      toast.success('ההרשמה הוסרה');
      load();
      onChanged?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה בהסרה');
    }
  };

  const stats = data?.stats;

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
        role="dialog"
        aria-modal="true"
        aria-label={`נרשמים ל${event.title}`}
        className="card w-full max-w-5xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-ink-100 px-5 py-3 flex items-center gap-3 z-10">
          <div className="min-w-0">
            <h3 className="font-bold text-ink truncate">{event.title}</h3>
            <p className="text-xs text-ink-400">{formatEventDate(event.date)}</p>
          </div>
          <div className="flex items-center gap-2 mr-auto shrink-0">
            <button onClick={() => setBroadcastOpen(true)} className="btn-primary !py-2 text-sm">
              <Megaphone className="h-4 w-4" />
              שליחת מייל
            </button>
            <button onClick={exportExcel} disabled={exporting} className="btn-outline !py-2 text-sm">
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              ייצוא לאקסל
            </button>
          </div>
          <button onClick={onClose} aria-label="סגירה" className="h-8 w-8 rounded-lg hover:bg-ink-50 flex items-center justify-center text-ink-500 shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-28 rounded-2xl" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatTile icon={Users} label="נרשמים לאירוע" value={stats.registrations} tone="accent" />
                <StatTile icon={Users} label="בני/בנות זוג" value={stats.spouses} tone="muted" />
                <StatTile icon={Users} label="סה״כ משתתפים" value={stats.attendees} tone="olive" />
                <StatTile icon={Compass} label={`נרשמים לסיורים (${stats.tourPeople} מקומות)`} value={stats.tourRegistrations} />
                {event.childrenEnabled && (
                  <StatTile icon={Users} label="ילדים רשומים" value={stats.children} tone="muted" />
                )}
              </div>

              {(stats.declined > 0 || stats.cancelled > 0 || stats.seatsLeft !== null) && (
                <p className="text-xs text-ink-400 flex flex-wrap gap-x-4 gap-y-1">
                  {stats.seatsLeft !== null && <span>מקומות פנויים לאירוע: {stats.seatsLeft}</span>}
                  {stats.cancelled > 0 && <span>ביטולים: {stats.cancelled}</span>}
                  {stats.declined > 0 && <span>סימנו שאינם מגיעים: {stats.declined}</span>}
                </p>
              )}

              {stats.slots.length > 0 && (
                <section className="card p-4">
                  <button
                    onClick={() => setShowSlots((s) => !s)}
                    aria-expanded={showSlots}
                    className="w-full flex items-center gap-2 text-sm font-bold text-ink"
                  >
                    <Compass className="h-4 w-4 text-accent" />
                    חלוקה לפי סלוטים
                    {showSlots ? <ChevronUp className="h-4 w-4 mr-auto" /> : <ChevronDown className="h-4 w-4 mr-auto" />}
                  </button>
                  {showSlots && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {stats.slots.map((s) => (
                        <div
                          key={s.slotId}
                          className={`rounded-xl border p-3 ${
                            s.seatsLeft === 0 ? 'border-accent-200 bg-accent-50' : 'border-ink-100 bg-ink-50/50'
                          }`}
                        >
                          <div className="text-[11px] text-ink-400 truncate">{s.tourTitle}</div>
                          <div className="text-lg font-bold text-ink flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-accent" />
                            {s.time}
                          </div>
                          <div className="mt-1 text-xs text-ink-500">
                            {s.takenSeats} / {s.capacity} תפוסים
                          </div>
                          <div className="mt-1.5 h-1.5 rounded-full bg-ink-100 overflow-hidden">
                            <div
                              className="h-full bg-accent rounded-full"
                              style={{ width: `${s.capacity ? Math.min(100, (s.takenSeats / s.capacity) * 100) : 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <input
                  className="input pr-10"
                  placeholder="חיפוש לפי שם, גדוד, מייל, טלפון או שעת סיור…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  aria-label="חיפוש בנרשמים"
                />
              </div>

              {registrations.length === 0 ? (
                <div className="card p-10 text-center text-ink-400">
                  {q ? 'לא נמצאו תוצאות.' : 'עדיין אין נרשמים לאירוע.'}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-ink-100">
                  <table className="w-full text-sm">
                    <thead className="bg-ink-50 text-ink-500">
                      <tr>
                        {[
                          'שם מלא', 'גדוד', 'טלפון', 'מייל', 'בן/בת זוג',
                          ...(event.childrenEnabled ? ['ילדים'] : []),
                          'סיור', 'משתתפים', '',
                        ].map((h) => (
                          <th key={h} scope="col" className="px-3 py-2.5 text-right font-semibold whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-100">
                      {registrations.map((r) => (
                        <tr key={r._id} className="hover:bg-ink-50/50">
                          <td className="px-3 py-2.5 font-semibold text-ink whitespace-nowrap">
                            {[r.user?.profile?.firstName, r.user?.profile?.lastName].filter(Boolean).join(' ') || '—'}
                          </td>
                          <td className="px-3 py-2.5 text-ink-500 whitespace-nowrap">{r.user?.profile?.gedud || '—'}</td>
                          <td className="px-3 py-2.5 text-ink-500 whitespace-nowrap" dir="ltr">{r.user?.profile?.phone || '—'}</td>
                          <td className="px-3 py-2.5 text-ink-500" dir="ltr">{r.user?.email}</td>
                          <td className="px-3 py-2.5 text-ink-500">{r.hasSpouse ? r.spouseName || 'כן' : '—'}</td>
                          {event.childrenEnabled && (
                            <td className="px-3 py-2.5 text-ink-500">
                              {r.childrenAttending?.length ? r.childrenAttending.map((c) => c.name).join(', ') : '—'}
                            </td>
                          )}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            {r.tour ? (
                              <span className="chip-accent">
                                {r.tour.time}
                                {r.tour.forBoth ? ' · זוג' : ''}
                              </span>
                            ) : (
                              <span className="text-ink-300">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-ink-500">{r.seats}</td>
                          <td className="px-3 py-2.5">
                            <button
                              onClick={() => removeRegistration(r)}
                              aria-label="הסרת ההרשמה"
                              className="h-8 w-8 rounded-lg text-ink-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center"
                            >
                              <UserMinus className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      {broadcastOpen && (
        <BroadcastModal
          title={`שליחת מייל · ${event.title}`}
          audience={{
            type: 'event',
            event: event._id,
            segment,
            slotId: segment === 'slot' ? slotId : undefined,
          }}
          segmentPicker={
            <EventSegmentPicker
              event={event}
              stats={stats}
              segment={segment}
              slotId={slotId}
              onSegment={setSegment}
              onSlot={setSlotId}
            />
          }
          onClose={() => setBroadcastOpen(false)}
        />
      )}
    </motion.div>
  );
}

// Audience chooser shown at the top of the broadcast modal for an event.
function EventSegmentPicker({ event, stats, segment, slotId, onSegment, onSlot }) {
  const slots = stats?.slots || [];
  const options = [
    { value: 'registered', label: 'כל הנרשמים לאירוע' },
    ...(event.toursEnabled ? [{ value: 'tour', label: 'נרשמי הסיורים' }] : []),
    ...(event.toursEnabled && slots.length ? [{ value: 'slot', label: 'לפי שעת סיור' }] : []),
    { value: 'not_registered', label: 'טרם נרשמו' },
  ];

  return (
    <div className="space-y-3">
      <div>
        <label className="label" htmlFor="bc-segment">קהל היעד</label>
        <select
          id="bc-segment"
          className="input"
          value={segment}
          onChange={(e) => {
            onSegment(e.target.value);
            // Default to the first slot so the audience is never half-chosen.
            if (e.target.value === 'slot' && !slotId && slots[0]) onSlot(String(slots[0].slotId));
          }}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {segment === 'not_registered' && (
          <p className="mt-1 text-xs text-ink-400">
            מי שטרם ענה או שביטל הרשמה. מי שסימן במפורש ״לא מגיע״ לא ייכלל.
          </p>
        )}
      </div>

      {segment === 'slot' && (
        <div>
          <label className="label" htmlFor="bc-slot">שעת הסיור</label>
          <select id="bc-slot" className="input" value={slotId} onChange={(e) => onSlot(e.target.value)}>
            <option value="" disabled>בחרו שעה</option>
            {slots.map((sl) => (
              <option key={sl.slotId} value={sl.slotId}>
                {sl.tourTitle} · {sl.time} ({sl.registrations} נרשמים)
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [scope, setScope] = useState('');
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);

  const load = () => {
    setLoading(true);
    adminApi
      .get('/events', { params: { q: q || undefined, scope: scope || undefined } })
      .then(({ data }) => setEvents(data.events))
      .catch(() => toast.error('שגיאה בטעינת האירועים'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    adminApi.get('/organizations?limit=100').then(({ data }) => setOrgs(data.organizations || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [q, scope]);

  const remove = async (event) => {
    if (!window.confirm(`למחוק את "${event.title}"? כל ההרשמות לאירוע יימחקו לצמיתות.`)) return;
    try {
      await adminApi.delete(`/events/${event._id}`);
      toast.success('האירוע נמחק');
      setEvents((list) => list.filter((e) => e._id !== event._id));
    } catch {
      toast.error('שגיאה במחיקה');
    }
  };

  const copyLink = async (event) => {
    const url = `${window.location.origin}/e/${event.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('הקישור לדף הנחיתה הועתק');
    } catch {
      toast(url);
    }
  };

  const upsert = (saved) =>
    setEvents((list) => {
      const withStats = { stats: EMPTY_STATS, ...saved };
      const exists = list.some((e) => e._id === withStats._id);
      return exists
        ? list.map((e) => (e._id === withStats._id ? { ...e, ...withStats } : e))
        : [withStats, ...list];
    });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">אירועים</h1>
          <p className="text-sm text-ink-500 mt-0.5">יצירת אירועים, ניהול סיורים וייצוא רשימות הנרשמים.</p>
        </div>
        <button onClick={() => setEditing({})} className="btn-primary mr-auto">
          <Plus className="h-4 w-4" />
          אירוע חדש
        </button>
      </header>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input
            className="input pr-10"
            placeholder="חיפוש אירוע…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="חיפוש אירוע"
          />
        </div>
        <select className="input w-auto" value={scope} onChange={(e) => setScope(e.target.value)} aria-label="סינון לפי מועד">
          <option value="">כל האירועים</option>
          <option value="upcoming">קרובים</option>
          <option value="past">שהיו</option>
        </select>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="card p-12 text-center">
          <CalendarDays className="h-10 w-10 text-ink-300 mx-auto" />
          <p className="mt-3 text-ink-400">אין אירועים עדיין. צרו את האירוע הראשון.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event._id} className="card p-4 flex flex-col sm:flex-row gap-4">
              <div className="h-24 w-full sm:w-36 shrink-0 rounded-xl overflow-hidden bg-ink-100">
                {event.imageUrl ? (
                  <img src={event.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-bl from-ink to-ink-700" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-ink">{event.title}</h3>
                  {event.toursEnabled && (
                    <span className="chip !bg-muted-100 !text-muted-700">
                      <Compass className="h-3 w-3" />
                      {event.tours?.length || 0} סיורים
                    </span>
                  )}
                  {!event.organization && <span className="chip">כל הארגונים</span>}
                  {event.organization && <span className="chip">{event.organization.name}</span>}
                  {event.autoPopup && <span className="chip !bg-accent-50 !text-accent-700">פופאפ פעיל</span>}
                </div>

                <p className="mt-1 text-xs text-ink-400 flex flex-wrap gap-x-3 gap-y-1">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatEventDateShort(event.date)}
                  </span>
                  {(event.startTime || event.endTime) && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {[event.startTime, event.endTime].filter(Boolean).join(' – ')}
                    </span>
                  )}
                  {event.location && <span>{event.location}</span>}
                </p>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span className="text-ink-600">
                    <strong className="text-ink">{event.stats?.registrations ?? 0}</strong> נרשמים
                  </span>
                  <span className="text-ink-600">
                    <strong className="text-ink">{event.stats?.attendees ?? 0}</strong> משתתפים
                  </span>
                  <span className="text-ink-600">
                    <strong className="text-ink">{event.stats?.spouses ?? 0}</strong> בני/בנות זוג
                  </span>
                  {event.childrenEnabled && (
                    <span className="text-ink-600">
                      <strong className="text-ink">{event.stats?.children ?? 0}</strong> ילדים
                    </span>
                  )}
                  {event.toursEnabled && (
                    <span className="text-ink-600">
                      <strong className="text-ink">{event.stats?.tourRegistrations ?? 0}</strong> בסיורים
                    </span>
                  )}
                  {event.capacity > 0 && (
                    <span className="text-ink-400">
                      קיבולת {event.seatsTaken ?? 0}/{event.capacity}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex sm:flex-col gap-1.5 shrink-0">
                <button onClick={() => setViewing(event)} className="btn-primary !py-2 !px-3 text-xs whitespace-nowrap">
                  <Users className="h-3.5 w-3.5" />
                  נרשמים וייצוא
                </button>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setEditing(event)}
                    title="עריכה"
                    aria-label="עריכת האירוע"
                    className="h-9 w-9 rounded-xl border border-ink-200 text-ink-500 hover:bg-ink-50 flex items-center justify-center"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => copyLink(event)}
                    title="העתקת קישור לדף הנחיתה"
                    aria-label="העתקת קישור לדף הנחיתה"
                    className="h-9 w-9 rounded-xl border border-ink-200 text-ink-500 hover:bg-ink-50 flex items-center justify-center"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <a
                    href={`/e/${event.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="פתיחת דף הנחיתה"
                    aria-label="פתיחת דף הנחיתה"
                    className="h-9 w-9 rounded-xl border border-ink-200 text-ink-500 hover:bg-ink-50 flex items-center justify-center"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => remove(event)}
                    title="מחיקה"
                    aria-label="מחיקת האירוע"
                    className="h-9 w-9 rounded-xl border border-ink-200 text-red-500 hover:bg-red-50 flex items-center justify-center"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="flex items-start gap-2 text-xs text-ink-400">
        <AlertCircle className="h-4 w-4 shrink-0 mt-px" />
        <span>
          דף הנחיתה של כל אירוע פתוח לכולם — לחצו על אייקון ההעתקה כדי לקבל את הקישור לשיתוף. ההרשמה עצמה מחייבת
          כניסה לחברותא186.
        </span>
      </p>

      <AnimatePresence>
        {editing && (
          <EventModal
            key={editing._id || 'new'}
            initial={editing._id ? editing : null}
            orgs={orgs}
            onClose={() => setEditing(null)}
            onSaved={upsert}
          />
        )}
        {viewing && (
          <RegistrationsModal key={viewing._id} event={viewing} onClose={() => setViewing(null)} onChanged={load} />
        )}
      </AnimatePresence>
    </div>
  );
}
