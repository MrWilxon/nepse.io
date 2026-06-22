"use client";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="card-3d p-5 space-y-3">
      <Skeleton className="h-4 w-1/3 skeleton-text" />
      <Skeleton className="h-8 w-1/2 skeleton-title" />
      <Skeleton className="h-3 w-2/3 skeleton-text" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="card-3d overflow-hidden">
      <div className="px-4 py-3 border-b border-[#27272a]">
        <Skeleton className="h-4 w-32 skeleton-text" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1 skeleton-text" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 skeleton-text rounded-xl" />
        <Skeleton className="h-80 skeleton-text rounded-xl" />
      </div>
    </div>
  );
}
