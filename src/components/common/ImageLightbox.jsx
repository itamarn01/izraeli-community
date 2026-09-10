import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_ZOOM = 2.5;
const DOUBLE_TAP_MS = 300;

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

/**
 * Full-screen image viewer with WhatsApp-style pinch/wheel zoom and drag-to-pan.
 * Panning only kicks in once zoomed — at 1x a plain tap/click on the backdrop
 * closes the viewer.
 */
export default function ImageLightbox({ src, onClose }) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const stageRef = useRef(null);
  const pointers = useRef(new Map());
  const dragState = useRef(null); // { x, y, posX, posY, moved }
  const pinchState = useRef(null); // { dist, scale, pos, mid }
  const lastTap = useRef(0);

  const reset = () => { setScale(1); setPos({ x: 0, y: 0 }); };

  useEffect(() => {
    reset();
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const clampPos = (nextPos, nextScale) => {
    const stage = stageRef.current;
    if (!stage) return nextPos;
    const maxX = (stage.clientWidth * (nextScale - 1)) / 2;
    const maxY = (stage.clientHeight * (nextScale - 1)) / 2;
    return { x: clamp(nextPos.x, -maxX, maxX), y: clamp(nextPos.y, -maxY, maxY) };
  };

  const zoomTo = (nextScale, center) => {
    const clamped = clamp(nextScale, MIN_SCALE, MAX_SCALE);
    if (clamped <= 1.01) { reset(); return; }
    setScale(clamped);
    if (center) {
      // Keep the point under the cursor/fingers roughly stationary while zooming.
      setPos((p) => clampPos({
        x: p.x + (center.x - (stageRef.current?.clientWidth ?? 0) / 2 - p.x) * (1 - clamped / scale),
        y: p.y + (center.y - (stageRef.current?.clientHeight ?? 0) / 2 - p.y) * (1 - clamped / scale),
      }, clamped));
    } else {
      setPos((p) => clampPos(p, clamped));
    }
  };

  const toggleDoubleTapZoom = (point) => {
    if (scale > 1.01) reset();
    else zoomTo(DOUBLE_TAP_ZOOM, point);
  };

  // React attaches its synthetic wheel listener as passive, so `preventDefault`
  // inside an `onWheel` prop is silently ignored (and warns) — the page would
  // keep scrolling behind the lightbox while zooming. A real, non-passive
  // listener is required; the ref indirection keeps it registered exactly
  // once while still seeing the latest `scale`/`zoomTo` on every call.
  const onWheelRef = useRef(() => {});
  onWheelRef.current = (e) => {
    e.preventDefault();
    const rect = stageRef.current?.getBoundingClientRect();
    const center = rect ? { x: e.clientX - rect.left, y: e.clientY - rect.top } : null;
    zoomTo(scale - e.deltaY * 0.0025, center);
  };

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const handler = (e) => onWheelRef.current(e);
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  const onPointerDown = (e) => {
    e.target.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 1) {
      dragState.current = { x: e.clientX, y: e.clientY, posX: pos.x, posY: pos.y, moved: false };
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchState.current = { dist: dist(a, b), scale, pos, mid: mid(a, b) };
      dragState.current = null;
    }
  };

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchState.current) {
      const [a, b] = [...pointers.current.values()];
      const factor = dist(a, b) / (pinchState.current.dist || 1);
      const next = clamp(pinchState.current.scale * factor, MIN_SCALE, MAX_SCALE);
      setScale(next);
      setPos(clampPos({
        x: pinchState.current.pos.x,
        y: pinchState.current.pos.y,
      }, next));
      return;
    }

    if (pointers.current.size === 1 && dragState.current && scale > 1.01) {
      const dx = e.clientX - dragState.current.x;
      const dy = e.clientY - dragState.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragState.current.moved = true;
      setPos(clampPos({ x: dragState.current.posX + dx, y: dragState.current.posY + dy }, scale));
    }
  };

  const endPointer = (e) => {
    const wasDrag = dragState.current?.moved;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchState.current = null;

    if (pointers.current.size === 0) {
      if (scale <= 1.01) reset();

      // Manual double-tap detection for touch (onDoubleClick only fires for mouse).
      if (!wasDrag) {
        const now = Date.now();
        if (now - lastTap.current < DOUBLE_TAP_MS) {
          const rect = stageRef.current?.getBoundingClientRect();
          toggleDoubleTapZoom(rect ? { x: e.clientX - rect.left, y: e.clientY - rect.top } : null);
          lastTap.current = 0;
        } else {
          lastTap.current = now;
        }
      }
      dragState.current = null;
    }
  };

  const onBackdropClick = () => {
    if (scale <= 1.01) onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center select-none"
      onClick={onBackdropClick}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="סגירה"
        className="absolute top-4 left-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center z-10"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
        <button
          onClick={(e) => { e.stopPropagation(); zoomTo(scale - 1); }}
          aria-label="הקטנה"
          className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center disabled:opacity-30"
          disabled={scale <= 1.01}
        >
          <ZoomOut className="h-5 w-5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); zoomTo(scale + 1); }}
          aria-label="הגדלה"
          className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center disabled:opacity-30"
          disabled={scale >= MAX_SCALE}
        >
          <ZoomIn className="h-5 w-5" />
        </button>
      </div>

      <div
        ref={stageRef}
        className="relative h-full w-full flex items-center justify-center overflow-hidden touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
      >
        <img
          src={src}
          alt=""
          draggable={false}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => {
            e.stopPropagation();
            const rect = stageRef.current?.getBoundingClientRect();
            toggleDoubleTapZoom(rect ? { x: e.clientX - rect.left, y: e.clientY - rect.top } : null);
          }}
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            transition: dragState.current?.moved || pinchState.current ? 'none' : 'transform 150ms ease-out',
            cursor: scale > 1.01 ? 'grab' : 'zoom-in',
          }}
          className="max-h-full max-w-full object-contain"
        />
      </div>
    </motion.div>
  );
}
