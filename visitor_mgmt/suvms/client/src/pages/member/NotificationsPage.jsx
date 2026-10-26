import { useState, useEffect, useCallback } from 'react';
import PageShell from '../../components/layout/PageShell';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import api from '../../api/axiosClient';
import { useToastContext } from '../../App';

export default function NotificationsPage() {
  const { showToast } = useToastContext();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {
      showToast('Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkOne = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      showToast('Could not mark notification as read', 'error');
    }
  };

  const handleMarkAll = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
      setUnreadCount(0);
      showToast('All notifications marked as read', 'success');
    } catch {
      showToast('Could not mark all as read', 'error');
    }
  };

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-title">Notifications</h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-600 text-white animate-pulse">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="page-subtitle">Real-time gate arrival and visitor activity updates</p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              className="btn-secondary btn-sm self-start sm:self-auto text-xs"
            >
              ✓ Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div className="card flex items-center justify-center py-20">
            <Spinner size="lg" message="Loading notifications..." />
          </div>
        ) : notifications.length === 0 ? (
          <div className="card py-16">
            <EmptyState
              icon="🔔"
              title="No notifications yet"
              message="When security guards check in your visitors at the campus gates, you will receive instant notifications here."
            />
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => (
              <div
                key={item.notification_id}
                className={`card p-4 transition-all duration-150 flex items-start gap-4 ${
                  item.read === 0 
                    ? 'border-primary-300 bg-primary-50/40 shadow-sm ring-1 ring-primary-100' 
                    : 'border-slate-200 bg-white opacity-85 hover:opacity-100'
                }`}
              >
                <div className={`p-2.5 rounded-xl text-lg flex-shrink-0 ${
                  item.read === 0 ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  {item.read === 0 ? '🔔' : '🔕'}
                </div>

                <div className="flex-1 space-y-1">
                  <p className={`text-sm ${item.read === 0 ? 'text-slate-900 font-semibold' : 'text-slate-700'}`}>
                    {item.message}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                    {item.read === 0 && (
                      <button
                        onClick={() => handleMarkOne(item.notification_id)}
                        className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
