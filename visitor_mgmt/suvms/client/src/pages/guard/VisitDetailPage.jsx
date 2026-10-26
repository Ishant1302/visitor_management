import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import QRCodeModal from '../../components/ui/QRCodeModal';
import BlacklistWarningBanner from '../../components/ui/BlacklistWarningBanner';
import api from '../../api/axiosClient';
import { useToastContext } from '../../App';

export default function VisitDetailPage() {
  const { id } = useParams();
  const { showToast } = useToastContext();

  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [denyModalOpen, setDenyModalOpen] = useState(false);
  const [denyReason, setDenyReason] = useState('');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({ vehicle_type: 'Car', registration_number: '' });

  const fetchVisit = useCallback(async () => {
    try {
      const res = await api.get(`/visits/${id}`);
      setVisit(res.data.visit);
      if (res.data.visit?.registration_number) {
        setVehicleForm({
          vehicle_type: res.data.visit.vehicle_type || 'Car',
          registration_number: res.data.visit.registration_number || '',
        });
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Visit record not found', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchVisit();
  }, [fetchVisit]);

  // Lifecycle Action Handlers
  const handleVerify = async (override = false) => {
    setActionLoading(true);
    try {
      await api.patch(`/visits/${id}/verify`, { override });
      showToast('Visit verified successfully!', 'success');
      fetchVisit();
    } catch (err) {
      showToast(err.response?.data?.error || 'Verification failed', 'error');
      fetchVisit();
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckIn = async (override = false) => {
    setActionLoading(true);
    try {
      await api.patch(`/visits/${id}/checkin`, { override });
      showToast(`Visitor ${visit.visitor_name} checked in!`, 'success');
      fetchVisit();
    } catch (err) {
      showToast(err.response?.data?.error || 'Check-in failed', 'error');
      fetchVisit();
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      await api.patch(`/visits/${id}/checkout`, {});
      showToast(`Visitor ${visit.visitor_name} checked out!`, 'success');
      fetchVisit();
    } catch (err) {
      showToast(err.response?.data?.error || 'Check-out failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeny = async () => {
    if (!denyReason.trim()) {
      showToast('Please state a reason for denying entry', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await api.patch(`/visits/${id}/deny`, { reason: denyReason.trim() });
      showToast('Visit entry denied', 'error');
      setDenyModalOpen(false);
      fetchVisit();
    } catch (err) {
      showToast(err.response?.data?.error || 'Denial failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    if (!vehicleForm.registration_number.trim()) {
      showToast('Registration number plate is required', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await api.post(`/visits/${id}/vehicle`, vehicleForm);
      showToast('Vehicle details saved successfully', 'success');
      setVehicleModalOpen(false);
      fetchVisit();
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not save vehicle details', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="card flex items-center justify-center py-24">
          <Spinner size="lg" message="Loading visit inspection details..." />
        </div>
      </PageShell>
    );
  }

  if (!visit) {
    return (
      <PageShell>
        <div className="card py-16 text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Visit Not Found</h2>
          <p className="text-slate-500 mb-6">The requested visit record does not exist or has been removed.</p>
          <Link to="/guard" className="btn-primary">Return to Guard Dashboard</Link>
        </div>
      </PageShell>
    );
  }

  const canEditVehicle = visit.status !== 'Checked Out' && visit.status !== 'Cancelled' && visit.status !== 'Denied';

  return (
    <PageShell>
      <div className="max-w-4xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link to="/guard" className="hover:text-primary-600 transition-colors">Gate Dashboard</Link>
            <span>/</span>
            <span className="text-slate-800">Inspection Pass #{visit.visit_id}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setQrModalOpen(true)}
              className="btn-secondary btn-sm flex items-center gap-1.5 text-xs font-semibold"
            >
              <span>📱</span>
              <span>Gate QR Pass</span>
            </button>
            <Link to="/guard" className="btn-secondary btn-sm text-xs font-semibold">
              ← Dashboard
            </Link>
          </div>
        </div>

        {/* Blacklist Match Warning Alert (R21) */}
        {visit.blacklist_match && (
          <BlacklistWarningBanner
            blacklistMatch={visit.blacklist_match}
            onOverride={() => {
              if (visit.status === 'Expected') handleVerify(true);
              else if (visit.status === 'Verified') handleCheckIn(true);
            }}
          />
        )}

        {/* ── Main Detail Card ── */}
        <div className="card p-6 md:p-8 space-y-8 mb-6">
          {/* Header Row: Visitor Name + Badges + Lifecycle Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-1.5">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                  {visit.visitor_name}
                </h1>
                <StatusBadge status={visit.status} />
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 capitalize">
                  {visit.visitor_type}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  [{visit.source === 'walk_in' ? 'Walk-in' : 'Pre-registered'}]
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Created on {new Date(visit.created_at).toLocaleString()} by {visit.created_by_name || 'System'}
              </p>
            </div>

            {/* Prominent Action Button based on Lifecycle */}
            <div className="flex items-center gap-3">
              {visit.status === 'Expected' && (
                <>
                  <button
                    onClick={() => handleVerify(false)}
                    disabled={actionLoading}
                    className="btn-primary px-6 py-2.5 text-sm font-bold bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20"
                  >
                    {actionLoading ? 'Processing...' : '✓ Verify Visitor'}
                  </button>
                  <button
                    onClick={() => setDenyModalOpen(true)}
                    className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 text-sm font-semibold"
                  >
                    Deny Entry
                  </button>
                </>
              )}

              {visit.status === 'Verified' && (
                <>
                  <button
                    onClick={() => handleCheckIn(false)}
                    disabled={actionLoading}
                    className="btn-primary px-8 py-3 text-base font-extrabold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 animate-pulse"
                  >
                    {actionLoading ? 'Processing...' : '📥 Check-In Now'}
                  </button>
                  <button
                    onClick={() => setDenyModalOpen(true)}
                    className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 text-sm font-semibold"
                  >
                    Deny Entry
                  </button>
                </>
              )}

              {visit.status === 'Checked In' && (
                <button
                  onClick={handleCheckOut}
                  disabled={actionLoading}
                  className="btn-teal px-8 py-3 text-base font-extrabold"
                >
                  {actionLoading ? 'Processing...' : '🚪 Check-Out Visitor'}
                </button>
              )}
            </div>
          </div>

          {/* 3 Information Grid Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Visitor Information */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-primary-600 uppercase tracking-wider flex items-center gap-2">
                <span>👤</span>
                <span>Visitor Information</span>
              </h3>
              <div className="text-xs space-y-2 text-slate-700">
                <div>
                  <span className="text-slate-500">Phone Number:</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5 font-mono">{visit.visitor_phone}</div>
                </div>
                <div>
                  <span className="text-slate-500">Category:</span>
                  <div className="text-slate-900 capitalize font-medium mt-0.5">{visit.visitor_type}</div>
                </div>
                {visit.relationship && (
                  <div>
                    <span className="text-slate-500">Relationship / Affiliation:</span>
                    <div className="text-slate-900 font-medium mt-0.5">{visit.relationship}</div>
                  </div>
                )}
                {visit.id_info && (
                  <div>
                    <span className="text-slate-500">ID Verification Info:</span>
                    <div className="text-slate-800 font-mono mt-0.5">{visit.id_info}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Host & Department */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-primary-600 uppercase tracking-wider flex items-center gap-2">
                <span>🏛️</span>
                <span>Host Destination</span>
              </h3>
              <div className="text-xs space-y-2 text-slate-700">
                <div>
                  <span className="text-slate-500">Host Member:</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    {visit.host_name || 'N/A (Visiting Department)'}
                  </div>
                </div>
                {visit.host_email && (
                  <div>
                    <span className="text-slate-500">Host Email:</span>
                    <div className="text-slate-800 font-mono mt-0.5">{visit.host_email}</div>
                  </div>
                )}
                <div>
                  <span className="text-slate-500">Department / Office:</span>
                  <div className="text-slate-900 font-medium mt-0.5">{visit.department_name || 'Campus Wide'}</div>
                </div>
                {visit.host_member_type && (
                  <div>
                    <span className="text-slate-500">Member Classification:</span>
                    <div className="text-slate-800 uppercase font-semibold mt-0.5">{visit.host_member_type}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: Timing & Status Lifecycle */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-primary-600 uppercase tracking-wider flex items-center gap-2">
                <span>⏱️</span>
                <span>Gate Timestamps</span>
              </h3>
              <div className="text-xs space-y-2 text-slate-700">
                <div>
                  <span className="text-slate-500">Expected Arrival:</span>
                  <div className="text-slate-900 font-medium mt-0.5">
                    {visit.expected_date} {visit.expected_time ? `at ${visit.expected_time}` : ''}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Gate Check-In Time:</span>
                  <div className="mt-0.5">
                    {visit.check_in_time ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                        {new Date(visit.check_in_time).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Not checked in yet</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Gate Check-Out Time:</span>
                  <div className="mt-0.5">
                    {visit.check_out_time ? (
                      <span className="text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">
                        {new Date(visit.check_out_time).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Not checked out yet</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Section (R5) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-primary-600 uppercase tracking-wider flex items-center gap-2">
                <span>🚗</span>
                <span>Vehicle Information</span>
              </h3>
              {canEditVehicle && (
                <button
                  type="button"
                  onClick={() => setVehicleModalOpen(true)}
                  className="btn-secondary btn-sm text-xs"
                >
                  {visit.registration_number ? 'Edit Vehicle Details' : '+ Add Vehicle'}
                </button>
              )}
            </div>

            {visit.registration_number ? (
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div>
                  <span className="text-xs text-slate-500">Vehicle Type:</span>
                  <div className="font-bold text-slate-900 mt-0.5">{visit.vehicle_type}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Number Plate / Registration:</span>
                  <div className="font-mono font-bold text-slate-900 text-base mt-0.5 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 inline-block">
                    {visit.registration_number}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                No vehicle registered for this visit. {canEditVehicle && 'Guards can record vehicle details before departure.'}
              </p>
            )}
          </div>

          {/* Purpose & Notes Section */}
          <div className="space-y-3">
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Purpose of Visit</h3>
              <p className="text-sm text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-200">
                {visit.purpose}
              </p>
            </div>

            {visit.notes && (
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Gate Notes / Security Remarks</h3>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono">
                  {visit.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deny Modal */}
      <Modal
        isOpen={denyModalOpen}
        onClose={() => setDenyModalOpen(false)}
        title="Deny Visitor Gate Entry"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Please record the reason for denying entry for <strong className="text-slate-900">{visit.visitor_name}</strong>:
          </p>
          <textarea
            rows={3}
            value={denyReason}
            onChange={(e) => setDenyReason(e.target.value)}
            placeholder="e.g. Failed identity verification, Host not available, Blacklist match, Suspicious behavior"
            className="input text-sm"
          />
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              onClick={() => setDenyModalOpen(false)}
              className="btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleDeny}
              disabled={actionLoading}
              className="btn-danger btn-sm text-xs font-bold"
            >
              {actionLoading ? 'Denying...' : 'Confirm Entry Denial'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Vehicle Add / Edit Modal */}
      <Modal
        isOpen={vehicleModalOpen}
        onClose={() => setVehicleModalOpen(false)}
        title={visit.registration_number ? "Edit Vehicle Details" : "Record Vehicle Details"}
      >
        <form onSubmit={handleSaveVehicle} className="space-y-4">
          <div>
            <label className="label">Vehicle Type</label>
            <select
              value={vehicleForm.vehicle_type}
              onChange={(e) => setVehicleForm(f => ({ ...f, vehicle_type: e.target.value }))}
              className="input cursor-pointer"
            >
              <option value="Car">Car / Sedan / SUV</option>
              <option value="Two-Wheeler">Two-Wheeler (Motorcycle / Scooter)</option>
              <option value="Auto">Auto Rickshaw</option>
              <option value="Van">Van / Delivery Truck</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="label">Vehicle Number Plate *</label>
            <input
              type="text"
              value={vehicleForm.registration_number}
              onChange={(e) => setVehicleForm(f => ({ ...f, registration_number: e.target.value }))}
              placeholder="e.g. MH-12-AB-1234"
              className="input uppercase font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setVehicleModalOpen(false)}
              className="btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="btn-primary btn-sm"
            >
              Save Vehicle
            </button>
          </div>
        </form>
      </Modal>

      {/* Digital QR Pass Modal */}
      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        visit={visit}
      />
    </PageShell>
  );
}
