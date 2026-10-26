import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import api from '../../api/axiosClient';
import { useToastContext } from '../../App';

export default function AdminVisitorRecordsPage() {
  const { showToast } = useToastContext();

  const [visits, setVisits] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [filters, setFilters] = useState({
    q: '',
    status: '',
    source: '',
    date_from: '',
    date_to: '',
    host: '',
    page: 1,
  });

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.q) params.q = filters.q;
      if (filters.status) params.status = filters.status;
      if (filters.source) params.source = filters.source;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      if (filters.host) params.host = filters.host;
      params.page = filters.page;

      const res = await api.get('/visits/search', { params });
      setVisits(res.data.visits || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch {
      showToast('Failed to load visitor records', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (filters.q) params.append('q', filters.q);
      if (filters.status) params.append('status', filters.status);
      if (filters.source) params.append('source', filters.source);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      if (filters.host) params.append('host', filters.host);

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/visits/export/csv?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bmu_suvms_visitor_audit_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      showToast('CSV export downloaded successfully!', 'success');
    } catch {
      showToast('Failed to download CSV export', 'error');
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setFilters({ q: '', status: '', source: '', date_from: '', date_to: '', host: '', page: 1 });
  };

  return (
    <PageShell>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">University Visitor Records & Audit</h1>
          <p className="page-subtitle">BML Munjal University · Master audit trail of campus visits, gate arrivals, and vehicle movements</p>
        </div>

        {/* Export to CSV Button (R15) */}
        <button
          onClick={handleExportCsv}
          disabled={exporting}
          className="btn-secondary btn-sm flex items-center gap-2 self-start sm:self-auto text-xs font-bold text-teal-700 border-teal-300 hover:bg-teal-50 shadow-xs"
        >
          <span>📥</span>
          <span>{exporting ? 'Generating CSV...' : 'Export to CSV'}</span>
        </button>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="card p-5 mb-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Keyword Search */}
          <div className="lg:col-span-2">
            <label className="label text-xs">Search Keywords</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
              <input
                type="text"
                name="q"
                placeholder="Visitor name, phone, plate..."
                value={filters.q}
                onChange={handleFilterChange}
                className="input pl-9 text-sm"
              />
            </div>
          </div>

          {/* Host Filter */}
          <div>
            <label className="label text-xs">Host Name</label>
            <input
              type="text"
              name="host"
              placeholder="Filter by host..."
              value={filters.host}
              onChange={handleFilterChange}
              className="input text-sm"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="label text-xs">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="input text-sm cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Expected">Expected</option>
              <option value="Verified">Verified</option>
              <option value="Checked In">Checked In</option>
              <option value="Checked Out">Checked Out</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Denied">Denied</option>
            </select>
          </div>

          {/* Date Range From */}
          <div>
            <label className="label text-xs">From Date</label>
            <input
              type="date"
              name="date_from"
              value={filters.date_from}
              onChange={handleFilterChange}
              className="input text-sm"
            />
          </div>

          {/* Date Range To */}
          <div>
            <label className="label text-xs">To Date</label>
            <input
              type="date"
              name="date_to"
              value={filters.date_to}
              onChange={handleFilterChange}
              className="input text-sm"
            />
          </div>
        </div>

        {/* Reset button if filtered */}
        {(filters.q || filters.status || filters.source || filters.date_from || filters.date_to || filters.host) && (
          <div className="flex justify-end">
            <button
              onClick={resetFilters}
              className="btn-ghost text-xs text-slate-500 hover:text-slate-900"
            >
              ✕ Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Table Results */}
      {loading ? (
        <div className="card flex items-center justify-center py-24">
          <Spinner size="lg" message="Loading records archive..." />
        </div>
      ) : visits.length === 0 ? (
        <div className="card py-16">
          <EmptyState
            icon="🔎"
            title="No records found"
            message="No visitor records matched your search filters."
            action={
              <button onClick={resetFilters} className="btn-secondary btn-sm mt-3 text-xs font-semibold">
                Clear Filters
              </button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card overflow-x-auto p-0 border border-slate-200">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Visitor</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Host / Department</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Gate Timing</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visits.map((v) => (
                  <tr key={v.visit_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-500 font-semibold">
                      #{v.visit_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{v.visitor_name}</div>
                      <div className="text-slate-500 text-[11px] font-mono">{v.visitor_phone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="capitalize px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                        {v.visitor_type}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {v.source === 'walk_in' ? 'Walk-in' : 'Pre-reg'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-900 font-semibold">{v.host_name || 'N/A'}</div>
                      <div className="text-slate-500 text-[11px]">{v.department_name}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {v.registration_number ? (
                        <span className="font-semibold text-slate-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {v.registration_number}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {v.check_in_time ? (
                        <div className="text-emerald-700 font-semibold">
                          In: {new Date(v.check_in_time).toLocaleString()}
                        </div>
                      ) : (
                        <div className="text-slate-500">Exp: {v.expected_date} {v.expected_time || ''}</div>
                      )}
                      {v.check_out_time && (
                        <div className="text-slate-400 text-[11px]">
                          Out: {new Date(v.check_out_time).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/guard/visit/${v.visit_id}`}
                        className="btn-secondary btn-sm text-xs py-1 px-3 font-semibold"
                      >
                        Inspect →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-2 text-xs text-slate-500">
            <div>
              Showing {visits.length} of {total} total records (Page {filters.page} of {pages})
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                disabled={filters.page <= 1}
                className="btn-secondary btn-sm py-1 px-3 text-xs disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                disabled={filters.page >= pages}
                className="btn-secondary btn-sm py-1 px-3 text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
