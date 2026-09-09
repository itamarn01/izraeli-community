// Events are stored as a wall-clock date ('YYYY-MM-DD') plus 'HH:mm' strings,
// so everything here works on those strings instead of Date instants — a UTC
// round-trip would shift an evening event to the previous day in Israel.

const HE_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

function toUtcDate(date) {
  const [y, m, d] = String(date || '').split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

// '2026-03-15' → 'יום ראשון, 15 במרץ 2026'
export function formatEventDate(date, { withDay = true } = {}) {
  const dt = toUtcDate(date);
  if (!dt) return '';
  const long = dt.toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return withDay ? `יום ${HE_DAYS[dt.getUTCDay()]}, ${long}` : long;
}

// Compact form for cards: '15.3.2026'
export function formatEventDateShort(date) {
  const dt = toUtcDate(date);
  if (!dt) return '';
  return dt.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export function formatEventHours(event) {
  return [event?.startTime, event?.endTime].filter(Boolean).join(' – ');
}

// Days until the event; negative once it has passed.
export function daysUntil(date) {
  const dt = toUtcDate(date);
  if (!dt) return null;
  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((dt.getTime() - todayUtc) / 86400000);
}

export function countdownLabel(date) {
  const days = daysUntil(date);
  if (days === null) return '';
  if (days < 0) return 'האירוע הסתיים';
  if (days === 0) return 'היום!';
  if (days === 1) return 'מחר';
  if (days <= 30) return `בעוד ${days} ימים`;
  return '';
}

// ── Calendar links ──────────────────────────────────────────────────────

function stamp(date, time) {
  const [h = '09', m = '00'] = String(time || '09:00').split(':');
  return `${String(date).replace(/-/g, '')}T${h.padStart(2, '0')}${m.padStart(2, '0')}00`;
}

export function googleCalendarUrl(event, tour = null) {
  const start = tour?.time || event.startTime || '09:00';
  const end = event.endTime || '23:00';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title || '',
    dates: `${stamp(event.date, start)}/${stamp(event.date, end)}`,
    details: [event.summary, tour?.time ? `${tour.tourTitle || 'סיור'} בשעה ${tour.time}` : '']
      .filter(Boolean)
      .join('\n'),
    location: event.location || '',
    ctz: 'Asia/Jerusalem',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// The server builds the .ics (same file that is attached to the confirmation
// email), so Apple Calendar and Outlook get a properly zoned invite.
export function icsUrl(event, tour = null) {
  const base = import.meta.env.VITE_API_URL || '/api';
  const query = tour?.slotId ? `?slot=${tour.slotId}` : '';
  return `${base}/events/${event._id}/calendar.ics${query}`;
}
