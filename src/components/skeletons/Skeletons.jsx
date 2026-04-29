export function SkeletonLine({ className = '' }) {
  return <div className={`skeleton h-3 w-full ${className}`} />;
}

export function SkeletonCircle({ size = 40, className = '' }) {
  return (
    <div
      className={`skeleton rounded-full ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <SkeletonCircle size={44} />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="w-1/3" />
          <SkeletonLine className="w-1/4 h-2" />
        </div>
      </div>
      <SkeletonLine className="h-4" />
      <SkeletonLine className="h-4 w-5/6" />
      <SkeletonLine className="h-4 w-2/3" />
    </div>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-4 flex items-center gap-3">
          <SkeletonCircle size={48} />
          <div className="flex-1 space-y-2">
            <SkeletonLine className="w-2/5" />
            <SkeletonLine className="w-3/5 h-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="card p-5 space-y-3">
      <SkeletonLine className="w-1/3 h-2" />
      <SkeletonLine className="w-1/2 h-6" />
      <SkeletonLine className="w-1/4 h-2" />
    </div>
  );
}
