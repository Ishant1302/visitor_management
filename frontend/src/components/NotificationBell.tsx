import { Bell, X, CheckCheck } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { notificationsService } from '../services';
import type { Notification } from '../types';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const data = await notificationsService.getAll();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAllRead = async () => {
    await notificationsService.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const markRead = async (id: string) => {
    await notificationsService.markRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          padding: 6,
          borderRadius: 8,
          color: '#64748b',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <div className="notif-dot">{unreadCount > 9 ? '9+' : unreadCount}</div>
        )}
      </button>

      {open && (
        <div
          className="fade-in"
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: 8,
            width: 360,
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            zIndex: 100,
            overflow: 'hidden',
          }}
        >
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
              Notifications {unreadCount > 0 && <span style={{ color: '#dc2626' }}>({unreadCount})</span>}
            </span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}>
                <X size={14} />
              </button>
            </div>
          </div>

          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
                <Bell size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                <p style={{ fontSize: 14 }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && markRead(n.id)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f8fafc',
                    background: n.isRead ? 'white' : '#eff6ff',
                    cursor: n.isRead ? 'default' : 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: n.isRead ? '#cbd5e1' : '#2563eb',
                      flexShrink: 0, marginTop: 5,
                    }} />
                    <div>
                      <p style={{ fontSize: 13, color: '#1e293b', margin: 0, lineHeight: 1.4 }}>{n.message}</p>
                      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
