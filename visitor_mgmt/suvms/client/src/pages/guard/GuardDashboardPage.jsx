import { useState, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { usePolling } from '../../hooks/usePolling';
import api from '../../api/axiosClient';
import { useToastContext } from '../../App';

export default function GuardDashboardPage() {
  const navigate = useNavigate();
  const { showToast } = useToastContext();
  const searchInputRef = useRef(null);

  const [dashboardData, setDashboardData] = useState({
    today: '',
    expected_list: [],
    inside_list: [],
    stats: { expected_count: 0, inside_count: 0, today_checked_in: 0, today_checked_out: 0 },
  });

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionInProgress, setActionInProgress] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get('/visits/dashboard');
      setDashboardData(res.data);
      setLastRefreshed(new Date());
    } catch {
      // silently handle poll error to avoid interrupting guard
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll every 5s per R10
  usePolling(fetchDashboard, 5000);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      searchInputRef.current?.focus();
      return;
    }
    navigate(`/guard/records?q=${encodeURIComponent(searchTerm.trim())}`);
  };

  // Quick 1-Click Verify
  const handleQuickVerify = async (visitId, visitorName) => {
    setActionInProgress(visitId);
    try {
      await api.patch(`/visits/${visitId}/verify`, {});
      showToast(`Verified: ${visitorName}`, 'success');
      fetchDashboard();
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.blacklist) {
        showToast(`BLACKLIST ALERT: ${err.response.data.error}`, 'error');
        navigate(`/guard/visit/${visitId}`);
      } else {
        showToast(err.response?.data?.error || 'Verification failed', 'error');
      }
    } finally {
      setActionInProgress(null);
    }
  };

  // Quick 1-Click Check-In
  const handleQuickCheckIn = async (visitId, visitorName) => {
    setActionInProgress(visitId);
    try {
      await api.patch(`/visits/${visitId}/checkin`, {});
      showToast(`Checked In: ${visitorName}`, 'success');
      fetchDashboard();
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.blacklist) {
        showToast(`BLACKLIST ALERT: ${err.response.data.error}`, 'error');
        navigate(`/guard/visit/${visitId}`);
      } else {
        showToast(err.response?.data?.error || 'Check-in failed', 'error');
      }
    } finally {
      setActionInProgress(null);
    }
  };

  // Quick 1-Click Check-Out
  const handleQuickCheckOut = async (visitId, visitorName) => {
    setActionInProgress(visitId);
    try {
      await api.patch(`/visits/${visitId}/checkout`, {});
      showToast(`Checked Out: ${visitorName}`, 'success');
      fetchDashboard();
    } catch (err) {
      showToast(err.response?.data?.error || 'Check-out failed', 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  const { stats, expected_list, inside_list } = dashboardData;

  return (
    <PageShell>
      {/* ── Top Header with Live Refresh Indicator ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Gate Operations Dashboard
            </h1>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Live 5s Polling
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            BML Munjal University · Main Security Gate · Real-time Visitor Verification & Check-in Desk · Last polled at {lastRefreshed.toLocaleTimeString()}
          </p>
        </div>

        {/* Quick manual refresh button */}
        <button
          onClick={fetchDashboard}
          className="btn-secondary btn-sm self-start md:self-auto flex items-center gap-1.5 text-xs text-slate-600 shadow-xs hover:text-primary-600"
          title="Manual refresh"
        >
          <span>🔄</span>
          <span>Refresh Now</span>
        </button>
      </div>

      {/* ── Large Guard Search Bar (R3, R4) ── */}
      <form onSubmit={handleSearchSubmit} className="mb-6">
        <div className="relative flex items-center shadow-xs rounded-2xl">
          <span className="absolute left-4 text-2xl text-slate-400 pointer-events-none">🔍</span>
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search visitor by Name, Phone, Vehicle number plate, Host, or Pass ID..."
            className="w-full bg-white border-2 border-slate-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 text-slate-900 rounded-2xl py-4 pl-14 pr-32 text-base md:text-lg placeholder-slate-400 transition-all font-medium"
          />
          <button
            type="submit"
            className="absolute right-3 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-sm shadow-md shadow-primary-500/20 transition-all"
          >
            Search
          </button>
        </div>
      </form>

      {/* ── 5 Big Action Tiles for Guards (R3, R7, R13) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-8">
        {/* 1. Walk-in Registration */}
        <Link
          to="/guard/walkin"
          className="card p-4 hover:border-primary-400 hover:bg-primary-50/40 transition-all flex flex-col items-center text-center group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform shadow-xs">
            🚶
          </div>
          <span className="text-sm font-bold text-slate-900 group-hover:text-primary-700">
            Walk-in Visitor
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5">Register unscheduled</span>
        </Link>

        {/* 2. Delivery / Courier Shortcut */}
        <Link
          to="/guard/walkin?type=delivery"
          className="card p-4 hover:border-amber-400 hover:bg-amber-50/40 transition-all flex flex-col items-center text-center group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform shadow-xs">
            📦
          </div>
          <span className="text-sm font-bold text-slate-900 group-hover:text-amber-700">
            Delivery Shortcut
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5">Fast courier clearance</span>
        </Link>

        {/* 3. Search Visitor */}
        <button
          type="button"
          onClick={() => searchInputRef.current?.focus()}
          className="card p-4 hover:border-blue-400 hover:bg-blue-50/40 transition-all flex flex-col items-center text-center group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform shadow-xs">
            🔎
          </div>
          <span className="text-sm font-bold text-slate-900 group-hover:text-blue-700">
            Search Visitor
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5">Focus search input</span>
        </button>

        {/* 4. Quick Check-In / Expected */}
        <a
          href="#expected-arrivals"
          className="card p-4 hover:border-teal-400 hover:bg-teal-50/40 transition-all flex flex-col items-center text-center group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform shadow-xs">
            📥
          </div>
          <span className="text-sm font-bold text-slate-900 group-hover:text-teal-800">
            Expected List
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5">{stats.expected_count} arrivals today</span>
        </a>

        {/* 5. Visitor Records */}
        <Link
          to="/guard/records"
          className="card p-4 hover:border-purple-400 hover:bg-purple-50/40 transition-all flex flex-col items-center text-center group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform shadow-xs">
            📋
          </div>
          <span className="text-sm font-bold text-slate-900 group-hover:text-purple-700">
            Visitor Records
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5">Search full history</span>
        </Link>
      </div>

      {/* ── Key Gate Metric Badges ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <div className="card p-4 flex items-center justify-between border-l-4 border-l-blue-500">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Expected Today</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{stats.expected_count}</div>
          </div>
          <span className="text-2xl text-blue-500">📅</span>
        </div>

        <div className="card p-4 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Currently Inside</div>
            <div className="text-2xl font-black text-emerald-700 mt-0.5">{stats.inside_count}</div>
          </div>
          <span className="text-2xl text-emerald-500">🏢</span>
        </div>

        <div className="card p-4 flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Checked In Today</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{stats.today_checked_in}</div>
          </div>
          <span className="text-2xl text-amber-500">✅</span>
        </div>

        <div className="card p-4 flex items-center justify-between border-l-4 border-l-slate-400">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Checked Out Today</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{stats.today_checked_out}</div>
          </div>
          <span className="text-2xl text-slate-400">🚪</span>
        </div>
      </div>

      {/* ── Dual Real-Time Lists ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Today's Expected Visitors */}
        <div id="expected-arrivals" className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>📅 Today's Expected Arrivals</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {expected_list.length}
              </span>
            </h2>
            <span className="text-xs text-slate-500">Auto-refreshing</span>
          </div>

          {loading ? (
            <div className="card py-12 flex justify-center">
              <Spinner size="md" message="Loading expected arrivals..." />
            </div>
          ) : expected_list.length === 0 ? (
            <div className="card py-10">
              <EmptyState
                icon="🎉"
                title="No expected visitors pending"
                message="All pre-registered visitors for today have arrived or no visits are scheduled."
              />
            </div>
          ) : (
            <div className="space-y-3">
              {expected_list.map((visit) => (
                <div
                  key={visit.visit_id}
                  className="card p-4 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-slate-900">
                        {visit.visitor_name}
                      </span>
                      <StatusBadge status={visit.status} />
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold capitalize">
                        {visit.visitor_type}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5">
                      <span>📞 <span className="font-mono text-slate-700">{visit.visitor_phone}</span></span>
                      <span>⏰ Expected: <strong className="text-slate-800">{visit.expected_time || 'Anytime today'}</strong></span>
                    </div>

                    <div className="text-xs text-slate-600">
                      <span>Host: </span>
                      <strong className="text-slate-900">{visit.host_name || 'N/A'}</strong>
                      {visit.department_name && <span className="text-slate-500"> ({visit.department_name})</span>}
                    </div>

                    {visit.registration_number && (
                      <div className="text-xs font-mono text-slate-900 font-semibold">
                        🚗 {visit.vehicle_type} - <span className="bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-amber-800">{visit.registration_number}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions in row */}
                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    {visit.status === 'Expected' && (
                      <button
                        onClick={() => handleQuickVerify(visit.visit_id, visit.visitor_name)}
                        disabled={actionInProgress === visit.visit_id}
                        className="btn-sm bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs"
                      >
                        {actionInProgress === visit.visit_id ? 'Verifying...' : 'Verify'}
                      </button>
                    )}

                    {visit.status === 'Verified' && (
                      <button
                        onClick={() => handleQuickCheckIn(visit.visit_id, visit.visitor_name)}
                        disabled={actionInProgress === visit.visit_id}
                        className="btn-sm bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs animate-pulse"
                      >
                        {actionInProgress === visit.visit_id ? 'Checking In...' : 'Check-In'}
                      </button>
                    )}

                    <Link
                      to={`/guard/visit/${visit.visit_id}`}
                      className="btn-secondary btn-sm text-xs"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Currently Inside (Checked In) */}
        <div id="currently-inside" className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>🏢 Currently Inside Campus</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {inside_list.length}
              </span>
            </h2>
            <span className="text-xs text-slate-500">Live headcount</span>
          </div>

          {loading ? (
            <div className="card py-12 flex justify-center">
              <Spinner size="md" message="Loading campus visitors..." />
            </div>
          ) : inside_list.length === 0 ? (
            <div className="card py-10">
              <EmptyState
                icon="🚪"
                title="No visitors currently inside"
                message="All visitors who entered campus have checked out."
              />
            </div>
          ) : (
            <div className="space-y-3">
              {inside_list.map((visit) => (
                <div
                  key={visit.visit_id}
                  className="card p-4 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs border-l-4 border-l-emerald-500"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-slate-900">
                        {visit.visitor_name}
                      </span>
                      <StatusBadge status={visit.status} />
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold capitalize">
                        {visit.visitor_type}
                      </span>
                    </div>

                    <div className="text-xs text-emerald-700 font-semibold">
                      ✓ In since: {visit.check_in_time ? new Date(visit.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Earlier'}
                    </div>

                    <div className="text-xs text-slate-600">
                      <span>Host: </span>
                      <strong className="text-slate-900">{visit.host_name || 'N/A'}</strong>
                      {visit.department_name && <span className="text-slate-500"> ({visit.department_name})</span>}
                    </div>

                    {visit.registration_number && (
                      <div className="text-xs font-mono text-slate-900 font-semibold">
                        🚗 {visit.vehicle_type} - <span className="bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-amber-800">{visit.registration_number}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions in row */}
                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    <button
                      onClick={() => handleQuickCheckOut(visit.visit_id, visit.visitor_name)}
                      disabled={actionInProgress === visit.visit_id}
                      className="btn-sm bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs"
                    >
                      {actionInProgress === visit.visit_id ? 'Checking Out...' : 'Check-Out'}
                    </button>

                    <Link
                      to={`/guard/visit/${visit.visit_id}`}
                      className="btn-secondary btn-sm text-xs"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
