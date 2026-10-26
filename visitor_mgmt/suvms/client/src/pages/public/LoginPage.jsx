import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ROLE_HOME = { member: '/member/visitors', guard: '/guard', admin: '/admin' };

const DEMO_ACCOUNTS = [
  { role: 'Guard 1', email: 'guard1@suvms.edu', pass: 'Guard@123', color: 'hover:border-amber-400 hover:bg-amber-50' },
  { role: 'Admin', email: 'admin@suvms.edu', pass: 'Admin@123', color: 'hover:border-purple-400 hover:bg-purple-50' },
  { role: 'Student', email: 'arjun@suvms.edu', pass: 'Member@123', color: 'hover:border-primary-400 hover:bg-primary-50' },
  { role: 'Faculty', email: 'meena@suvms.edu', pass: 'Member@123', color: 'hover:border-teal-400 hover:bg-teal-50' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm] = useState({ email: 'guard1@suvms.edu', password: 'Guard@123' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form);
      navigate(ROLE_HOME[user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (acc) => {
    setForm({ email: acc.email, password: acc.pass });
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-900/10 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Big Box (Outer Container) with full-span Campus Image from left to right */}
      <div className="max-w-5xl w-full relative rounded-3xl shadow-2xl border border-white/30 overflow-hidden animate-fade-in bg-slate-950">
        {/* Complete Campus Image spanning both boxes */}
        <div className="absolute inset-0">
          <img
            src="/images/campus-1.jpg"
            alt="BML Munjal University Campus"
            className="w-full h-full object-cover object-top"
          />
          {/* Subtle dual-tone gradient to ensure high readability while keeping the full building visible */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/50 to-slate-950/30" />
        </div>

        {/* Content Grid spanning Left Box (SUVMS) to Right Box (Register Account) */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          {/* Left Box: Campus Brand & Info (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between p-8 sm:p-10 text-white">
            {/* Top Brand Tag */}
            <div className="flex items-center gap-2">
              <span className="text-primary-400 font-black text-2xl">//</span>
              <div>
                <span className="font-extrabold text-white text-xl tracking-tight drop-shadow-md">SUVMS</span>
                <div className="text-[10px] text-slate-200 font-semibold tracking-wider uppercase drop-shadow">
                  BML Munjal University
                </div>
              </div>
            </div>

            {/* Bottom Caption Box */}
            <div className="mt-12 lg:mt-auto pt-8">
              <div className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-primary-600/90 text-white backdrop-blur-md mb-3 shadow-sm">
                Campus Security Portal
              </div>
              <h2 className="text-2xl lg:text-3xl font-black text-white leading-tight drop-shadow-md">
                Smart University Visitor Management System
              </h2>
              <p className="text-xs text-slate-200 mt-3 leading-relaxed drop-shadow">
                Fast-track gate arrivals, digital pre-registration QR passes, and automated campus security screening.
              </p>
            </div>
          </div>

          {/* Right Box: Clean Login Form with 30% Frosted Glassmorphism (7 cols) */}
          <div className="lg:col-span-7 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
            <div
              className="w-full backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-10 border border-white/50"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.30)',
                boxShadow: '0 20px 45px -15px rgba(0, 0, 0, 0.32)'
              }}
            >
              <div className="mb-6">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Sign In to Your Account
                </h1>
                <p className="text-xs text-slate-700 mt-1 font-semibold">
                  Enter your university credentials to access gate control or visitor services.
                </p>
              </div>

              {/* Quick Demo Credentials Bar */}
              <div
                className="mb-6 rounded-2xl p-3.5 border border-white/60"
                style={{ backgroundColor: 'rgba(248, 250, 252, 0.40)' }}
              >
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Quick One-Click Demo Accounts:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => fillDemo(acc)}
                      className={`px-2.5 py-1.5 rounded-xl border border-white/70 bg-white/75 text-xs font-bold text-slate-800 transition-all ${acc.color} text-center shadow-sm backdrop-blur-sm`}
                    >
                      {acc.role}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-50/90 border border-red-200 text-red-700 text-xs font-semibold mb-5 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label font-bold text-slate-850">University Email</label>
                  <input
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="name@suvms.edu"
                    className="input border-white/60 text-slate-900 font-medium"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.65)',
                      backdropFilter: 'blur(8px)'
                    }}
                  />
                </div>

                <div>
                  <label className="label font-bold text-slate-850">Password</label>
                  <input
                    name="password"
                    type="password"
                    required
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="input border-white/60 text-slate-900 font-medium"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.65)',
                      backdropFilter: 'blur(8px)'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 text-sm font-bold shadow-md shadow-primary-500/20"
                >
                  {loading ? 'Authenticating...' : 'Sign In to Portal →'}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-900/10 flex items-center justify-between text-xs text-slate-850 font-bold drop-shadow-sm">
                <span>Student or Faculty without an account?</span>
                <Link to="/signup" className="font-extrabold text-primary-600 hover:text-primary-700 drop-shadow-sm">
                  Register Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
