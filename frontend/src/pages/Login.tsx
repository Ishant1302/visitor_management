import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Shield, GraduationCap, UserCog, Eye, EyeOff, ArrowLeft, Building2, AlertCircle } from 'lucide-react';

const ROLE_META = {
  guard: {
    title: 'Security Guard',
    subtitle: 'Gate Access Portal',
    icon: Shield,
    accent: '#16a34a',
    bg: 'linear-gradient(135deg, #052e16, #14532d)',
    hint: 'guard1@suvms.edu / guard123',
  },
  member: {
    title: 'University Member',
    subtitle: 'Student & Faculty Portal',
    icon: GraduationCap,
    accent: '#1d4ed8',
    bg: 'linear-gradient(135deg, #1e1b4b, #1e3a8a)',
    hint: 'arjun@suvms.edu / member123',
  },
  admin: {
    title: 'Administrator',
    subtitle: 'System Administration',
    icon: UserCog,
    accent: '#7c3aed',
    bg: 'linear-gradient(135deg, #2e1065, #4c1d95)',
    hint: 'admin@suvms.edu / admin123',
  },
};

export default function LoginPage() {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const meta = ROLE_META[role as keyof typeof ROLE_META];
  if (!meta) {
    navigate('/');
    return null;
  }
  const Icon = meta.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate(`/${role}`);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f8fafc' }}>
      {/* Left panel */}
      <div style={{
        width: '42%',
        background: meta.bg,
        display: 'flex',
        flexDirection: 'column',
        padding: 48,
        color: 'white',
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
            color: 'rgba(255,255,255,0.8)', fontSize: 13, width: 'fit-content',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 18,
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 28,
          }}>
            <Icon size={32} />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.03em' }}>{meta.title}</h1>
          <p style={{ fontSize: 16, opacity: 0.7, margin: '0 0 40px' }}>{meta.subtitle}</p>

          <div style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 10, padding: '14px 16px',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', opacity: 0.6, textTransform: 'uppercase', marginBottom: 6 }}>
              Demo Credentials
            </div>
            <div style={{ fontSize: 13, opacity: 0.85, fontFamily: 'monospace' }}>{meta.hint}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.5 }}>
          <Building2 size={14} />
          <span style={{ fontSize: 12 }}>SUVMS · Smart University Visitor Management</span>
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            Sign in
          </h2>
          <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 32px' }}>
            Enter your credentials to access your dashboard.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                Email Address
              </label>
              <input
                className="form-input"
                type="email"
                placeholder="you@suvms.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2,
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                display: 'flex', gap: 8, alignItems: 'flex-start',
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: 8, padding: '10px 12px',
              }}>
                <AlertCircle size={15} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: '#dc2626' }}>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isLoading}
              style={{ marginTop: 4, justifyContent: 'center', width: '100%', background: meta.accent }}
            >
              {isLoading ? (
                <>
                  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
