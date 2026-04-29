export default function Logo({ size = 40, withText = true }) {
  return (
    <div className="flex items-center gap-3">
      <img src="/izraeli-logo.png" alt="חטיבת יזרעאלי" style={{ width: size, height: size }} />
      {withText && (
        <div className="leading-tight">
          <div className="brand-display text-ink text-lg">חטיבת יזרעאלי</div>
          <div className="text-[11px] text-ink-400">קהילת הלוחמים</div>
        </div>
      )}
    </div>
  );
}
