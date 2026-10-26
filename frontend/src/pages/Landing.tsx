import { useNavigate } from 'react-router-dom';
import { Shield, GraduationCap, UserCog, ChevronRight, Building2 } from 'lucide-react';

const roles = [
  {
    role: 'guard',
    title: 'Security Guard',
    description: 'Gate access, visitor check-in/out, walk-in registration, and real-time campus monitoring.',
    icon: Shield,
    accent: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
  },
  {
    role: 'member',
    title: 'University Member',
    description: 'Pre-register expected visitors, track visit status, and receive real-time notifications.',
    icon: GraduationCap,
    accent: '#1d4ed8',
    bg: '#eff6ff',
    border: '#bfdbfe',
  },
  {
    role: 'admin',
    title: 'Administrator',
    description: 'Full oversight of all visitors, analytics dashboard, and university member management.',
    icon: UserCog,
    accent: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        background: '#0f172a',
        padding: '0 40px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'linear-gradient(135deg, #1e40af, #2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Building2 size={18} color="white" />
          </div>
          <div>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>SUVMS</span>
            <span style={{ color: '#64748b', fontSize: 13, marginLeft: 8 }}>Smart University Visitor Management System</span>
          </div>
        </div>
        <div style={{
          fontSize: 12, color: '#475569', background: 'rgba(255,255,255,0.05)',
          padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)',
        }}>
          Secure · Simple · Connected
        </div>
      </header>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(160deg, #0f172a 0%, #1e3a8a 60%, #1e40af 100%)',
        padding: '80px 40px 100px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle grid pattern */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.3)',
            borderRadius: 9999, padding: '4px 14px', marginBottom: 24,
          }}>
            <Shield size={12} color="#60a5fa" />
            <span style={{ fontSize: 12, color: '#60a5fa', fontWeight: 500 }}>University Security Platform</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 52px)',
            fontWeight: 800,
            color: 'white',
            margin: '0 0 16px',
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
          }}>
            Smart University<br />
            <span style={{ color: '#60a5fa' }}>Visitor Management</span>
          </h1>
          <p style={{
            fontSize: 18, color: '#94a3b8', maxWidth: 540,
            margin: '0 auto 40px', lineHeight: 1.6,
          }}>
            A digital gate register — secure, fast, and connected. Pre-register visitors, verify identities, and track campus access in real time.
          </p>
        </div>
      </div>

      {/* Role cards */}
      <div style={{ flex: 1, padding: '0 40px 60px', marginTop: -48 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
          maxWidth: 960,
          margin: '0 auto',
        }}>
          {roles.map(r => {
            const Icon = r.icon;
            return (
              <button
                key={r.role}
                onClick={() => navigate(`/login/${r.role}`)}
                style={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: 16,
                  padding: 28,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  el.style.transform = 'translateY(-2px)';
                  el.style.boxShadow = `0 8px 24px rgba(0,0,0,0.1), 0 0 0 1px ${r.border}`;
                  el.style.borderColor = r.border;
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  el.style.transform = 'translateY(0)';
                  el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                  el.style.borderColor = '#e2e8f0';
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 12,
                  background: r.bg, border: `1px solid ${r.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 18,
                }}>
                  <Icon size={24} color={r.accent} />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>{r.title}</h2>
                <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 20px', lineHeight: 1.5 }}>{r.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: r.accent, fontSize: 14, fontWeight: 600 }}>
                  Sign in as {r.title} <ChevronRight size={14} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #e2e8f0', padding: '16px 40px',
        textAlign: 'center', fontSize: 13, color: '#94a3b8',
      }}>
        SUVMS — Smart University Visitor Management System &copy; 2024
      </footer>
    </div>
  );
}
