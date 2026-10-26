import { useState, useEffect, useCallback } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { recordsService } from '../../services';
import { StatusBadge, VisitTypeBadge } from '../../components/ui/Badge';
import type { Visit } from '../../types';
import {
  Search, X, Filter, ChevronLeft, ChevronRight, RefreshCw,
  Download, MapPin, Phone, Car, Eye
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function VisitorRecords() {
  const [records, setRecords] = useState<Visit[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const LIMIT = 50;

  const [filters, setFilters] = useState({
    visitorName: '', hostName: '', status: '', type: '', vehicleNumber: '',
    dateFrom: '', dateTo: '',
  });
  const [applied, setApplied] = useState(filters);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: LIMIT };
      if (applied.visitorName) params.visitorName = applied.visitorName;
      if (applied.hostName) params.hostName = applied.hostName;
      if (applied.status) params.status = applied.status;
      if (applied.type) params.type = applied.type;
      if (applied.vehicleNumber) params.vehicleNumber = applied.vehicleNumber;
      if (applied.dateFrom) params.dateFrom = applied.dateFrom;
      if (applied.dateTo) params.dateTo = applied.dateTo;
      const data = await recordsService.getAll(params);
      setRecords(data.records || []);
      setTotal(data.total || 0);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [page, applied]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const applyFilters = () => {
    setApplied(filters);
    setPage(1);
    setShowFilters(false);
  };

  const clearFilters = () => {
    const empty = { visitorName: '', hostName: '', status: '', type: '', vehicleNumber: '', dateFrom: '', dateTo: '' };
    setFilters(empty);
    setApplied(empty);
    setPage(1);
  };

  const activeFilterCount = Object.values(applied).filter(v => v).length;
  const totalPages = Math.ceil(total / LIMIT);

  // Export to CSV
  const exportCSV = () => {
    if (records.length === 0) return;
    const headers = ['Visitor Name', 'Phone', 'Host', 'Type', 'Status', 'Location', 'Purpose', 'Expected Date', 'Entry Time', 'Exit Time', 'Vehicle', 'ID Verified'];
    const rows = records.map(v => [
      v.visitor.name, v.visitor.phone,
      v.hostMember?.name || 'Walk-in',
      v.visitType, v.status, v.campusLocation, v.purpose,
      v.expectedDate ? format(parseISO(v.expectedDate), 'dd/MM/yyyy') : '',
      v.actualEntryTime ? format(parseISO(v.actualEntryTime), 'dd/MM/yyyy HH:mm') : '',
      v.actualExitTime ? format(parseISO(v.actualExitTime), 'dd/MM/yyyy HH:mm') : '',
      v.vehicleType !== 'NONE' ? `${v.vehicleType} ${v.vehicleNumber || ''}`.trim() : '',
      v.idVerified ? 'Yes' : 'No',
    ]);
    const csv = [headers, ...rows].map(row => row.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visitor-records-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout title="Visitor Records">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>Visitor Records</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: '4px 0 0' }}>
            {total.toLocaleString()} total records
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            id="filter-btn"
            className="btn btn-secondary"
            onClick={() => setShowFilters(v => !v)}
            style={{ position: 'relative' }}
          >
            <Filter size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span style={{
                position: 'absolute', top: -6, right: -6, width: 18, height: 18,
                background: '#2563eb', borderRadius: '50%', fontSize: 10, color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
              }}>
                {activeFilterCount}
              </span>
            )}
          </button>
          <button className="btn btn-secondary" onClick={fetchRecords}><RefreshCw size={14} /></button>
          <button id="export-csv-btn" className="btn btn-secondary" onClick={exportCSV} disabled={records.length === 0}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>Visitor Name</label>
              <input className="form-input" placeholder="Search by name..." value={filters.visitorName}
                onChange={e => setFilters(f => ({ ...f, visitorName: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>Host Name</label>
              <input className="form-input" placeholder="Search by host..." value={filters.hostName}
                onChange={e => setFilters(f => ({ ...f, hostName: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>Status</label>
              <select className="form-input" value={filters.status}
                onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
                <option value="">All Statuses</option>
                <option value="EXPECTED">Expected</option>
                <option value="PENDING_VERIFICATION">Pending Verification</option>
                <option value="CHECKED_IN">Checked In</option>
                <option value="CHECKED_OUT">Checked Out</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>Visit Type</label>
              <select className="form-input" value={filters.type}
                onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
                <option value="">All Types</option>
                <option value="PRE_REGISTERED">Pre-Registered</option>
                <option value="WALK_IN">Walk-in</option>
                <option value="DELIVERY">Delivery</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>Vehicle Number</label>
              <input className="form-input" placeholder="e.g. KA01AB1234" value={filters.vehicleNumber}
                onChange={e => setFilters(f => ({ ...f, vehicleNumber: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>Date From</label>
              <input className="form-input" type="date" value={filters.dateFrom}
                onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>Date To</label>
              <input className="form-input" type="date" value={filters.dateTo}
                onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {activeFilterCount > 0 && (
              <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
                <X size={13} /> Clear All
              </button>
            )}
            <button id="apply-filters-btn" className="btn btn-primary btn-sm" onClick={applyFilters}>
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {activeFilterCount > 0 && !showFilters && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {Object.entries(applied).filter(([, v]) => v).map(([k, v]) => (
            <span key={k} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 10px', background: '#eff6ff', color: '#1d4ed8',
              border: '1px solid #bfdbfe', borderRadius: 9999, fontSize: 12, fontWeight: 500,
            }}>
              {k}: {v}
              <button onClick={() => { setApplied(a => ({ ...a, [k]: '' })); setFilters(f => ({ ...f, [k]: '' })); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#93c5fd', display: 'flex' }}>
                <X size={11} />
              </button>
            </span>
          ))}
          <button className="btn btn-secondary btn-sm" onClick={clearFilters}><X size={12} /> Clear All</button>
        </div>
      )}

      {/* Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
            Loading records...
          </div>
        ) : records.length === 0 ? (
          <div style={{ padding: 64, textAlign: 'center' }}>
            <Search size={40} style={{ color: '#cbd5e1', marginBottom: 12 }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: '#475569', margin: 0 }}>No records found</p>
            <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Visitor</th>
                    <th>Host / Type</th>
                    <th>Location</th>
                    <th>Expected</th>
                    <th>Entry</th>
                    <th>Exit</th>
                    <th>Status</th>
                    <th>View</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(v => (
                    <tr key={v.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedVisit(v)}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{v.visitor.name}</div>
                        <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <Phone size={11} />{v.visitor.phone}
                        </div>
                        {v.vehicleNumber && (
                          <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                            <Car size={10} />{v.vehicleType} · {v.vehicleNumber}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: 13 }}>{v.hostMember?.name || <span style={{ color: '#94a3b8' }}>Walk-in</span>}</div>
                        <div style={{ marginTop: 4 }}><VisitTypeBadge type={v.visitType} /></div>
                      </td>
                      <td>
                        <span style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} color="#94a3b8" />{v.campusLocation}
                        </span>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {v.purpose}
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: '#64748b' }}>
                        {v.expectedDate ? format(parseISO(v.expectedDate), 'd MMM yy') : '—'}
                        {v.expectedTime && <div style={{ fontSize: 11 }}>{v.expectedTime}</div>}
                      </td>
                      <td style={{ fontSize: 13, color: '#64748b' }}>
                        {v.actualEntryTime
                          ? format(parseISO(v.actualEntryTime), 'd MMM yy, HH:mm')
                          : <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                      <td style={{ fontSize: 13, color: '#64748b' }}>
                        {v.actualExitTime
                          ? format(parseISO(v.actualExitTime), 'd MMM yy, HH:mm')
                          : <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                      <td><StatusBadge status={v.status} /></td>
                      <td onClick={e => e.stopPropagation()}>
                        <button
                          id={`view-record-${v.id}`}
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedVisit(v)}
                        >
                          <Eye size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>
                Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total.toLocaleString()}
              </span>
              {totalPages > 1 && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <span style={{ padding: '5px 10px', fontSize: 13, fontWeight: 600 }}>{page} / {totalPages}</span>
                  <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Detail Panel */}
      {selectedVisit && (
        <div className="panel-overlay" onClick={() => setSelectedVisit(null)}>
          <div className="panel" onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '18px 24px', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              position: 'sticky', top: 0, background: 'white', zIndex: 1,
            }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>Visit Detail</h2>
              <button onClick={() => setSelectedVisit(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: 24 }}>
              {/* Visitor header */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{selectedVisit.visitor.name}</div>
                <div style={{ fontSize: 14, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <Phone size={13} /> {selectedVisit.visitor.phone}
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <StatusBadge status={selectedVisit.status} />
                  <VisitTypeBadge type={selectedVisit.visitType} />
                  {selectedVisit.idVerified && (
                    <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 9999, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                      ✓ ID Verified
                    </span>
                  )}
                </div>
              </div>

              {/* Details grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Purpose', value: selectedVisit.purpose },
                  { label: 'Location', value: selectedVisit.campusLocation },
                  { label: 'Host', value: selectedVisit.hostMember?.name || 'Walk-in / No host' },
                  { label: 'Expected Date', value: selectedVisit.expectedDate ? format(parseISO(selectedVisit.expectedDate), 'd MMMM yyyy') : '—' },
                  { label: 'Expected Time', value: selectedVisit.expectedTime || '—' },
                  { label: 'Expected Duration', value: selectedVisit.expectedDuration || '—' },
                  { label: 'Vehicle', value: selectedVisit.vehicleType !== 'NONE' ? `${selectedVisit.vehicleType}${selectedVisit.vehicleNumber ? ` · ${selectedVisit.vehicleNumber}` : ''}` : 'None' },
                  { label: 'Actual Entry', value: selectedVisit.actualEntryTime ? format(parseISO(selectedVisit.actualEntryTime), 'dd MMM yyyy, hh:mm a') : '—' },
                  { label: 'Actual Exit', value: selectedVisit.actualExitTime ? format(parseISO(selectedVisit.actualExitTime), 'dd MMM yyyy, hh:mm a') : '—' },
                  ...(selectedVisit.visitType === 'DELIVERY' ? [
                    { label: 'Delivery Company', value: selectedVisit.deliveryCompany || '—' },
                    { label: 'Receiving Person', value: selectedVisit.receivingPerson || '—' },
                    { label: 'Delivery Destination', value: selectedVisit.deliveryDest || '—' },
                  ] : []),
                  ...(selectedVisit.notes ? [{ label: 'Notes', value: selectedVisit.notes }] : []),
                  { label: 'Record ID', value: selectedVisit.id },
                  { label: 'Created', value: format(parseISO(selectedVisit.createdAt), 'dd MMM yyyy, hh:mm a') },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', gap: 12, paddingBottom: 10, borderBottom: '1px solid #f8fafc' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', width: 140, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.04em', paddingTop: 2 }}>
                      {row.label}
                    </div>
                    <div style={{ fontSize: 14, color: '#1e293b', wordBreak: 'break-all' }}>{row.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
