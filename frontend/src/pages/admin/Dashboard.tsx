import { useState, useEffect, useCallback } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { adminService } from '../../services';
import type { AdminStats } from '../../types';
import { toast } from '../../hooks/useToast';
import {
  Users, UserCheck, TrendingUp, LogOut, Clock, ArrowUpRight,
  Shield, GraduationCap, RefreshCw, Activity
} from 'lucide-react';

// Simple bar chart using divs
function SimpleBarChart({ data, maxVal, color }: { data: any[]; maxVal: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140, paddingTop: 8 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{d.count}</div>
          <div
            style={{
              width: '100%',
              height: maxVal > 0 ? `${Math.max((d.count / maxVal) * 100, 4)}%` : '4%',
              background: color,
              borderRadius: '4px 4px 0 0',
              transition: 'height 0.4s ease',
              position: 'relative',
            }}
          />
          <div style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
            {d.label?.split(',')[0]}
          </div>
        </div>
      ))}
    </div>
  );
}

// Donut chart
function DonutChart({ data }: { data: { name: string; value: number; fill: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let offset = 0;
  const segments = data.map(d => {
    const pct = total > 0 ? (d.value / total) * 100 : 0;
    const seg = { ...d, pct, offset };
    offset += pct;
    return seg;
  });

  const circumference = 2 * Math.PI * 40;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <svg width={100} height={100} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="18" />
        {total === 0 ? (
          <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="18" />
        ) : (
          segments.map((seg, i) => (
            <circle
              key={i}
              cx="50" cy="50" r="40"
              fill="none"
              stroke={seg.fill}
              strokeWidth="18"
              strokeDasharray={`${(seg.pct / 100) * circumference} ${circumference}`}
              strokeDashoffset={-(seg.offset / 100) * circumference}
              transform="rotate(-90 50 50)"
              style={{ transition: 'all 0.4s' }}
            />
          ))
        )}
        <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="14" fontWeight="700" fill="#0f172a">
          {total}
        </text>
        <text x="50" y="63" textAnchor="middle" fontSize="8" fill="#94a3b8">Total</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: seg.fill, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#1e293b' }}>{seg.name}</span>
            <span style={{ fontSize: 13, color: '#64748b', marginLeft: 'auto' }}>{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, a] = await Promise.all([adminService.getStats(), adminService.getAnalytics()]);
      setStats(s);
      setAnalytics(a);
    } catch {
      toast('error', 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const StatCard = ({ icon: Icon, label, value, color, sub, trend }: any) => (
    <div className="stat-card">
      <div style={{
        width: 44, height: 44, borderRadius: 10, background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>
          {loading ? <span style={{ display: 'inline-block', width: 40, height: 24, background: '#e2e8f0', borderRadius: 4 }} /> : (value ?? '—')}
        </div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color, marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
          {trend && <ArrowUpRight size={11} />} {sub}
        </div>}
      </div>
    </div>
  );

  const maxDailyCount = analytics?.dailyVisitors
    ? Math.max(...analytics.dailyVisitors.map((d: any) => d.count), 1)
    : 1;

  const maxHourCount = analytics?.peakHours
    ? Math.max(...analytics.peakHours.map((h: any) => h.count), 1)
    : 1;

  return (
    <AppLayout title="Analytics & Overview">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>Campus Analytics</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: '4px 0 0' }}>Real-time visitor management overview</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchData} disabled={loading}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Today's Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon={Users} label="Today's Visitors" value={stats?.todayVisitors} color="#2563eb" sub="Campus entries today" trend />
        <StatCard icon={Activity} label="Currently Inside" value={stats?.currentlyInside} color="#16a34a" sub="Live occupancy" />
        <StatCard icon={UserCheck} label="Check-ins Today" value={stats?.todayCheckIns} color="#0891b2" />
        <StatCard icon={LogOut} label="Check-outs Today" value={stats?.todayCheckOuts} color="#7c3aed" />
        <StatCard icon={Clock} label="Expected" value={stats?.expectedVisitors} color="#d97706" sub="Pre-registered upcoming" />
        <StatCard icon={TrendingUp} label="Walk-ins Today" value={stats?.walkIns} color="#db2777" />
        <StatCard icon={GraduationCap} label="Total Members" value={stats?.totalMembers} color="#059669" />
        <StatCard icon={Shield} label="Total Guards" value={stats?.totalGuards} color="#6366f1" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Daily Visitors Bar Chart */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>Visitor Traffic (Last 7 Days)</h3>
              <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Daily entries across the campus</p>
            </div>
          </div>
          {loading || !analytics?.dailyVisitors ? (
            <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
              Loading chart...
            </div>
          ) : (
            <SimpleBarChart
              data={analytics.dailyVisitors}
              maxVal={maxDailyCount}
              color="#2563eb"
            />
          )}
        </div>

        {/* Visit Type Donut */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>Visit Type Breakdown</h3>
          {loading || !analytics?.typeBreakdown ? (
            <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
              Loading...
            </div>
          ) : (
            <DonutChart data={analytics.typeBreakdown} />
          )}
        </div>
      </div>

      {/* Peak Hours Chart */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>Peak Entry Hours</h3>
          <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Visitor check-in times throughout the day</p>
        </div>
        {loading || !analytics?.peakHours ? (
          <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
            Loading...
          </div>
        ) : (
          <SimpleBarChart
            data={analytics.peakHours.map((h: any) => ({ ...h, label: h.label }))}
            maxVal={maxHourCount}
            color="#0891b2"
          />
        )}
      </div>

      {/* Monthly Stats Table */}
      {analytics?.monthlyStats && analytics.monthlyStats.length > 0 && (
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>Monthly Summary</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Total Visits</th>
                  <th>Completed</th>
                  <th>Completion Rate</th>
                </tr>
              </thead>
              <tbody>
                {analytics.monthlyStats.slice(-6).reverse().map((m: any) => (
                  <tr key={m.month}>
                    <td style={{ fontWeight: 600 }}>{m.label}</td>
                    <td>{m.checkIns}</td>
                    <td>{m.checkOuts}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                          <div style={{
                            height: '100%',
                            width: `${m.checkIns > 0 ? Math.min((m.checkOuts / m.checkIns) * 100, 100) : 0}%`,
                            background: '#16a34a', borderRadius: 3, transition: 'width 0.4s',
                          }} />
                        </div>
                        <span style={{ fontSize: 13, color: '#64748b', minWidth: 36 }}>
                          {m.checkIns > 0 ? Math.round((m.checkOuts / m.checkIns) * 100) : 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
