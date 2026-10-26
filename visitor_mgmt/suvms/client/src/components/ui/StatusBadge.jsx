/**
 * StatusBadge — renders a light, high-contrast, modern pill badge for visit status.
 */
const STATUS_STYLES = {
  'Expected':    'badge-expected',
  'Verified':    'badge-verified',
  'Checked In':  'badge-checkedin',
  'Checked Out': 'badge-checkedout',
  'Cancelled':   'badge-cancelled',
  'Denied':      'badge-denied',
};

const STATUS_DOT_COLORS = {
  'Expected':    'bg-blue-500',
  'Verified':    'bg-amber-500',
  'Checked In':  'bg-emerald-500',
  'Checked Out': 'bg-slate-400',
  'Cancelled':   'bg-rose-500',
  'Denied':      'bg-red-500',
};

export default function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || 'badge bg-slate-100 text-slate-700 border border-slate-200';
  const dotCls = STATUS_DOT_COLORS[status] || 'bg-slate-400';

  return (
    <span className={cls}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`} />
      <span>{status}</span>
    </span>
  );
}
