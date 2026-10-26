import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { useToasts } from '../../hooks/useToast';

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const colors = {
  success: { bg: '#f0fdf4', border: '#bbf7d0', icon: '#16a34a', title: '#15803d' },
  error: { bg: '#fef2f2', border: '#fecaca', icon: '#dc2626', title: '#b91c1c' },
  warning: { bg: '#fffbeb', border: '#fde68a', icon: '#d97706', title: '#b45309' },
  info: { bg: '#eff6ff', border: '#bfdbfe', icon: '#2563eb', title: '#1d4ed8' },
};

export default function ToastContainer() {
  const { toasts, dismiss } = useToasts();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 380,
        width: '100%',
      }}
    >
      {toasts.map(t => {
        const Icon = icons[t.type];
        const color = colors[t.type];
        return (
          <div
            key={t.id}
            className="toast-enter"
            style={{
              background: color.bg,
              border: `1px solid ${color.border}`,
              borderRadius: 10,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            <Icon size={18} style={{ color: color.icon, flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: color.title }}>{t.title}</div>
              {t.message && <div style={{ fontSize: 13, color: '#4b5563', marginTop: 2 }}>{t.message}</div>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#9ca3af' }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
