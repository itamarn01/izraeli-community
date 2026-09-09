import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CalendarDays, Clock, MapPin, ArrowLeft, Users, ShieldCheck, ExternalLink, CalendarX2,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from '../components/common/Logo.jsx';
import { setPendingEvent } from '../components/events/EventPopupGate.jsx';
import { formatEventDate, formatEventHours, countdownLabel } from '../utils/eventDate.js';

function InfoTile({ icon: Icon, label, value, href }) {
  if (!value) return null;
  const body = (
    <>
      <div className="h-10 w-10 rounded-xl bg-accent-50 text-accent-700 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-ink-400">{label}</div>
        <div className="font-bold text-ink leading-snug break-words">{value}</div>
      </div>
    </>
  );
  const className = 'card p-4 flex items-center gap-3';
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${className} hover:shadow-soft transition`}>
      {body}
      <ExternalLink className="h-3.5 w-3.5 text-ink-300 mr-auto shrink-0" />
    </a>
  ) : (
    <div className={className}>{body}</div>
  );
}

// Public, shareable landing page for a single event. Anyone can read it; only
// members of חברותא186 can register, so the CTA routes through login/join.
export default function EventLandingPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/events/public/${encodeURIComponent(slug)}`)
      .then(({ data }) => !cancelled && setEvent(data.event))
      .catch(() => !cancelled && setNotFound(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const startRegistration = (target) => {
    setPendingEvent(event._id);
    navigate(target);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-canvas">
        <div className="mx-auto max-w-4xl px-4 py-10 space-y-4">
          <div className="skeleton h-64 rounded-2xl" />
          <div className="skeleton h-8 w-2/3 rounded-lg" />
          <div className="skeleton h-4 w-1/2 rounded-lg" />
        </div>
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6 text-center">
        <CalendarX2 className="h-12 w-12 text-ink-300" />
        <h1 className="mt-4 text-2xl font-bold text-ink">האירוע לא נמצא</h1>
        <p className="mt-2 text-ink-500">ייתכן שהקישור שגוי או שהאירוע הוסר.</p>
        <Link to="/" className="btn-primary mt-6">
          חזרה לדף הבית
        </Link>
      </div>
    );
  }

  const closed = event.isRegistrationClosed || event.isPast;
  const countdown = countdownLabel(event.date);

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-ink-100 bg-white/80 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo />
          {user ? (
            <Link to="/app/events" className="btn-primary px-3 py-2 text-[13px] sm:text-sm">
              לאזור האישי
            </Link>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link to="/login" className="px-3 py-2 text-sm font-semibold text-ink hover:bg-ink-50 rounded-xl transition-colors">
                כניסה
              </Link>
              <Link to="/join" className="btn-primary px-3 py-2 text-[13px] sm:text-sm whitespace-nowrap">
                הצטרפות
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {event.imageUrl ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url("${event.imageUrl}")` }}
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/55" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-bl from-ink via-ink-700 to-ink" />
        )}

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 py-14 sm:py-20">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip-accent">
                <ShieldCheck className="h-3.5 w-3.5" />
                אירוע חטיבתי
              </span>
              {countdown && !closed && (
                <span className="chip !bg-white/15 !text-white">{countdown}</span>
              )}
              {closed && <span className="chip !bg-white/15 !text-white">ההרשמה סגורה</span>}
            </div>

            <h1 className="mt-4 brand-display text-3xl sm:text-5xl text-white leading-tight drop-shadow-lg">
              {event.title}
            </h1>
            {event.summary && (
              <p className="mt-4 max-w-2xl text-white/85 text-base sm:text-lg leading-relaxed drop-shadow">
                {event.summary}
              </p>
            )}

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              {closed ? (
                <div className="rounded-xl bg-white/10 border border-white/20 px-5 py-3 text-white text-sm">
                  {event.isPast ? 'האירוע הסתיים.' : 'ההרשמה לאירוע נסגרה.'}
                </div>
              ) : user ? (
                <button onClick={() => startRegistration(`/app/events?event=${event._id}`)} className="btn-primary w-full sm:w-auto">
                  {event.myRegistration?.status === 'registered' ? 'צפייה בהרשמה שלי' : 'אני מגיע/ה לאירוע'}
                  <ArrowLeft className="h-4 w-4" />
                </button>
              ) : (
                <>
                  <button onClick={() => startRegistration('/join')} className="btn-primary w-full sm:w-auto">
                   הרשמה לאירוע למשתמשים חדשים
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => startRegistration('/login')}
                    className="btn-outline w-full sm:w-auto !bg-white/5 !border-white/25 !text-white hover:!bg-white/15"
                  >
                   הרשמה לאירוע למשתמשים קיימים 
                  </button>
                </>
              )}
            </div>

            {!user && !closed && (
              <p className="mt-3 text-xs text-white/70 max-w-md">
                ההרשמה מתבצעת דרך חברותא 186. אם עדיין אינך רשום/ה — ההצטרפות מהירה, ומיד לאחריה תועבר/י להרשמה לאירוע.
              </p>
            )}
          </motion.div>
        </div>
      </section>

      <main id="main-content" className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-8">
        <div className="grid sm:grid-cols-3 gap-3">
          <InfoTile icon={CalendarDays} label="תאריך" value={formatEventDate(event.date)} />
          <InfoTile icon={Clock} label="שעות" value={formatEventHours(event)} />
          <InfoTile icon={MapPin} label="מיקום" value={event.location} href={event.locationUrl} />
        </div>

        {event.descriptionHtml && (
          <section className="card p-6">
            <h2 className="text-lg font-bold text-ink mb-3">פרטי האירוע</h2>
            <div
              dir="rtl"
              className="form-doc-body text-[15px] text-ink-600"
              dangerouslySetInnerHTML={{ __html: event.descriptionHtml }}
            />
          </section>
        )}

        <section className="card p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <Users className="h-5 w-5 text-accent" />
            איך נרשמים?
          </h2>
          <ol className="mt-4 space-y-3">
            {[
              'כניסה או הצטרפות לחברותא 186 — הפרטים שלך נשמרים בפרופיל.',
              'סימון "אני מגיע/ה" בחלון ההרשמה שייפתח.',
              event.allowSpouse ? 'ציון שם בן/בת הזוג, אם מגיעים יחד.' : null,
              event.childrenEnabled ? 'בחירת אילו מהילדים מגיעים, מתוך הפרופיל.' : null,
              event.toursEnabled ? 'בחירת שעה לסיור, אם רוצים להצטרף.' : null,
            ].filter(Boolean).map((step, i) => (
              <li key={step} className="flex gap-3 text-sm text-ink-600">
                <span className="h-6 w-6 shrink-0 rounded-full bg-accent-50 text-accent-700 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {!closed && (
          <section className="rounded-2xl bg-gradient-to-bl from-ink to-ink-700 text-white p-7 text-center relative overflow-hidden">
            <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-accent/30 blur-3xl" aria-hidden="true" />
            <div className="relative">
              <h2 className="brand-display text-2xl">נתראה באירוע?</h2>
              <p className="mt-2 text-white/75 text-sm">
                {event.seatsLeft !== null ? `נותרו ${event.seatsLeft} מקומות.` : 'ההרשמה פתוחה.'}
              </p>
              <div className="mt-5 flex flex-col sm:flex-row justify-center gap-2">
                <button
                  onClick={() => startRegistration(user ? `/app/events?event=${event._id}` : '/join')}
                  className="btn-primary"
                >
                  {user ? 'להרשמה' : 'הצטרפות והרשמה'}
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-ink-100 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size={32} />
          <p className="text-xs text-ink-400">© חברותא — קהילת הלוחמים. כל הזכויות שמורות.</p>
        </div>
      </footer>
    </div>
  );
}
