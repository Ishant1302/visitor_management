export function Skeleton({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton ${className}`} style={{ height: 16, ...style }} />;
}

export function SkeletonCard() {
  return (
    <div className="stat-card">
      <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ width: 60, height: 32, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: 100, height: 14 }} />
      </div>
    </div>
  );
}

export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '12px 16px' }}>
          <div className="skeleton" style={{ width: `${60 + Math.random() * 40}%`, height: 14 }} />
        </td>
      ))}
    </tr>
  );
}
