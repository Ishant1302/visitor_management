import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import PageShell from '../../components/layout/PageShell';
import Spinner from '../../components/ui/Spinner';
import api from '../../api/axiosClient';
import { useToastContext } from '../../App';

const PIE_COLORS = ['#ee6548', '#0d9488', '#0284c7', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#64748b'];

export default function AdminOverviewPage() {
  const { showToast } = useToastContext();

  const [summary, setSummary] = useState(null);
  const [byType, setByType] = useState([]);
  const [byDate, setByDate] = useState([]);
  const [loading, setLoading] = useState(true);
  const [daysPreset, setDaysPreset] = useState(7);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, typeRes, dateRes] = await Promise.all([
        api.get('/stats/summary'),
        api.get('/stats/by-type'),
        api.get(`/stats/by-date?days=${daysPreset}`),
      ]);
      setSummary(sumRes.data);
      setByType(typeRes.data.by_type || []);
      setByDate(dateRes.data.by_date || []);
    } catch {
      showToast('Failed to load administrator statistics', 'error');
    } finally {
      setLoading(false);
    }
  }, [daysPreset, showToast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <PageShell>
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Executive Operations & Analytics</h1>
          <p className="page-subtitle">BML Munjal University · Gate traffic trends, headcount metrics, and security statistics</p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          <Link to="/admin/records" className="btn-secondary btn-sm text-xs font-semibold">
            📋 Master Records
          </Link>
          <Link to="/admin/users" className="btn-secondary btn-sm text-xs font-semibold">
            👤 Staff Directory
          </Link>
          <Link to="/admin/blacklist" className="btn-secondary btn-sm text-xs font-semibold text-red-600 border-red-200 hover:bg-red-50">
            🚫 Campus Blacklist
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="card flex items-center justify-center py-28">
          <Spinner size="lg" message="Compiling university visitor analytics..." />
        </div>
      ) : (
        <div className="space-y-8">
          {/* ── Summary Metric Cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            <div className="card p-4 border-l-4 border-l-slate-800">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Visitors</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{summary?.total || 0}</div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Recorded visits</span>
            </div>

            <div className="card p-4 border-l-4 border-l-emerald-500">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Currently Inside</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">{summary?.currently_active || 0}</div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Active headcount</span>
            </div>

            <div className="card p-4 border-l-4 border-l-blue-500">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Pre-Registered</span>
              <div className="text-2xl font-black text-blue-800 mt-1">{summary?.pre_registered || 0}</div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Member scheduled</span>
            </div>

            <div className="card p-4 border-l-4 border-l-amber-500">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Walk-In Entries</span>
              <div className="text-2xl font-black text-amber-800 mt-1">{summary?.walk_in || 0}</div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Unscheduled arrivals</span>
            </div>

            <div className="card p-4 border-l-4 border-l-teal-600">
              <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">Check-Ins</span>
              <div className="text-2xl font-black text-teal-800 mt-1">{summary?.check_ins || 0}</div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Gate arrivals</span>
            </div>

            <div className="card p-4 border-l-4 border-l-red-500">
              <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider">Security Hits</span>
              <div className="text-2xl font-black text-red-700 mt-1">{summary?.blacklist_hits || 0}</div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Flagged attempts</span>
            </div>
          </div>

          {/* ── 2 Analytics Charts (R17) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Daily Gate Activity Trend (2 cols) */}
            <div className="card p-6 lg:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Gate Traffic & Activity Trends</h3>
                  <p className="text-xs text-slate-500">Daily breakdown of gate check-ins, walk-ins, and pre-registrations</p>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setDaysPreset(7)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      daysPreset === 7 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    7 Days
                  </button>
                  <button
                    onClick={() => setDaysPreset(14)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      daysPreset === 14 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    14 Days
                  </button>
                </div>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={byDate}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="visit_date"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickFormatter={(val) => val.slice(5)}
                    />
                    <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        color: '#0f172a',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="check_ins"
                      name="Check-Ins"
                      stroke="#0d9488"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="walk_ins"
                      name="Walk-Ins"
                      stroke="#ee6548"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="pre_registered"
                      name="Pre-Registered"
                      stroke="#0284c7"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Visitor Breakdown by Type (1 col) */}
            <div className="card p-6 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Visitor Demographics</h3>
                <p className="text-xs text-slate-500">Distribution by visitor classification</p>
              </div>

              {byType.length === 0 ? (
                <div className="h-72 flex items-center justify-center text-xs text-slate-400">
                  No visitor distribution data recorded
                </div>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={byType}
                        dataKey="count"
                        nameKey="visitor_type"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {byType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#e2e8f0',
                          borderRadius: '0.75rem',
                          fontSize: '12px',
                          color: '#0f172a',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        wrapperStyle={{ fontSize: '11px', textTransform: 'capitalize' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
