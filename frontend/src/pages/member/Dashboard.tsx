import { useState, useEffect, useCallback } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { visitsService } from '../../services';
import { StatusBadge, VisitTypeBadge } from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { toast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import type { Visit, VehicleType } from '../../types';
import {
  Plus, Clock, CheckCircle, XCircle, CalendarDays, Car, Phone,
  MapPin, FileText, RefreshCw, X, ChevronRight, User
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const CAMPUS_LOCATIONS = [
  'Gate 1', 'Gate 2', 'Hostel', 'Academic Block', 'Admin Block', 'Library', 'Sports Complex', 'Cafeteria',
];
const VEHICLE_TYPES: VehicleType[] = ['NONE', 'CAR', 'BIKE', 'TRUCK', 'AUTO', 'OTHER'];

const emptyForm = {
  visitorName: '', visitorPhone: '', purpose: '', campusLocation: CAMPUS_LOCATIONS[0],
  expectedDate: format(new Date(), 'yyyy-MM-dd'), expectedTime: '', expectedDuration: '',
  vehicleType: 'NONE' as VehicleType, vehicleNumber: '', notes: '',
};

export default function MemberDashboard() {
  const { user } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<Visit | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchVisits = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page: 1, limit: 50 };
      if (statusFilter) params.status = statusFilter;
      const data = await visitsService.getMyVisits(params);
      setVisits(data.visits || data);
      setTotal(data.total || data.length || 0);
    } catch {
      toast('error', 'Failed to load visits');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchVisits(); }, [fetchVisits]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await visitsService.create(formData);
      toast('success', 'Visit registered', 'Your visitor will receive a confirmation.');
      setFormData(emptyForm);
      setShowForm(false);
      await fetchVisits();
    } catch (e: any) {
      toast('error', 'Registration failed', e?.response?.data?.error || 'Please try again');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelConfirm) return;
    setCancelLoading(true);
    try {
      await visitsService.cancel(cancelConfirm.id);
      toast('success', 'Visit cancelled');
      setSelectedVisit(null);
      setCancelConfirm(null);
      await fetchVisits();
    } catch (e: any) {
      toast('error', 'Cancellation failed', e?.response?.data?.error || 'Try again');
    } finally {
      setCancelLoading(false);
    }
  };

  // Quick stats
  const expected = visits.filter(v => v.status === 'EXPECTED').length;
  const checkedIn = visits.filter(v => v.status === 'CHECKED_IN').length;
  const checkedOut = visits.filter(v => v.status === 'CHECKED_OUT').length;
  const cancelled = visits.filter(v => v.status === 'CANCELLED').length;

  return (
    <AppLayout title="My Dashboard">
      {/* Welcome */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
        borderRadius: 12, padding: '20px 24px', marginBottom: 24, color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Welcome back, {user?.name?.split(' ')[0]}!</div>
          <div style={{ fontSize: 14, opacity: 0.85, marginTop: 2 }}>
            {user?.member?.department} · {user?.member?.memberType}
          </div>
        </div>
        <button
          id="register-visitor-btn"
          className="btn"
          onClick={() => setShowForm(true)}
          style={{ background: 'white', color: '#1e40af', fontWeight: 600 }}
        >
          <Plus size={15} /> Pre-Register Visitor
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Visits', value: total, color: '#2563eb' },
          { label: 'Expected', value: expected, color: '#d97706' },
          { label: 'Checked In', value: checkedIn, color: '#16a34a' },
          { label: 'Checked Out', value: checkedOut, color: '#0891b2' },
          { label: 'Cancelled', value: cancelled, color: '#dc2626' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ padding: '16px 20px' }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter + List */}
      <div className="card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>My Visit Requests</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              id="status-filter"
              className="form-input"
              style={{ width: 180, padding: '6px 10px' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="EXPECTED">Expected</option>
              <option value="PENDING_VERIFICATION">Pending Verification</option>
              <option value="CHECKED_IN">Checked In</option>
              <option value="CHECKED_OUT">Checked Out</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <button className="btn btn-secondary btn-sm" onClick={fetchVisits}><RefreshCw size={14} /></button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Loading your visits...</div>
        ) : visits.length === 0 ? (
          <div style={{ padding: 64, textAlign: 'center' }}>
            <CalendarDays size={40} style={{ color: '#cbd5e1', marginBottom: 12 }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: '#475569', margin: 0 }}>No visits yet</p>
            <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>Pre-register your first visitor using the button above.</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowForm(true)}>
              <Plus size={14} /> Register Visitor
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Visitor</th>
                  <th>Purpose</th>
                  <th>Location</th>
                  <th>Expected</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visits.map(v => (
                  <tr key={v.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedVisit(v)}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{v.visitor.name}</div>
                      <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Phone size={11} />{v.visitor.phone}
                      </div>
                    </td>
                    <td style={{ fontSize: 13, maxWidth: 200 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.purpose}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} color="#94a3b8" />{v.campusLocation}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: '#64748b' }}>
                      {v.expectedDate
                        ? format(parseISO(v.expectedDate), 'd MMM yyyy')
                        : '—'}
                      {v.expectedTime && <div style={{ fontSize: 11 }}>{v.expectedTime}</div>}
                    </td>
                    <td><StatusBadge status={v.status} /></td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          id={`view-visit-${v.id}`}
                          onClick={() => setSelectedVisit(v)}
                        >
                          <ChevronRight size={13} /> View
                        </button>
                        {(v.status === 'EXPECTED') && (
                          <button
                            className="btn btn-sm"
                            id={`cancel-visit-${v.id}`}
                            style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                            onClick={() => setCancelConfirm(v)}
                          >
                            <X size={13} /> Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pre-Register Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>Pre-Register a Visitor</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                    <User size={12} style={{ display: 'inline', marginRight: 4 }} />Visitor Name *
                  </label>
                  <input className="form-input" required placeholder="Full name" value={formData.visitorName}
                    onChange={e => setFormData(d => ({ ...d, visitorName: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                    <Phone size={12} style={{ display: 'inline', marginRight: 4 }} />Phone Number *
                  </label>
                  <input className="form-input" required placeholder="10-digit phone" value={formData.visitorPhone}
                    onChange={e => setFormData(d => ({ ...d, visitorPhone: e.target.value }))} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                    <FileText size={12} style={{ display: 'inline', marginRight: 4 }} />Purpose of Visit *
                  </label>
                  <input className="form-input" required placeholder="Why is the visitor coming?" value={formData.purpose}
                    onChange={e => setFormData(d => ({ ...d, purpose: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                    <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />Campus Location *
                  </label>
                  <select className="form-input" value={formData.campusLocation}
                    onChange={e => setFormData(d => ({ ...d, campusLocation: e.target.value }))}>
                    {CAMPUS_LOCATIONS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                    <CalendarDays size={12} style={{ display: 'inline', marginRight: 4 }} />Expected Date *
                  </label>
                  <input className="form-input" type="date" required value={formData.expectedDate}
                    onChange={e => setFormData(d => ({ ...d, expectedDate: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                    Expected Time
                  </label>
                  <input className="form-input" type="time" value={formData.expectedTime}
                    onChange={e => setFormData(d => ({ ...d, expectedTime: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                    Expected Duration
                  </label>
                  <input className="form-input" placeholder="e.g. 1 hour" value={formData.expectedDuration}
                    onChange={e => setFormData(d => ({ ...d, expectedDuration: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                    <Car size={12} style={{ display: 'inline', marginRight: 4 }} />Vehicle Type
                  </label>
                  <select className="form-input" value={formData.vehicleType}
                    onChange={e => setFormData(d => ({ ...d, vehicleType: e.target.value as VehicleType }))}>
                    {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                {formData.vehicleType !== 'NONE' && (
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                      Vehicle Number
                    </label>
                    <input className="form-input" placeholder="e.g. KA01AB1234" value={formData.vehicleNumber}
                      onChange={e => setFormData(d => ({ ...d, vehicleNumber: e.target.value }))} />
                  </div>
                )}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                    Notes
                  </label>
                  <textarea className="form-input" rows={2} placeholder="Additional information..." value={formData.notes}
                    onChange={e => setFormData(d => ({ ...d, notes: e.target.value }))} />
                </div>
              </div>
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button id="register-visitor-submit" type="submit" className="btn btn-primary" disabled={formLoading}>
                  <Plus size={15} />{formLoading ? 'Registering...' : 'Register Visitor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Visit Detail Side Panel */}
      {selectedVisit && (
        <div className="panel-overlay" onClick={() => setSelectedVisit(null)}>
          <div className="panel" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>Visit Details</h2>
              <button onClick={() => setSelectedVisit(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{selectedVisit.visitor.name}</div>
                <div style={{ fontSize: 14, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <Phone size={13} /> {selectedVisit.visitor.phone}
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                  <StatusBadge status={selectedVisit.status} />
                  <VisitTypeBadge type={selectedVisit.visitType} />
                </div>
              </div>

              {[
                { label: 'Purpose', value: selectedVisit.purpose },
                { label: 'Campus Location', value: selectedVisit.campusLocation },
                { label: 'Expected Date', value: selectedVisit.expectedDate ? format(parseISO(selectedVisit.expectedDate), 'd MMMM yyyy') : '—' },
                { label: 'Expected Time', value: selectedVisit.expectedTime || '—' },
                { label: 'Expected Duration', value: selectedVisit.expectedDuration || '—' },
                { label: 'Vehicle', value: selectedVisit.vehicleType !== 'NONE' ? `${selectedVisit.vehicleType}${selectedVisit.vehicleNumber ? ` · ${selectedVisit.vehicleNumber}` : ''}` : 'None' },
                { label: 'Entry Time', value: selectedVisit.actualEntryTime ? format(parseISO(selectedVisit.actualEntryTime), 'd MMM yyyy, hh:mm a') : '—' },
                { label: 'Exit Time', value: selectedVisit.actualExitTime ? format(parseISO(selectedVisit.actualExitTime), 'd MMM yyyy, hh:mm a') : '—' },
                { label: 'ID Verified', value: selectedVisit.idVerified ? '✓ Yes' : '✗ No' },
                ...(selectedVisit.notes ? [{ label: 'Notes', value: selectedVisit.notes }] : []),
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', width: 140, flexShrink: 0 }}>{row.label}</div>
                  <div style={{ fontSize: 14, color: '#1e293b' }}>{row.value}</div>
                </div>
              ))}

              {selectedVisit.status === 'EXPECTED' && (
                <div style={{ marginTop: 24, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => { setCancelConfirm(selectedVisit); }}
                  >
                    <XCircle size={13} /> Cancel Visit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!cancelConfirm}
        onClose={() => setCancelConfirm(null)}
        onConfirm={handleCancel}
        title="Cancel Visit"
        message={`Are you sure you want to cancel the visit for ${cancelConfirm?.visitor.name}? This action cannot be undone.`}
        confirmLabel="Cancel Visit"
        danger
        isLoading={cancelLoading}
      />
    </AppLayout>
  );
}
