/**
 * EmptyState — shown when a list has no items.
 */
export default function EmptyState({ icon = '📭', title = 'Nothing here', message = '', action = null }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
      <span className="text-4xl mb-3">{icon}</span>
      <p className="text-base font-bold text-slate-800">{title}</p>
      {message && <p className="text-xs text-slate-500 mt-1 max-w-sm">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
