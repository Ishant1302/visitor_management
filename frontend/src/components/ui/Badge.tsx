import type { VisitStatus, VisitType } from '../../types';
import { STATUS_CONFIG, VISIT_TYPE_CONFIG } from '../../types';

interface StatusBadgeProps {
  status: VisitStatus;
  flash?: boolean;
}

export function StatusBadge({ status, flash }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`badge ${config.className} ${flash ? 'status-flash' : ''}`} style={{ border: '1px solid' }}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: config.dotColor.replace('bg-', ''),
          display: 'inline-block',
          flexShrink: 0,
        }}
        className={config.dotColor}
      />
      {config.label}
    </span>
  );
}

export function VisitTypeBadge({ type }: { type: VisitType }) {
  const config = VISIT_TYPE_CONFIG[type];
  return (
    <span className={`badge ${config.className}`} style={{ border: '1px solid' }}>
      {config.label}
    </span>
  );
}
