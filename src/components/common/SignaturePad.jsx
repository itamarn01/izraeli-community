import { useRef, useEffect, useState } from 'react';
import { Eraser, PenLine } from 'lucide-react';

// Lightweight signature pad. Calls onChange(dataUrl) when drawing ends,
// or onChange('') when cleared.
export default function SignaturePad({ onChange }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const dirty = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1a1a1a';
  }, []);

  const pos = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    const t = e.touches?.[0];
    const cx = t ? t.clientX : e.clientX;
    const cy = t ? t.clientY : e.clientY;
    // Scale from CSS pixels to canvas resolution.
    return {
      x: (cx - r.left) * (canvasRef.current.width / r.width),
      y: (cy - r.top) * (canvasRef.current.height / r.height),
    };
  };

  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    last.current = pos(e);
  };
  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    if (!dirty.current) { dirty.current = true; setHasInk(true); }
  };
  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (dirty.current) onChange(canvasRef.current.toDataURL('image/png'));
  };

  const clear = () => {
    const c = canvasRef.current;
    c.getContext('2d').clearRect(0, 0, c.width, c.height);
    dirty.current = false;
    setHasInk(false);
    onChange('');
  };

  return (
    <div>
      <div className="relative rounded-xl border-2 border-dashed border-ink-200 bg-ink-50/40 overflow-hidden">
        {!hasInk && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-ink-300 pointer-events-none text-sm">
            <PenLine className="h-4 w-4" />
            חתמו כאן
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={600}
          height={170}
          className="w-full h-[140px] touch-none cursor-crosshair"
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
      </div>
      {hasInk && (
        <button
          type="button"
          onClick={clear}
          className="mt-2 inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-accent transition"
        >
          <Eraser className="h-3.5 w-3.5" />
          ניקוי חתימה
        </button>
      )}
    </div>
  );
}
