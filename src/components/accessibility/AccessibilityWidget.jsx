import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Accessibility, AlignJustify, Bold, Contrast,
  ExternalLink, Heading1, Link2, MousePointer2,
  Pause, RotateCcw, Type, X, ZoomIn,
} from 'lucide-react';
import {
  a11yStore, applyPrefsToElement, isAnyActive,
  nextContrast, nextLineSpacing, nextTextSize, useA11yPrefs,
} from '../../lib/a11yPrefs.js';

const CONTRAST_LABELS = { off: 'כבוי', high: 'גבוהה', invert: 'הפוך', mono: 'אפור' };
const TEXT_LABELS = { 100: 'רגיל', 115: '115%', 130: '130%', 150: '150%' };
const LINE_LABELS = { normal: 'רגיל', '16': '1.6', '20': '2.0' };

function ToggleCard({ icon: Icon, label, active, valueLabel, cycling, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={cycling ? undefined : active}
      aria-label={valueLabel ? `${label}: ${valueLabel}` : label}
      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl p-3 border transition-all text-center aspect-square focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 ${
        active
          ? 'border-accent bg-accent-50 text-accent-700 ring-1 ring-accent'
          : 'border-ink-200 bg-white text-ink hover:bg-ink-50'
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden />
      <span className="text-[11px] font-medium leading-tight">{label}</span>
      {valueLabel && <span className="text-[10px] text-ink-400">{valueLabel}</span>}
    </button>
  );
}

export default function AccessibilityWidget() {
  const prefs = useA11yPrefs();
  const [open, setOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const closeRef = useRef(null);

  useEffect(() => {
    applyPrefsToElement(document.documentElement, a11yStore.getSnapshot());
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.code === 'KeyA') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => closeRef.current?.focus(), 50);
  }, [open]);

  const announce = useCallback((label) => {
    setAnnouncement('');
    requestAnimationFrame(() => setAnnouncement(`שינוי הגדרה: ${label}`));
  }, []);

  const toggle = (feature, value, label) => {
    a11yStore.set({ [feature]: value });
    announce(label);
  };

  return (
    <>
      <div role="status" aria-live="polite" className="sr-only" aria-atomic="true">
        {announcement}
      </div>

      <button
        id="a11y-widget-trigger"
        type="button"
        onClick={() => setOpen(true)}
        aria-label="פתח תפריט נגישות"
        aria-expanded={open}
        aria-controls="a11y-widget-panel"
        aria-keyshortcuts="Alt+A"
        title="נגישות (Alt+A)"
        className={`fixed bottom-6 end-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-lg hover:bg-accent-600 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
          isAnyActive(prefs) ? 'ring-2 ring-white/40' : ''
        }`}
      >
        <Accessibility className="h-6 w-6" aria-hidden />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 bg-ink/40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />

            <motion.div
              id="a11y-widget-panel"
              role="dialog"
              aria-modal="true"
              aria-label="הגדרות נגישות"
              dir="rtl"
              className="fixed top-0 right-0 bottom-0 w-72 sm:w-80 bg-surface shadow-xl z-50 flex flex-col"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
                <h2 className="font-bold text-ink text-base">הגדרות נגישות</h2>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="סגור תפריט נגישות"
                  className="h-8 w-8 rounded-lg hover:bg-ink-50 flex items-center justify-center text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-3 gap-2.5">
                  <ToggleCard
                    icon={Link2} label="הדגשת קישורים"
                    active={prefs.links}
                    onClick={() => toggle('links', !prefs.links, 'הדגשת קישורים')}
                  />
                  <ToggleCard
                    icon={Contrast} label="ניגודיות"
                    active={prefs.contrast !== 'off'}
                    valueLabel={prefs.contrast !== 'off' ? CONTRAST_LABELS[prefs.contrast] : undefined}
                    cycling
                    onClick={() => {
                      const next = nextContrast(prefs.contrast);
                      toggle('contrast', next, `ניגודיות: ${CONTRAST_LABELS[next]}`);
                    }}
                  />
                  <ToggleCard
                    icon={Type} label="גודל טקסט"
                    active={prefs.textSize !== 100}
                    valueLabel={prefs.textSize !== 100 ? TEXT_LABELS[prefs.textSize] : undefined}
                    cycling
                    onClick={() => {
                      const next = nextTextSize(prefs.textSize);
                      toggle('textSize', next, `גודל טקסט: ${TEXT_LABELS[next]}`);
                    }}
                  />
                  <ToggleCard
                    icon={AlignJustify} label="רווח שורות"
                    active={prefs.lineSpacing !== 'normal'}
                    valueLabel={prefs.lineSpacing !== 'normal' ? LINE_LABELS[prefs.lineSpacing] : undefined}
                    cycling
                    onClick={() => {
                      const next = nextLineSpacing(prefs.lineSpacing);
                      toggle('lineSpacing', next, `רווח שורות: ${LINE_LABELS[next]}`);
                    }}
                  />
                  <ToggleCard
                    icon={Bold} label="גופן קריא"
                    active={prefs.readableFont}
                    onClick={() => toggle('readableFont', !prefs.readableFont, 'גופן קריא')}
                  />
                  <ToggleCard
                    icon={Heading1} label="הדגשת כותרות"
                    active={prefs.headings}
                    onClick={() => toggle('headings', !prefs.headings, 'הדגשת כותרות')}
                  />
                  <ToggleCard
                    icon={MousePointer2} label="סמן שחור"
                    active={prefs.cursorBlack}
                    onClick={() => toggle('cursorBlack', !prefs.cursorBlack, 'סמן שחור')}
                  />
                  <ToggleCard
                    icon={ZoomIn} label="סמן גדול"
                    active={prefs.cursorLarge}
                    onClick={() => toggle('cursorLarge', !prefs.cursorLarge, 'סמן גדול')}
                  />
                  <ToggleCard
                    icon={Pause} label="הפחתת אנימציה"
                    active={prefs.reduceMotion}
                    onClick={() => toggle('reduceMotion', !prefs.reduceMotion, 'הפחתת אנימציה')}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => { a11yStore.reset(); announce('איפוס הגדרות'); }}
                  className="mt-5 w-full flex items-center justify-center gap-2 text-sm text-ink-400 hover:text-accent py-2 rounded-xl hover:bg-ink-50 transition focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  איפוס הגדרות
                </button>
              </div>

              <div className="px-5 py-3 border-t border-ink-100 flex items-center justify-between">
                <span className="text-xs text-ink-400">קיצור מקלדת: Alt+A</span>
                <a
                  href="/accessibility-statement"
                  className="text-xs text-accent hover:underline flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-accent rounded"
                >
                  הצהרת נגישות
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
