import { useEffect } from 'react';

const ICONS = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
const COLORS = {
  success: 'bg-green-950/90 border-green-700/60 text-green-200',
  error:   'bg-red-950/90   border-red-700/60   text-red-200',
  warning: 'bg-amber-950/90 border-amber-700/60 text-amber-200',
  info:    'bg-slate-800/90 border-slate-600/60  text-slate-200',
};

function Toast({ id, message, type = 'success', onRemove }) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-2xl
                  backdrop-blur-md text-sm font-medium max-w-sm w-full
                  animate-slideDown ${COLORS[type]}`}
    >
      <span className="text-base flex-shrink-0 mt-0.5">{ICONS[type]}</span>
      <p className="flex-1">{message}</p>
      <button
        onClick={() => onRemove(id)}
        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity ml-2"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

/**
 * ToastContainer — renders all active toasts in the bottom-right corner.
 */
export default function ToastContainer({ toasts, removeToast }) {
  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 items-end"
    >
      {toasts.map(t => (
        <Toast key={t.id} {...t} onRemove={removeToast} />
      ))}
    </div>
  );
}
