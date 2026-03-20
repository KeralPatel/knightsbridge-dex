interface SkeletonProps {
  className?: string
  width?: string
  height?: string
}

export function Skeleton({ className = '', width, height }: SkeletonProps) {
  return (
    <div
      className={`skeleton rounded ${className}`}
      style={{ width, height }}
    />
  )
}

export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="bg-[#11161D] border border-[#1F2A37] rounded-lg p-4 space-y-3">
      <Skeleton height="16px" width="40%" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height="12px" width={`${60 + i * 10}%`} />
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-0">
      <div className={`grid gap-4 px-4 py-2 border-b border-[#1F2A37]`}
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height="10px" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className={`grid gap-4 px-4 py-3 border-b border-[rgba(31,42,55,0.5)]`}
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} height="14px" width={`${50 + Math.random() * 40}%`} />
          ))}
        </div>
      ))}
    </div>
  )
}
