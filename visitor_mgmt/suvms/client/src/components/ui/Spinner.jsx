/**
 * Spinner — animated loading indicator.
 */
export default function Spinner({ size = 'md', className = '', message = '' }) {
  const sizes = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-2', lg: 'h-10 w-10 border-[3px]' };
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        role="status"
        aria-label="Loading"
        className={`animate-spin rounded-full border-slate-200 border-t-primary-600 ${sizes[size]} ${className}`}
      />
      {message && <p className="text-xs text-slate-500 font-medium">{message}</p>}
    </div>
  );
}

export function FullPageSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-xs z-50">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" message="Loading SUVMS portal..." />
      </div>
    </div>
  );
}
