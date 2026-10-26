import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from '../components/NotificationBell';
import {
  Shield, LayoutDashboard, ClipboardList, Users, BarChart3,
  LogOut, ChevronRight, GraduationCap, UserCog, Building
} from 'lucide-react';
import type { Role } from '../types';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: Record<Role, NavItem[]> = {
  GUARD: [
    { to: '/guard', label: 'Gate Dashboard', icon: LayoutDashboard },
    { to: '/guard/records', label: 'Visitor Records', icon: ClipboardList },
  ],
  MEMBER: [
    { to: '/member', label: 'My Dashboard', icon: LayoutDashboard },
    { to: '/member/records', label: 'My Visit History', icon: ClipboardList },
  ],
  ADMIN: [
    { to: '/admin', label: 'Analytics', icon: BarChart3 },
    { to: '/admin/users', label: 'Manage Users', icon: Users },
    { to: '/admin/records', label: 'All Records', icon: ClipboardList },
  ],
};

const ROLE_META: Record<Role, { label: string; icon: React.ElementType; color: string }> = {
  GUARD: { label: 'Security Guard', icon: Shield, color: '#16a34a' },
  MEMBER: { label: 'University Member', icon: GraduationCap, color: '#2563eb' },
  ADMIN: { label: 'Administrator', icon: UserCog, color: '#7c3aed' },
};

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const navItems = NAV_ITEMS[user.role];
  const roleMeta = ROLE_META[user.role];
  const RoleIcon = roleMeta.icon;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'linear-gradient(135deg, #1e40af, #2563eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Building size={18} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>SUVMS</div>
              <div style={{ fontSize: 10, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>University</div>
            </div>
          </div>
        </div>

        {/* Role badge */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px 12px',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 6,
              background: `${roleMeta.color}22`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <RoleIcon size={16} color={roleMeta.color} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{roleMeta.label}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/guard' || item.to === '/member' || item.to === '/admin'}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 500,
                  color: isActive ? 'white' : '#94a3b8',
                  background: isActive ? 'rgba(37,99,235,0.25)' : 'transparent',
                  borderLeft: isActive ? '2px solid #2563eb' : '2px solid transparent',
                  transition: 'all 0.15s',
                })}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  if (!el.style.background.includes('235')) {
                    el.style.color = 'white';
                    el.style.background = 'rgba(255,255,255,0.05)';
                  }
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  if (!el.style.background.includes('235')) {
                    el.style.color = '#94a3b8';
                    el.style.background = 'transparent';
                  }
                }}
              >
                <Icon size={16} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '9px 12px', borderRadius: 8,
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 500, color: '#94a3b8',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="main-content" style={{ flex: 1 }}>
        {/* Top bar */}
        <header style={{
          background: 'white',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 24px',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ChevronRight size={16} color="#cbd5e1" />
            <span style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{title || 'Dashboard'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <NotificationBell />
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #1e40af, #2563eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: 'white',
            }}>
              {user.name[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ padding: 24 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
