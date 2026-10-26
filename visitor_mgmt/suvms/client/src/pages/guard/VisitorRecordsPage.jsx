import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import api from '../../api/axiosClient';
import { useToastContext } from '../../App';

export default function VisitorRecordsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToastContext();

  const [visits, setVisits] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters state initialized from URL params if present
  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    status: searchParams.get('status') || '',
    source: searchParams.get('source') || '',
    date_from: searchParams.get('date_from') || '',
    date_to: searchParams.get('date_to') || '',
    page: parseInt(searchParams.get('page') || '1'),
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

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pages) return;
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const resetFilters = () => {
    setFilters({ q: '', status: '', source: '', date_from: '', date_to: '', page: 1 });
    setSearchParams({});
  };

  return (
    <PageShell>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Visitor Records Directory</h1>
          <p className="page-subtitle">BML Munjal University · Historical archive and gate entry logs across all visitors</p>
        </div>
        <Link to="/guard" className="btn-secondary btn-sm self-start sm:self-auto text-xs font-semibold">
          ← Guard Dashboard
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="card p-5 mb-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Keyword Search */}
          <div className="lg:col-span-2">
            <label className="label text-xs">Keyword Search</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
              <input
                type="text"
                name="q"
                placeholder="Name, phone, vehicle plate, host..."
                value={filters.q}
                onChange={handleFilterChange}
                className="input pl-9 text-sm"
              />
            </div>
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

          {/* Source Filter */}
          <div>
            <label className="label text-xs">Entry Source</label>
            <select
              name="source"
              value={filters.source}
              onChange={handleFilterChange}
              className="input text-sm cursor-pointer"
            >
              <option value="">All Sources</option>
              <option value="pre_registered">Pre-Registered</option>
              <option value="walk_in">Walk-In</option>
            </select>
          </div>

          {/* Date From */}
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
        </div>

        {/* Reset button if filtered */}
        {(filters.q || filters.status || filters.source || filters.date_from || filters.date_to) && (
          <div className="flex justify-end">
            <button
              onClick={resetFilters}
              className="btn-ghost text-xs text-slate-500 hover:text-slate-900"
            >
              ✕ Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Table Results */}
      {loading ? (
        <div className="card flex items-center justify-center py-24">
          <Spinner size="lg" message="Searching visitor records..." />
        </div>
      ) : visits.length === 0 ? (
        <div className="card py-16">
          <EmptyState
            icon="🔎"
            title="No visitor records found"
            message="No visitor entries matched the specified search criteria or date filters."
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
                  <th className="py-3 px-4">Visitor</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Host / Dept</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Expected</th>
                  <th className="py-3 px-4">Gate In / Out</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visits.map((v) => (
                  <tr key={v.visit_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{v.visitor_name}</div>
                      <div className="text-slate-500 text-[11px] font-mono">{v.visitor_phone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="capitalize px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                        {v.visitor_type}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {v.source === 'walk_in' ? 'Walk-in' : 'Pre-reg'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-semibold">{v.host_name || 'N/A'}</div>
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
                    <td className="py-3.5 px-4 text-slate-700">
                      <div>{v.expected_date || '—'}</div>
                      <div className="text-[11px] text-slate-500">{v.expected_time || ''}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {v.check_in_time ? (
                        <div className="text-emerald-700 font-semibold">
                          ✓ {new Date(v.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                      {v.check_out_time && (
                        <div className="text-slate-500 text-[11px]">
                          ✕ {new Date(v.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
              Showing {visits.length} of {total} records (Page {filters.page} of {pages})
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page <= 1}
                className="btn-secondary btn-sm py-1 px-3 text-xs disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(filters.page + 1)}
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
