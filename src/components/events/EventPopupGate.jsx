import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import api from '../../api/client';
import EventRegistrationModal from './EventRegistrationModal.jsx';

// Set by the public landing page when a visitor taps "אני מגיע/ה" before logging
// in, so they land back on that event's popup once they are inside the app.
const PENDING_KEY = 'izraeli_pending_event';
const SNOOZE_KEY = 'izraeli_event_snooze';

export function setPendingEvent(id) {
  try {
    localStorage.setItem(PENDING_KEY, String(id));
  } catch {
    /* private mode — the popup just falls back to the next open event */
  }
}

function readPending() {
  try {
    return localStorage.getItem(PENDING_KEY);
  } catch {
    return null;
  }
}

function clearPending() {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

// Closing with X hides the popup for the rest of the browser session only;
// "לא מעוניין/ת כרגע" is what persists server-side.
function isSnoozed(id) {
  try {
    return sessionStorage.getItem(`${SNOOZE_KEY}:${id}`) === '1';
  } catch {
    return false;
  }
}

function snooze(id) {
  try {
    sessionStorage.setItem(`${SNOOZE_KEY}:${id}`, '1');
  } catch {
    /* ignore */
  }
}

/**
 * Opens the event registration popup by itself when a member enters the app,
 * for the soonest event they have not answered yet.
 */
export default function EventPopupGate() {
  const [event, setEvent] = useState(null);
  const { pathname } = useLocation();

  // The events page opens its own modal (from a card or the ?event= deep link),
  // so the gate stays out of the way there — otherwise both would stack.
  const onEventsPage = pathname.startsWith('/app/events');

  useEffect(() => {
    let cancelled = false;
    const pending = readPending();

    api
      .get('/events/popup', { params: pending ? { prefer: pending } : {} })
      .then(({ data }) => {
        if (cancelled || !data.event) return;
        clearPending();
        if (isSnoozed(data.event._id)) return;
        setEvent(data.event);
      })
      .catch(() => {
        /* the popup is a nicety — never block the dashboard on it */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // On the events page the member is handling events directly, so drop the
  // queued popup instead of holding a stale copy that would resurface later.
  useEffect(() => {
    if (onEventsPage) setEvent(null);
  }, [onEventsPage]);

  const close = () => {
    if (event) snooze(event._id);
    setEvent(null);
  };

  return (
    <AnimatePresence>
      {event && !onEventsPage && (
        <EventRegistrationModal
          key={event._id}
          event={event}
          autoOpened
          onClose={close}
          onSaved={(updated) => setEvent(updated)}
        />
      )}
    </AnimatePresence>
  );
}
