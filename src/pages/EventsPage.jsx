import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  CalendarDays, Clock, MapPin, Check, Compass, Users, ArrowLeft, Link2, CalendarX2,
} from 'lucide-react';
import api from '../api/client';
import { SkeletonGrid } from '../components/skeletons/Skeletons.jsx';
import EventRegistrationModal from '../components/events/EventRegistrationModal.jsx';
import { formatEventDate, formatEventHours, countdownLabel } from '../utils/eventDate.js';

function StatusBadge({ event }) {
  const reg = event.myRegistration;
  if (reg?.status === 'registered') {
    return (
      <span className="chip !bg-olive-100 !text-olive-800">
        <Check className="h-3.5 w-3.5" />
        רשומים
      </span>
    );
  }
  if (event.isPast) return <span className="chip">הסתיים</span>;
  if (event.isRegistrationClosed) return <span className="chip">ההרשמה סגורה</span>;
  if (event.isFull) return <span className="chip !bg-accent-50 !text-accent-700">מלא</span>;
  const countdown = countdownLabel(event.date);
  return countdown ? <span className="chip-accent">{countdown}</span> : null;
}

function EventCard({ event, onOpen, index }) {
  const reg = event.myRegistration;
  const tour = reg?.status === 'registered' ? reg.tour : null;

  const copyLink = async (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/e/${event.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('הקישור לדף האירוע הועתק');
    } catch {
      toast.error('לא הצלחנו להעתיק — הקישור: ' + url);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 5) * 0.05 }}
      className="card overflow-hidden flex flex-col"
    >
      <button onClick={() => onOpen(event)} className="text-right group" aria-label={`פתיחת ${event.title}`}>
        <div className="relative h-36 w-full overflow-hidden bg-ink-100">
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt=""
              className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-bl from-ink to-ink-700" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
          <div className="absolute top-3 right-3">
            <StatusBadge event={event} />
          </div>
        </div>

        <div className="p-5">
          <h3 className="font-bold text-ink leading-snug line-clamp-2">{event.title}</h3>
          {event.summary && <p className="mt-1.5 text-sm text-ink-500 line-clamp-2">{event.summary}</p>}

          <dl className="mt-3 space-y-1.5 text-xs text-ink-500">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-accent shrink-0" />
              {formatEventDate(event.date)}
            </div>
            {formatEventHours(event) && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-accent shrink-0" />
                {formatEventHours(event)}
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-accent shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
          </dl>

          {reg?.status === 'registered' && (
            <div className="mt-3 rounded-xl bg-olive-50 border border-olive-100 p-3 text-xs text-olive-900 space-y-1">
              {reg.hasSpouse && (
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  מגיעים עם {reg.spouseName}
                </div>
              )}
              {tour && (
                <div className="flex items-center gap-1.5">
                  <Compass className="h-3.5 w-3.5" />
                  {tour.tourTitle} · {tour.time}
                  {tour.forBoth ? ' (לשניכם)' : ''}
                </div>
              )}
              {!reg.hasSpouse && !tour && <span>ההשתתפות שלך מאושרת</span>}
            </div>
          )}
        </div>
      </button>

      <div className="mt-auto flex items-center gap-2 border-t border-ink-100 p-3">
        <button onClick={() => onOpen(event)} className="btn-primary flex-1 !py-2 text-sm">
          {reg?.status === 'registered'
            ? 'צפייה ועריכה'
            : event.isPast || event.isRegistrationClosed
              ? 'פרטי האירוע'
              : 'הרשמה לאירוע'}
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={copyLink}
          title="העתקת קישור לדף האירוע"
          aria-label="העתקת קישור לדף האירוע"
          className="h-9 w-9 rounded-xl border border-ink-200 text-ink-400 hover:text-ink hover:bg-ink-50 flex items-center justify-center transition"
        >
          <Link2 className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedId = searchParams.get('event');

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/events')
      .then(({ data }) => !cancelled && setEvents(data.events))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Deep link from the landing page or a confirmation email.
  useEffect(() => {
    if (!requestedId || loading) return;
    const match = events.find((e) => String(e._id) === requestedId);
    if (match) setSelected(match);
    setSearchParams({}, { replace: true });
  }, [requestedId, loading, events, setSearchParams]);

  const { upcoming, past } = useMemo(
    () => ({
      upcoming: events.filter((e) => !e.isPast),
      past: events.filter((e) => e.isPast),
    }),
    [events]
  );
  const shown = tab === 'upcoming' ? upcoming : past;

  const handleSaved = (updated) => {
    setEvents((list) => list.map((e) => (String(e._id) === String(updated._id) ? { ...e, ...updated } : e)));
    setSelected((cur) => (cur && String(cur._id) === String(updated._id) ? { ...cur, ...updated } : cur));
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-ink">אירועים 186</h1>
        <p className="text-sm text-ink-500 mt-1">
          עצרות, ערבי גדוד ומפגשי חטיבה — הרשמה מהירה עם הפרטים ששמורים בפרופיל שלך.
        </p>
      </header>

      <div className="flex gap-1 rounded-xl bg-ink-50 p-1 w-fit">
        {[
          { key: 'upcoming', label: `קרובים (${upcoming.length})` },
          { key: 'past', label: `שהיו (${past.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === t.key ? 'bg-white text-ink shadow-soft' : 'text-ink-400 hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonGrid count={3} />
      ) : shown.length === 0 ? (
        <div className="card p-12 text-center">
          <CalendarX2 className="h-10 w-10 text-ink-300 mx-auto" />
          <p className="mt-3 text-ink-400">
            {tab === 'upcoming' ? 'אין כרגע אירועים קרובים. נעדכן אתכם ברגע שיפורסם אירוע חדש.' : 'עדיין אין אירועים בארכיון.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shown.map((event, i) => (
            <EventCard key={event._id} event={event} index={i} onOpen={setSelected} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <EventRegistrationModal
            key={selected._id}
            event={selected}
            onClose={() => setSelected(null)}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
