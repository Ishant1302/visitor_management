import { useState, useEffect, useCallback } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { guardService } from '../../services';
import { StatusBadge, VisitTypeBadge } from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { toast } from '../../hooks/useToast';
import type { Visit, GuardStats, VehicleType } from '../../types';
import {
  Users, UserCheck, Clock, AlertCircle, TrendingUp, LogOut,
  Search, X, Plus, Car, CheckCircle, XCircle, RefreshCw,
  Phone, MapPin, Package, Shield
} from 'lucide-react';

const VEHICLE_TYPES: VehicleType[] = ['NONE', 'CAR', 'BIKE', 'TRUCK', 'AUTO', 'OTHER'];

export default function GuardDashboard() {
  const [stats, setStats] = useState<GuardStats | null>(null);
  const [inside, setInside] = useState<Visit[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ visits: Visit[]; members: any[] } | null>(null);
  const [searching, setSearching] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'inside' | 'walkin'>('inside');
  const [confirmState, setConfirmState] = useState<{
    open: boolean; action: 'checkin' | 'checkout'; visit: Visit | null;
  }>({ open: false, action: 'checkin', visit: null });
  const [walkInData, setWalkInData] = useState({
    visitorName: '', visitorPhone: '', purpose: '', campusLocation: '',
    visitType: 'WALK_IN', vehicleType: 'NONE', vehicleNumber: '',
    idVerified: false, notes: '', deliveryCompany: '', receivingPerson: '', deliveryDest: '',
  });
  const [walkInLoading, setWalkInLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [s, ins] = await Promise.all([guardService.getStats(), guardService.getCurrentlyInside()]);
      setStats(s);
      setInside(ins);
    } catch {
      toast('error', 'Failed to load data');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await guardService.search(searchQuery.trim());
        setSearchResults(res);
      } catch { setSearchResults(null); }
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCheckIn = async () => {
    if (!confirmState.visit) return;
    setActionLoading(confirmState.visit.id);
    try {
      await guardService.checkIn(confirmState.visit.id, { idVerified: true });
      toast('success', 'Checked in', `${confirmState.visit.visitor.name} is now inside.`);
      await fetchData();
    } catch (e: any) {
      toast('error', 'Check-in failed', e?.response?.data?.error || 'Try again');
    } finally {
      setActionLoading(null);
      setConfirmState({ open: false, action: 'checkin', visit: null });
    }
  };

  const handleCheckOut = async () => {
    if (!confirmState.visit) return;
    setActionLoading(confirmState.visit.id);
    try {
      await guardService.checkOut(confirmState.visit.id);
      toast('success', 'Checked out', `${confirmState.visit.visitor.name} has exited.`);
      await fetchData();
    } catch (e: any) {
      toast('error', 'Check-out failed', e?.response?.data?.error || 'Try again');
    } finally {
      setActionLoading(null);
      setConfirmState({ open: false, action: 'checkout', visit: null });
    }
  };

  const handleWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalkInLoading(true);
    try {
      await guardService.createWalkIn(walkInData);
      toast('success', 'Walk-in registered', `${walkInData.visitorName} checked in successfully.`);
      setWalkInData({
        visitorName: '', visitorPhone: '', purpose: '', campusLocation: '',
        visitType: 'WALK_IN', vehicleType: 'NONE', vehicleNumber: '',
        idVerified: false, notes: '', deliveryCompany: '', receivingPerson: '', deliveryDest: '',
      });
      await fetchData();
      setActiveTab('inside');
    } catch (e: any) {
      toast('error', 'Registration failed', e?.response?.data?.error || 'Try again');
    } finally {
      setWalkInLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color, sub }: any) => (
    <div className="stat-card">
      <div style={{
        width: 44, height: 44, borderRadius: 10, background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{value ?? '—'}</div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: color, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );

  return (
    <AppLayout title="Gate Dashboard">
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px,1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon={Users} label="Today's Traffic" value={stats?.todayTotal} color="#2563eb" />
        <StatCard icon={UserCheck} label="Currently Inside" value={stats?.currentlyInside} color="#16a34a" sub="Live count" />
        <StatCard icon={Clock} label="Expected Today" value={stats?.expectedToday} color="#d97706" />
        <StatCard icon={AlertCircle} label="Pending Verification" value={stats?.pendingVerification} color="#dc2626" />
        <StatCard icon={TrendingUp} label="Walk-ins Today" value={stats?.walkInsToday} color="#7c3aed" />
        <StatCard icon={LogOut} label="Checked Out" value={stats?.checkedOutToday} color="#0891b2" />
      </div>

      {/* Search */}
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: searchResults ? 16 : 0 }}>
          <div className="search-bar" style={{ flex: 1 }}>
            <Search size={16} color="#94a3b8" />
            <input
              id="guard-search-input"
              placeholder="Search visitor name, phone, vehicle number, member name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
                <X size={14} />
              </button>
            )}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchData}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {searching && (
          <div style={{ textAlign: 'center', padding: '12px 0', color: '#64748b', fontSize: 13 }}>Searching...</div>
        )}

        {searchResults && !searching && (
          <div>
            {searchResults.visits.length === 0 && searchResults.members.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: '#94a3b8', fontSize: 14 }}>No results found</div>
            ) : (
              <>
                {searchResults.visits.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                      Active Visits
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {searchResults.visits.map((v: Visit) => (
                        <div key={v.id} style={{
                          border: '1px solid #e2e8f0', borderRadius: 8, padding: 12,
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{v.visitor.name}</div>
                            <div style={{ fontSize: 12, color: '#64748b', display: 'flex', gap: 12, marginTop: 2, flexWrap: 'wrap' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={11} />{v.visitor.phone}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} />{v.campusLocation}</span>
                              {v.vehicleNumber && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Car size={11} />{v.vehicleNumber}</span>}
                            </div>
                            <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              <StatusBadge status={v.status} />
                              <VisitTypeBadge type={v.visitType} />
                              {v.hostMember && <span style={{ fontSize: 12, color: '#64748b' }}>Host: {v.hostMember.name}</span>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                            {(v.status === 'EXPECTED' || v.status === 'PENDING_VERIFICATION') && (
                              <button
                                className="btn btn-success btn-sm"
                                id={`checkin-btn-${v.id}`}
                                onClick={() => setConfirmState({ open: true, action: 'checkin', visit: v })}
                                disabled={actionLoading === v.id}
                              >
                                <CheckCircle size={14} /> Check In
                              </button>
                            )}
                            {v.status === 'CHECKED_IN' && (
                              <button
                                className="btn btn-secondary btn-sm"
                                id={`checkout-btn-${v.id}`}
                                onClick={() => setConfirmState({ open: true, action: 'checkout', visit: v })}
                                disabled={actionLoading === v.id}
                              >
                                <XCircle size={14} /> Check Out
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="card">
        <div style={{ borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 0 }}>
          {(['inside', 'walkin'] as const).map(tab => (
            <button
              key={tab}
              id={`tab-${tab}`}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 20px', fontSize: 14, fontWeight: 500,
                background: 'none', border: 'none', cursor: 'pointer',
                color: activeTab === tab ? '#1e40af' : '#64748b',
                borderBottom: activeTab === tab ? '2px solid #1e40af' : '2px solid transparent',
                marginBottom: -1, transition: 'all 0.15s',
              }}
            >
              {tab === 'inside' ? (
                <><UserCheck size={15} style={{ display: 'inline', marginRight: 6 }} />Currently Inside ({inside.length})</>
              ) : (
                <><Plus size={15} style={{ display: 'inline', marginRight: 6 }} />Register Walk-in</>
              )}
            </button>
          ))}
        </div>

        {/* Currently Inside */}
        {activeTab === 'inside' && (
          <div>
            {loadingStats ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
            ) : inside.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <UserCheck size={40} style={{ color: '#cbd5e1', marginBottom: 8 }} />
                <p style={{ color: '#94a3b8', fontSize: 14 }}>No visitors currently inside the campus</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Visitor</th>
                      <th>Contact</th>
                      <th>Location</th>
                      <th>Entry Time</th>
                      <th>Host</th>
                      <th>Type</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inside.map(v => (
                      <tr key={v.id}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{v.visitor.name}</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>{v.purpose}</div>
                        </td>
                        <td style={{ fontSize: 13, color: '#64748b' }}>{v.visitor.phone}</td>
                        <td style={{ fontSize: 13 }}>{v.campusLocation}</td>
                        <td style={{ fontSize: 13, color: '#64748b' }}>
                          {v.actualEntryTime ? new Date(v.actualEntryTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td style={{ fontSize: 13 }}>{v.hostMember?.name || <span style={{ color: '#94a3b8' }}>Walk-in</span>}</td>
                        <td><VisitTypeBadge type={v.visitType} /></td>
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            id={`inside-checkout-${v.id}`}
                            onClick={() => setConfirmState({ open: true, action: 'checkout', visit: v })}
                            disabled={actionLoading === v.id}
                          >
                            <LogOut size={13} /> Check Out
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Walk-in Registration Form */}
        {activeTab === 'walkin' && (
          <form onSubmit={handleWalkIn} style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Visitor Name *
                </label>
                <input
                  id="walkin-visitor-name"
                  className="form-input"
                  required
                  placeholder="Full name"
                  value={walkInData.visitorName}
                  onChange={e => setWalkInData(d => ({ ...d, visitorName: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Phone Number *
                </label>
                <input
                  id="walkin-visitor-phone"
                  className="form-input"
                  required
                  placeholder="10-digit mobile"
                  value={walkInData.visitorPhone}
                  onChange={e => setWalkInData(d => ({ ...d, visitorPhone: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Visit Type *
                </label>
                <select
                  id="walkin-visit-type"
                  className="form-input"
                  value={walkInData.visitType}
                  onChange={e => setWalkInData(d => ({ ...d, visitType: e.target.value }))}
                >
                  <option value="WALK_IN">Walk-in</option>
                  <option value="DELIVERY">Delivery</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Campus Location *
                </label>
                <input
                  id="walkin-campus-location"
                  className="form-input"
                  required
                  placeholder="e.g. Gate 1, Academic Block"
                  value={walkInData.campusLocation}
                  onChange={e => setWalkInData(d => ({ ...d, campusLocation: e.target.value }))}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Purpose *
                </label>
                <input
                  id="walkin-purpose"
                  className="form-input"
                  required
                  placeholder="Reason for visit"
                  value={walkInData.purpose}
                  onChange={e => setWalkInData(d => ({ ...d, purpose: e.target.value }))}
                />
              </div>

              {walkInData.visitType === 'DELIVERY' && (
                <>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                      <Package size={13} style={{ display: 'inline', marginRight: 4 }} />Delivery Company
                    </label>
                    <input className="form-input" placeholder="Company name" value={walkInData.deliveryCompany}
                      onChange={e => setWalkInData(d => ({ ...d, deliveryCompany: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                      Receiving Person
                    </label>
                    <input className="form-input" placeholder="Who is receiving?" value={walkInData.receivingPerson}
                      onChange={e => setWalkInData(d => ({ ...d, receivingPerson: e.target.value }))} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                      Delivery Destination
                    </label>
                    <input className="form-input" placeholder="Destination on campus" value={walkInData.deliveryDest}
                      onChange={e => setWalkInData(d => ({ ...d, deliveryDest: e.target.value }))} />
                  </div>
                </>
              )}

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  <Car size={13} style={{ display: 'inline', marginRight: 4 }} />Vehicle Type
                </label>
                <select
                  id="walkin-vehicle-type"
                  className="form-input"
                  value={walkInData.vehicleType}
                  onChange={e => setWalkInData(d => ({ ...d, vehicleType: e.target.value }))}
                >
                  {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {walkInData.vehicleType !== 'NONE' && (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                    Vehicle Number
                  </label>
                  <input
                    id="walkin-vehicle-number"
                    className="form-input"
                    placeholder="e.g. KA01AB1234"
                    value={walkInData.vehicleNumber}
                    onChange={e => setWalkInData(d => ({ ...d, vehicleNumber: e.target.value }))}
                  />
                </div>
              )}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Notes
                </label>
                <textarea
                  id="walkin-notes"
                  className="form-input"
                  rows={2}
                  placeholder="Additional notes..."
                  value={walkInData.notes}
                  onChange={e => setWalkInData(d => ({ ...d, notes: e.target.value }))}
                />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  id="walkin-id-verified"
                  type="checkbox"
                  checked={walkInData.idVerified}
                  onChange={e => setWalkInData(d => ({ ...d, idVerified: e.target.checked }))}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="walkin-id-verified" style={{ fontSize: 14, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Shield size={14} color="#16a34a" /> ID Verified
                </label>
              </div>
            </div>
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('inside')}>Cancel</button>
              <button id="walkin-submit" type="submit" className="btn btn-success" disabled={walkInLoading}>
                <CheckCircle size={15} />
                {walkInLoading ? 'Registering...' : 'Register & Check In'}
              </button>
            </div>
          </form>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmState.open}
        onClose={() => setConfirmState({ open: false, action: 'checkin', visit: null })}
        onConfirm={confirmState.action === 'checkin' ? handleCheckIn : handleCheckOut}
        title={confirmState.action === 'checkin' ? 'Confirm Check-In' : 'Confirm Check-Out'}
        message={
          confirmState.action === 'checkin'
            ? `Check in ${confirmState.visit?.visitor.name}? This will mark them as currently inside the campus.`
            : `Check out ${confirmState.visit?.visitor.name}? This will record their exit time.`
        }
        confirmLabel={confirmState.action === 'checkin' ? 'Check In' : 'Check Out'}
        isLoading={!!actionLoading}
      />
    </AppLayout>
  );
}
