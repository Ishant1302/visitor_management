import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import QRCodeModal from '../../components/ui/QRCodeModal';
import api from '../../api/axiosClient';
import { useToastContext } from '../../App';

export default function MyVisitorsPage() {
  const { showToast } = useToastContext();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Cancel Modal state
  const [cancelModal, setCancelModal] = useState({ isOpen: false, visit: null, cancelling: false });

  // QR Modal state
  const [qrModal, setQrModal] = useState({ isOpen: false, visit: null });

  const fetchVisits = useCallback(async () => {
    try {
      const res = await api.get('/visits/my');
      setVisits(res.data.visits || []);
    } catch {
      showToast('Failed to load visitor registrations', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const handleCancelClick = (visit) => {
    setCancelModal({ isOpen: true, visit, cancelling: false });
  };

  const confirmCancel = async () => {
    if (!cancelModal.visit) return;
    setCancelModal(prev => ({ ...prev, cancelling: true }));
    try {
      await api.patch(`/visits/${cancelModal.visit.visit_id}/cancel`);
      showToast(`Visit for ${cancelModal.visit.visitor_name} has been cancelled`, 'success');
      setCancelModal({ isOpen: false, visit: null, cancelling: false });
      fetchVisits();
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not cancel visit';
      showToast(msg, 'error');
      setCancelModal(prev => ({ ...prev, cancelling: false }));
    }
  };

  const filteredVisits = visits.filter(v => {
    const matchesSearch = !search || 
      v.visitor_name.toLowerCase().includes(search.toLowerCase()) ||
      v.visitor_phone.includes(search) ||
      v.purpose.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <PageShell>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">My Visitor Registrations</h1>
          <p className="page-subtitle">BML Munjal University · Manage expected guests, QR gate passes, and arrival history</p>
        </div>
        <Link to="/member/pre-register" className="btn-primary flex items-center justify-center gap-2 self-start sm:self-auto text-xs">
          <span>➕</span>
          <span>Pre-Register Visitor</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="card mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-3 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Search by visitor name, phone, purpose..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input md:w-44 cursor-pointer text-sm"
            >
              <option value="ALL">All Statuses</option>
              <option value="Expected">Expected</option>
              <option value="Verified">Verified</option>
              <option value="Checked In">Checked In</option>
              <option value="Checked Out">Checked Out</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Denied">Denied</option>
            </select>
            {(search || statusFilter !== 'ALL') && (
              <button
                onClick={() => { setSearch(''); setStatusFilter('ALL'); }}
                className="btn-ghost text-xs text-slate-500 hover:text-slate-900"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Visitor List Content */}
      {loading ? (
        <div className="card flex items-center justify-center py-20">
          <Spinner size="lg" message="Loading your visitor records..." />
        </div>
      ) : filteredVisits.length === 0 ? (
        <div className="card py-12">
          <EmptyState
            icon="👥"
            title={visits.length === 0 ? "No visitors registered yet" : "No matching visitors found"}
            message={visits.length === 0 
              ? "Pre-register expected visitors in advance so security guards can clear them swiftly at the campus gates."
              : "Try adjusting your search keywords or status filter."}
            action={visits.length === 0 && (
              <Link to="/member/pre-register" className="btn-primary mt-2 text-xs">
                Pre-register a Visitor Now
              </Link>
            )}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredVisits.map((visit) => (
            <div
              key={visit.visit_id}
              className="card hover:border-slate-300 transition-all duration-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
            >
              {/* Left Column: Visitor Details */}
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-base font-bold text-slate-900 tracking-tight">
                    {visit.visitor_name}
                  </span>
                  <StatusBadge status={visit.status} />
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold capitalize">
                    {visit.visitor_type}
                  </span>
                  {visit.relationship && (
                    <span className="text-xs text-slate-500">
                      ({visit.relationship})
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
                  <span>📞 <strong className="font-mono text-slate-700">{visit.visitor_phone}</strong></span>
                  <span>📅 Expected: <strong className="text-slate-800">{visit.expected_date} {visit.expected_time || ''}</strong></span>
                  {visit.registration_number && (
                    <span>🚗 <span className="font-mono text-slate-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">{visit.vehicle_type} ({visit.registration_number})</span></span>
                  )}
                </div>

                <p className="text-xs text-slate-600 pt-1">
                  <span className="text-slate-400 font-semibold">Purpose: </span>
                  {visit.purpose}
                </p>

                {/* Gate Timestamps if present */}
                {(visit.check_in_time || visit.check_out_time) && (
                  <div className="text-[11px] flex flex-wrap gap-x-4 pt-1 border-t border-slate-100 mt-2">
                    {visit.check_in_time && (
                      <span className="text-emerald-700 font-semibold">
                        ✓ In: {new Date(visit.check_in_time).toLocaleString()}
                      </span>
                    )}
                    {visit.check_out_time && (
                      <span className="text-slate-500">
                        ✕ Out: {new Date(visit.check_out_time).toLocaleString()}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Actions */}
              <div className="flex items-center gap-2.5 self-end md:self-center flex-shrink-0">
                {/* QR Pass Button */}
                <button
                  type="button"
                  onClick={() => setQrModal({ isOpen: true, visit })}
                  className="btn-secondary btn-sm flex items-center gap-1.5 text-xs font-semibold"
                  title="View Digital QR Gate Pass"
                >
                  <span>📱</span>
                  <span>QR Pass</span>
                </button>

                {/* Cancel Button (only for Expected visits per SRS) */}
                {visit.status === 'Expected' && (
                  <button
                    type="button"
                    onClick={() => handleCancelClick(visit)}
                    className="btn-sm bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors text-xs font-bold"
                  >
                    Cancel Visit
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={cancelModal.isOpen}
        onClose={() => setCancelModal({ isOpen: false, visit: null, cancelling: false })}
        title="Confirm Visit Cancellation"
      >
        <div className="space-y-4 text-slate-700">
          <p className="text-sm">
            Are you sure you want to cancel the pre-registered visit for{' '}
            <strong className="text-slate-900">{cancelModal.visit?.visitor_name}</strong> scheduled on{' '}
            <strong className="text-slate-900">{cancelModal.visit?.expected_date}</strong>?
          </p>
          <p className="text-xs text-slate-500">
            Security guards will no longer see this pre-registration on their expected arrivals list.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setCancelModal({ isOpen: false, visit: null, cancelling: false })}
              className="btn-secondary btn-sm"
              disabled={cancelModal.cancelling}
            >
              Keep Visit
            </button>
            <button
              type="button"
              onClick={confirmCancel}
              className="btn-danger btn-sm text-xs font-bold"
              disabled={cancelModal.cancelling}
            >
              {cancelModal.cancelling ? 'Cancelling...' : 'Yes, Cancel Visit'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Digital QR Pass Modal */}
      <QRCodeModal
        isOpen={qrModal.isOpen}
        onClose={() => setQrModal({ isOpen: false, visit: null })}
        visit={qrModal.visit}
      />
    </PageShell>
  );
}
