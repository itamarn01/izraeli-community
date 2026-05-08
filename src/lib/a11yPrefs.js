import { useSyncExternalStore } from 'react';

export const A11Y_VERSION = 1;
export const A11Y_STORAGE_KEY = 'site_a11y_prefs_v1';

export const DEFAULT_PREFS = Object.freeze({
  version: 1,
  links: false,
  contrast: 'off',
  textSize: 100,
  lineSpacing: 'normal',
  readableFont: false,
  headings: false,
  cursorBlack: false,
  cursorLarge: false,
  reduceMotion: false,
});

const CONTRAST_CYCLE = ['off', 'high', 'invert', 'mono'];
const TEXT_SIZE_CYCLE = [100, 115, 130, 150];
const LINE_SPACING_CYCLE = ['normal', '16', '20'];

export const nextContrast = (c) => CONTRAST_CYCLE[(CONTRAST_CYCLE.indexOf(c) + 1) % CONTRAST_CYCLE.length];
export const nextTextSize = (s) => TEXT_SIZE_CYCLE[(TEXT_SIZE_CYCLE.indexOf(s) + 1) % TEXT_SIZE_CYCLE.length];
export const nextLineSpacing = (l) => LINE_SPACING_CYCLE[(LINE_SPACING_CYCLE.indexOf(l) + 1) % LINE_SPACING_CYCLE.length];

export function isAnyActive(p) {
  return p.links || p.contrast !== 'off' || p.textSize !== 100 || p.lineSpacing !== 'normal' ||
    p.readableFont || p.headings || p.cursorBlack || p.cursorLarge || p.reduceMotion;
}

export const CLASS_RULES = [
  ['a11y-links',           (p) => p.links],
  ['a11y-contrast-high',   (p) => p.contrast === 'high'],
  ['a11y-contrast-invert', (p) => p.contrast === 'invert'],
  ['a11y-contrast-mono',   (p) => p.contrast === 'mono'],
  ['a11y-text-115',        (p) => p.textSize === 115],
  ['a11y-text-130',        (p) => p.textSize === 130],
  ['a11y-text-150',        (p) => p.textSize === 150],
  ['a11y-lines-16',        (p) => p.lineSpacing === '16'],
  ['a11y-lines-20',        (p) => p.lineSpacing === '20'],
  ['a11y-readable-font',   (p) => p.readableFont],
  ['a11y-headings',        (p) => p.headings],
  ['a11y-cursor-black',    (p) => p.cursorBlack],
  ['a11y-cursor-large',    (p) => p.cursorLarge],
  ['a11y-reduce-motion',   (p) => p.reduceMotion],
];

export function applyPrefsToElement(el, prefs) {
  for (const [cls, pred] of CLASS_RULES) el.classList.toggle(cls, pred(prefs));
}

function readStorage() {
  try {
    const raw = localStorage.getItem(A11Y_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.version !== A11Y_VERSION) return null;
    return { ...DEFAULT_PREFS, ...parsed, version: A11Y_VERSION };
  } catch {
    return null;
  }
}

const listeners = new Set();
let cached;

function notify(next) {
  cached = next ?? readStorage() ?? DEFAULT_PREFS;
  for (const cb of listeners) cb();
}

function writeStorage(prefs) {
  try { localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(prefs)); } catch { /* quota / private mode */ }
}

export const a11yStore = {
  subscribe(cb) {
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  },
  getSnapshot() {
    if (cached === undefined) cached = readStorage() ?? DEFAULT_PREFS;
    return cached;
  },
  getServerSnapshot() { return DEFAULT_PREFS; },
  set(partial) {
    const next = { ...this.getSnapshot(), ...partial, version: A11Y_VERSION };
    writeStorage(next);
    if (typeof document !== 'undefined') applyPrefsToElement(document.documentElement, next);
    notify(next);
    return next;
  },
  reset() {
    try { localStorage.removeItem(A11Y_STORAGE_KEY); } catch {}
    if (typeof document !== 'undefined') applyPrefsToElement(document.documentElement, DEFAULT_PREFS);
    notify(DEFAULT_PREFS);
    return DEFAULT_PREFS;
  },
};

export function useA11yPrefs() {
  return useSyncExternalStore(
    (cb) => a11yStore.subscribe(cb),
    () => a11yStore.getSnapshot(),
    () => a11yStore.getServerSnapshot(),
  );
}
