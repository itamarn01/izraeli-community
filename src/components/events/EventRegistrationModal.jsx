import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  X, CalendarDays, Clock, MapPin, Check, Loader2, Users, Compass, Baby,
  CalendarPlus, Download, PartyPopper, AlertCircle, Trash2, Pencil,
} from 'lucide-react';
import api from '../../api/client';
import { formatEventDate, formatEventHours, googleCalendarUrl, icsUrl } from '../../utils/eventDate.js';

// Yes/no pair used for the spouse and tour questions.
function ChoicePair({ name, value, onChange, yesLabel = 'כן', noLabel = 'לא' }) {
  const opt = (val, label) => {
    const active = value === val;
    return (
      <button
        key={label}
        type="button"
        role="radio"
        aria-checked={active}
        onClick={() => onChange(val)}
        className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-accent-300 ${
          active
            ? 'border-accent bg-accent-50 text-accent-700 shadow-soft'
            : 'border-ink-200 bg-white text-ink-500 hover:border-ink-300'
        }`}
      >
        <span className="inline-flex items-center gap-2">
          <span
            className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
              active ? 'border-accent' : 'border-ink-300'
            }`}
          >
            {active && <span className="h-2 w-2 rounded-full bg-accent" />}
          </span>
          {label}
        </span>
      </button>
    );
  };
  return (
    <div role="radiogroup" aria-label={name} className="flex gap-3">
      {opt(true, yesLabel)}
      {opt(false, noLabel)}
    </div>
  );
}

function Section({ title, children, icon: Icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border border-ink-100 bg-ink-50/40 p-4"
    >
      <h3 className="flex items-center gap-2 text-sm font-bold text-ink mb-3">
        {Icon && <Icon className="h-4 w-4 text-accent" />}
        {title}
      </h3>
      {children}
    </motion.div>
  );
}

function SlotButton({ slot, selected, needed, onSelect }) {
  // A slot with room for one is still unusable when two seats are needed.
  const tooSmall = !slot.isFull && slot.seatsLeft < needed;
  const disabled = slot.isFull || tooSmall;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={() => onSelect(slot)}
      className={`rounded-xl border px-3 py-3 text-center transition focus:outline-none focus:ring-2 focus:ring-accent-300 ${
        selected
          ? 'border-accent bg-accent-50 shadow-soft'
          : disabled
            ? 'border-ink-100 bg-ink-50 opacity-60 cursor-not-allowed'
            : 'border-ink-200 bg-white hover:border-accent-300'
      }`}
    >
      <div className={`text-base font-bold ${selected ? 'text-accent-700' : 'text-ink'}`}>{slot.time}</div>
      <div className="mt-0.5 text-[11px] font-medium">
        {slot.isFull ? (
          <span className="text-ink-400">מלא</span>
        ) : tooSmall ? (
          <span className="text-ink-400">נותר מקום אחד</span>
        ) : (
          <span className="text-olive-600">נותרו {slot.seatsLeft} מקומות</span>
        )}
      </div>
    </button>
  );
}

/**
 * The registration popup. Sections appear as the member answers, per the
 * brigade spec: attendance → spouse → tour → confirmation.
 *
 * @param {object}   event     serialized event (with myRegistration)
 * @param {function} onClose
 * @param {function} onSaved   receives the updated event
 * @param {boolean}  autoOpened  true when the popup opened by itself on login
 */
export default function EventRegistrationModal({ event: initialEvent, onClose, onSaved, autoOpened = false }) {
  const [event, setEvent] = useState(initialEvent);
  const registration = event.myRegistration?.status === 'registered' ? event.myRegistration : null;

  // Someone already registered lands on their summary; everyone else on the form.
  const [mode, setMode] = useState(registration ? 'summary' : 'form');
  const [saving, setSaving] = useState(false);
  const [attending, setAttending] = useState(Boolean(registration));
  const [hasSpouse, setHasSpouse] = useState(registration?.hasSpouse ?? null);
  const [spouseName, setSpouseName] = useState(registration?.spouseName || '');
  const [wantsChildren, setWantsChildren] = useState(
    registration ? Boolean(registration.childrenAttending?.length) : null
  );
  const [childrenIds, setChildrenIds] = useState(
    (registration?.childrenAttending || []).map((c) => String(c.childId))
  );
  const [wantsTour, setWantsTour] = useState(registration ? Boolean(registration.tour) : null);
  const [selected, setSelected] = useState(
    registration?.tour ? { tourId: registration.tour.tourId, slotId: registration.tour.slotId } : null
  );
  const [tourForBoth, setTourForBoth] = useState(registration?.tour?.forBoth ?? true);
  const [error, setError] = useState('');

  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const titleId = `event-modal-${event._id}`;

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const tours = event.tours || [];
  const hasTours = event.toursEnabled && tours.some((t) => t.slots?.length);
  const seatsNeeded = hasSpouse && tourForBoth ? 2 : 1;

  const selectedSlot = useMemo(() => {
    if (!selected) return null;
    const tour = tours.find((t) => String(t._id) === String(selected.tourId));
    const slot = tour?.slots.find((s) => String(s._id) === String(selected.slotId));
    return slot ? { ...slot, tourTitle: tour.title, tourId: tour._id } : null;
  }, [selected, tours]);

  // A pair no longer fits in the slot the member picked while alone.
  const slotTooSmall = Boolean(
    selectedSlot &&
      seatsNeeded > 1 &&
      selectedSlot.seatsLeft < seatsNeeded &&
      String(selectedSlot._id) !== String(registration?.tour?.slotId)
  );

  const eligibleChildren = event.eligibleChildren || [];
  const hasChildrenQuestion = Boolean(event.childrenEnabled && eligibleChildren.length);

  const spouseAnswered = !event.allowSpouse || hasSpouse !== null;
  const spouseValid = !hasSpouse || spouseName.trim().length >= 2;
  const childrenAnswered = !hasChildrenQuestion || wantsChildren !== null;
  const childrenValid = !wantsChildren || childrenIds.length > 0;
  const tourAnswered = !hasTours || wantsTour !== null;
  const tourValid = !wantsTour || Boolean(selected);
  const canSubmit =
    attending && spouseAnswered && spouseValid && childrenAnswered && childrenValid &&
    tourAnswered && tourValid && !slotTooSmall;

  const toggleChild = (id) =>
    setChildrenIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const submit = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        hasSpouse: Boolean(hasSpouse),
        spouseName: hasSpouse ? spouseName.trim() : '',
        childrenIds: wantsChildren ? childrenIds : [],
        tourId: wantsTour && selected ? selected.tourId : null,
        slotId: wantsTour && selected ? selected.slotId : null,
        tourForBoth: Boolean(hasSpouse && wantsTour && tourForBoth),
      };
      const method = registration ? 'patch' : 'post';
      const { data } = await api[method](`/events/${event._id}/register`, payload);
      setEvent(data.event);
      onSaved?.(data.event);
      setMode('done');
    } catch (err) {
      const message = err?.response?.data?.message || 'שגיאה בשמירת ההרשמה';
      setError(message);
      // A slot that filled up mid-flow: refresh so the grid shows reality.
      if (err?.response?.status === 409) {
        api.get(`/events/${event._id}`).then(({ data }) => setEvent(data.event)).catch(() => {});
      }
    } finally {
      setSaving(false);
    }
  };

  const decline = async () => {
    setSaving(true);
    try {
      await api.post(`/events/${event._id}/decline`);
      toast('סימנו שאינך מגיע/ה. תמיד אפשר להירשם מאוחר יותר מלשונית האירועים.', { icon: '👍' });
      onSaved?.({ ...event, myRegistration: { status: 'declined' } });
      onClose();
    } catch {
      toast.error('שגיאה — נסו שוב');
    } finally {
      setSaving(false);
    }
  };

  const cancelRegistration = async () => {
    if (!window.confirm('לבטל את ההשתתפות באירוע? המקום שלך (וגם מקום הסיור) ישוחררו.')) return;
    setSaving(true);
    try {
      const { data } = await api.delete(`/events/${event._id}/register`);
      onSaved?.(data.event);
      toast.success('ההשתתפות בוטלה');
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה בביטול ההרשמה');
    } finally {
      setSaving(false);
    }
  };

  const currentTour = event.myRegistration?.tour;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-surface shadow-card"
        dir="rtl"
      >
        {/* Hero */}
        <div className="relative">
          {event.imageUrl ? (
            <img src={event.imageUrl} alt="" className="h-40 w-full object-cover" />
          ) : (
            <div className="h-28 w-full bg-gradient-to-bl from-ink to-ink-700" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent" />
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="סגירה"
            className="absolute top-3 left-3 h-9 w-9 rounded-full bg-white/90 text-ink flex items-center justify-center hover:bg-white focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <X className="h-4.5 w-4.5" />
          </button>
          <div className="absolute bottom-0 inset-x-0 p-5">
            <h2 id={titleId} className="text-xl font-bold text-white leading-tight">
              {event.title}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/85">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatEventDate(event.date)}
              </span>
              {formatEventHours(event) && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {formatEventHours(event)}
                </span>
              )}
              {event.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {event.location}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {mode === 'done' && (
            <ConfirmationPanel
              event={event}
              onEdit={() => setMode('form')}
              onClose={onClose}
            />
          )}

          {mode === 'summary' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-olive-200 bg-olive-50 p-4">
                <div className="flex items-center gap-2 font-bold text-olive-800">
                  <Check className="h-4.5 w-4.5" />
                  אתם רשומים לאירוע
                </div>
                <dl className="mt-3 space-y-1.5 text-sm text-ink-600">
                  <SummaryRow label="בן/בת זוג" value={event.myRegistration.hasSpouse ? event.myRegistration.spouseName : 'לא'} />
                  {event.childrenEnabled && (
                    <SummaryRow label="ילדים" value={childrenSummary(event.myRegistration)} />
                  )}
                  {event.toursEnabled && (
                    <SummaryRow
                      label="סיור"
                      value={
                        currentTour
                          ? `${currentTour.tourTitle} · ${currentTour.time}${currentTour.forBoth ? ' (לשניכם)' : ''}`
                          : 'לא נרשמתם לסיור'
                      }
                    />
                  )}
                </dl>
              </div>

              <CalendarButtons event={event} tour={currentTour} />

              <div className="flex flex-wrap gap-2 pt-1">
                <button onClick={() => setMode('form')} className="btn-primary flex-1">
                  <Pencil className="h-4 w-4" />
                  עריכת ההרשמה
                </button>
                <button onClick={cancelRegistration} disabled={saving} className="btn-outline !text-red-600 !border-red-200 hover:!bg-red-50">
                  <Trash2 className="h-4 w-4" />
                  ביטול השתתפות
                </button>
              </div>
            </div>
          )}

          {mode === 'form' && (
            <>
              {event.summary && <p className="text-sm text-ink-500 leading-relaxed">{event.summary}</p>}

              {/* 1 — attendance */}
              <button
                type="button"
                role="checkbox"
                aria-checked={attending}
                onClick={() => setAttending((a) => !a)}
                className={`w-full rounded-2xl border-2 p-4 text-right transition focus:outline-none focus:ring-2 focus:ring-accent-300 ${
                  attending ? 'border-accent bg-accent-50' : 'border-ink-200 bg-white hover:border-accent-300'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 ${
                      attending ? 'bg-accent text-white' : 'border-2 border-ink-300'
                    }`}
                  >
                    {attending && <Check className="h-4 w-4" />}
                  </span>
                  <span>
                    <span className="block font-bold text-ink">אני מגיע/ה לאירוע</span>
                    <span className="block text-xs text-ink-500 mt-0.5">
                      הפרטים שלך כבר שמורים בפרופיל — אין צורך למלא אותם שוב.
                    </span>
                  </span>
                </span>
              </button>

              {attending && event.allowSpouse && (
                <Section title="האם יגיע איתך בן/בת זוג?" icon={Users}>
                  <ChoicePair
                    name="בן/בת זוג"
                    value={hasSpouse}
                    onChange={(v) => {
                      setHasSpouse(v);
                      if (!v) setSpouseName('');
                    }}
                  />
                  {hasSpouse && (
                    <div className="mt-3">
                      <label className="label" htmlFor="spouseName">
                        שם בן/בת הזוג
                      </label>
                      <input
                        id="spouseName"
                        className="input"
                        value={spouseName}
                        onChange={(e) => setSpouseName(e.target.value)}
                        placeholder="שם מלא"
                        autoComplete="off"
                      />
                    </div>
                  )}
                </Section>
              )}

              {attending && hasChildrenQuestion && spouseAnswered && (
                <Section title="האם יגיעו איתך ילדים לאירוע?" icon={Baby}>
                  <ChoicePair
                    name="הגעת ילדים"
                    value={wantsChildren}
                    onChange={(v) => {
                      setWantsChildren(v);
                      if (!v) setChildrenIds([]);
                    }}
                  />
                  {wantsChildren && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold text-ink-600">אילו מהילדים מגיעים?</p>
                      {eligibleChildren.map((child) => {
                        const checked = childrenIds.includes(String(child._id));
                        return (
                          <button
                            key={child._id}
                            type="button"
                            role="checkbox"
                            aria-checked={checked}
                            onClick={() => toggleChild(String(child._id))}
                            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm text-right transition focus:outline-none focus:ring-2 focus:ring-accent-300 ${
                              checked ? 'border-accent bg-accent-50 text-accent-700' : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300'
                            }`}
                          >
                            <span
                              className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 ${
                                checked ? 'bg-accent text-white' : 'border-2 border-ink-300'
                              }`}
                            >
                              {checked && <Check className="h-3.5 w-3.5" />}
                            </span>
                            <span className="font-semibold">{child.name}</span>
                          </button>
                        );
                      })}
                      {wantsChildren && childrenIds.length === 0 && (
                        <p className="flex items-start gap-2 text-xs text-red-600">
                          <AlertCircle className="h-4 w-4 shrink-0 mt-px" />
                          יש לבחור לפחות ילד/ה אחד/ת, או לסמן שלא.
                        </p>
                      )}
                    </div>
                  )}
                </Section>
              )}

              {attending && hasTours && spouseAnswered && (
                <Section title={tours[0].description || `האם תרצו להצטרף ל${tours.length > 1 ? 'אחד הסיורים' : tours[0].title} לפני תחילת האירוע?`} icon={Compass}>
                  <ChoicePair
                    name="הרשמה לסיור"
                    value={wantsTour}
                    onChange={(v) => {
                      setWantsTour(v);
                      if (!v) setSelected(null);
                    }}
                  />

                  {wantsTour && (
                    <div className="mt-4 space-y-4">
                      {hasSpouse && (
                        <div>
                          <p className="text-xs font-semibold text-ink-600 mb-2">ההרשמה לסיור היא עבור:</p>
                          <ChoicePair
                            name="מי משתתף בסיור"
                            value={tourForBoth}
                            onChange={setTourForBoth}
                            yesLabel="שנינו"
                            noLabel="החייל/ת בלבד"
                          />
                        </div>
                      )}

                      {tours.map((tour) => (
                        <div key={tour._id}>
                          {tours.length > 1 && (
                            <p className="text-xs font-bold text-ink-600 mb-2">{tour.title}</p>
                          )}
                          <div
                            role="radiogroup"
                            aria-label={`שעות ${tour.title}`}
                            className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                          >
                            {tour.slots.map((slot) => (
                              <SlotButton
                                key={slot._id}
                                slot={slot}
                                needed={seatsNeeded}
                                selected={String(selected?.slotId) === String(slot._id)}
                                onSelect={(s) => setSelected({ tourId: tour._id, slotId: s._id })}
                              />
                            ))}
                          </div>
                        </div>
                      ))}

                      {slotTooSmall && (
                        <p className="flex items-start gap-2 text-xs text-red-600">
                          <AlertCircle className="h-4 w-4 shrink-0 mt-px" />
                          בשעה שנבחרה לא נותרו שני מקומות. בחרו שעה אחרת או סמנו שהסיור לחייל/ת בלבד.
                        </p>
                      )}
                    </div>
                  )}
                </Section>
              )}

              {error && (
                <p className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  {error}
                </p>
              )}

              {event.isFull && !registration && (
                <p className="rounded-xl bg-ink-50 border border-ink-200 p-3 text-sm text-ink-600">
                  האירוע מלא. אפשר לפנות למטה החטיבה לבירור זמינות.
                </p>
              )}

              <div className="flex flex-col gap-2 pt-1">
                <button onClick={submit} disabled={!canSubmit || saving} className="btn-primary w-full">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {registration ? 'עדכון ההרשמה' : 'אישור ההרשמה'}
                </button>

                {registration ? (
                  <button onClick={() => setMode('summary')} className="btn-ghost w-full text-sm">
                    חזרה
                  </button>
                ) : (
                  <button onClick={decline} disabled={saving} className="btn-ghost w-full text-sm text-ink-400">
                    {autoOpened ? 'לא מעוניין/ת כרגע' : 'סגירה'}
                  </button>
                )}
              </div>

              {event.seatsLeft !== null && event.seatsLeft <= 20 && !registration && (
                <p className="text-center text-xs text-accent-700 font-semibold">
                  נותרו {event.seatsLeft} מקומות לאירוע
                </p>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function childrenSummary(reg) {
  if (!reg?.childrenAttending?.length) return 'לא';
  return reg.childrenAttending.map((c) => c.name).join(', ');
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-start gap-2">
      <dt className="text-ink-400 shrink-0 w-24">{label}</dt>
      <dd className="font-semibold text-ink">{value}</dd>
    </div>
  );
}

function CalendarButtons({ event, tour }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <a
        href={googleCalendarUrl(event, tour)}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-outline text-xs sm:text-sm"
      >
        <CalendarPlus className="h-4 w-4" />
        יומן Google
      </a>
      <a href={icsUrl(event, tour)} className="btn-outline text-xs sm:text-sm">
        <Download className="h-4 w-4" />
        Apple / Outlook
      </a>
    </div>
  );
}

function ConfirmationPanel({ event, onEdit, onClose }) {
  const reg = event.myRegistration;
  const tour = reg?.tour;

  return (
    <div className="space-y-4 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 14 }}
        className="mx-auto h-16 w-16 rounded-2xl bg-olive-100 text-olive-700 flex items-center justify-center"
      >
        <PartyPopper className="h-8 w-8" />
      </motion.div>

      <div>
        <h3 className="text-lg font-bold text-ink">ההרשמה אושרה!</h3>
        <p className="text-sm text-ink-500 mt-1">שלחנו לך מייל אישור עם כל הפרטים.</p>
      </div>

      <dl className="rounded-2xl border border-ink-100 bg-ink-50/50 p-4 text-right space-y-2 text-sm">
        <SummaryRow label="אירוע" value={event.title} />
        <SummaryRow label="תאריך" value={formatEventDate(event.date)} />
        {formatEventHours(event) && <SummaryRow label="שעות" value={formatEventHours(event)} />}
        <SummaryRow label="בן/בת זוג" value={reg?.hasSpouse ? reg.spouseName : 'לא'} />
        {event.childrenEnabled && <SummaryRow label="ילדים" value={childrenSummary(reg)} />}
        {event.toursEnabled && (
          <SummaryRow
            label="סיור"
            value={tour ? `${tour.tourTitle} · ${tour.time}${tour.forBoth ? ' (לשניכם)' : ''}` : 'לא נרשמתם לסיור'}
          />
        )}
      </dl>

      <CalendarButtons event={event} tour={tour} />

      <div className="flex gap-2">
        <button onClick={onEdit} className="btn-outline flex-1">
          עריכת ההרשמה
        </button>
        <button onClick={onClose} className="btn-primary flex-1">
          סיום
        </button>
      </div>
    </div>
  );
}
