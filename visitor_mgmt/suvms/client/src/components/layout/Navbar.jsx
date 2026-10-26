import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axiosClient';
import LiveClock from '../ui/LiveClock';

const ROLE_LABELS = { member: 'Member', guard: 'Security Guard', admin: 'Administrator' };
const ROLE_COLORS = {
  member: 'bg-primary-50 text-primary-700 border-primary-200',
  guard:  'bg-amber-50   text-amber-700   border-amber-200',
  admin:  'bg-purple-50  text-purple-700  border-purple-200',
};

const NAV_LINKS = {
  member: [
    { to: '/member/visitors',    label: 'My Visitors', icon: '👥' },
    { to: '/member/pre-register',label: 'Pre-register', icon: '➕' },
    { to: '/member/notifications',label: 'Notifications', icon: '🔔' },
  ],
  guard: [
    { to: '/guard',         label: 'Gate Dashboard', icon: '🏠' },
    { to: '/guard/walkin',  label: 'Walk-In Entry',  icon: '🚶' },
    { to: '/guard/records', label: 'Visitor Records',icon: '📋' },
  ],
  admin: [
    { to: '/admin',          label: 'Executive Overview', icon: '📊' },
    { to: '/admin/records',  label: 'Audit Records',      icon: '📋' },
    { to: '/admin/users',    label: 'User Directory',     icon: '👤' },
    { to: '/admin/blacklist',label: 'Campus Blacklist',   icon: '🚫' },
  ],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const links     = NAV_LINKS[user?.role] || [];
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.role !== 'member') return;
    const fetchUnread = () => {
      api.get('/notifications')
        .then(r => setUnreadCount(r.data.unreadCount || 0))
        .catch(() => {});
    };
    fetchUnread();
    const id = setInterval(fetchUnread, 8000);
    return () => clearInterval(id);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      <div className="w-full max-w-[1536px] mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 md:gap-4">
        {/* Left: Brand Identity (Logbook signature style with campus branding) */}
        <Link to="/" className="flex items-center gap-2.5 sm:gap-3 mr-2 sm:mr-4 flex-shrink-0 group">
          <div className="flex items-center tracking-tight">
            <span className="text-primary-600 font-extrabold text-2xl mr-1 select-none">//</span>
            <span className="font-black text-slate-900 text-lg group-hover:text-primary-600 transition-colors">
              SUVMS
            </span>
          </div>
          <div className="hidden md:block border-l border-slate-200 pl-2.5">
            <div className="text-[11px] font-bold text-slate-800 leading-tight">
              BML Munjal University
            </div>
            <div className="text-[10px] text-slate-500 -mt-0.5">
              Visitor Gate System
            </div>
          </div>
        </Link>

        {/* Center: Navigation Links */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-hide py-1">
          {links.map(({ to, label, icon }) => {
            const active = location.pathname === to ||
                           (to !== '/guard' && location.pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap transition-all duration-150 relative flex-shrink-0 ${
                  active
                    ? 'bg-primary-50 text-primary-700 border border-primary-200/80 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span className="text-base">{icon}</span>
                <span className="inline">{label}</span>
                {label === 'Notifications' && unreadCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary-600 text-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Right: Authenticated User Profile, Logout & Top-Right-Most Clock */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {user && (
            <>
              <div className="hidden lg:flex flex-col items-end">
                <span className="text-xs font-bold text-slate-800 leading-tight">{user.name}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border mt-0.5 ${ROLE_COLORS[user.role]}`}>
                  {ROLE_LABELS[user.role]}
                  {user.member_type ? ` · ${user.member_type.toUpperCase()}` : ''}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="btn-secondary btn-sm text-xs text-slate-600 hover:text-red-600 hover:border-red-200 flex items-center gap-1.5 shadow-2xs"
                title="Logout from portal"
              >
                <span>🚪</span>
                <span className="hidden sm:inline font-medium">Logout</span>
              </button>
            </>
          )}

          {/* Divider between Logout and Clock */}
          <div className="hidden sm:block h-6 w-px bg-slate-200" />

          {/* Top-Right-Most Corner: Live Clock */}
          <LiveClock variant="navbar" />
        </div>
      </div>
    </nav>
  );
}
