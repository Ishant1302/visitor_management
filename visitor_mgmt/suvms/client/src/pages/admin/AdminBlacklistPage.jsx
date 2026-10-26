import { useState, useEffect, useCallback } from 'react';
import PageShell from '../../components/layout/PageShell';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import api from '../../api/axiosClient';
import { useToastContext } from '../../App';

export default function AdminBlacklistPage() {
  const { showToast } = useToastContext();

  const [entries, setEntries] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('entries'); // 'entries' | 'tool' | 'logs'

  // Add Entry Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', vehicle_number: '', reason: '' });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Quick Check Tool State
  const [checkInput, setCheckInput] = useState({ name: '', phone: '', vehicle_number: '' });
  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking] = useState(false);

  const fetchBlacklist = useCallback(async () => {
    setLoading(true);
    try {
      const [entriesRes, logsRes] = await Promise.all([
        api.get('/blacklist'),
        api.get('/blacklist/logs'),
      ]);
      setEntries(entriesRes.data.entries || []);
      setLogs(logsRes.data.logs || []);
    } catch {
      showToast('Failed to load blacklist database', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchBlacklist();
  }, [fetchBlacklist]);

  // Handle Deactivate Entry
  const handleDeactivate = async (id, name) => {
    try {
      await api.patch(`/blacklist/${id}/deactivate`);
      showToast(`Blacklist entry for "${name || 'vehicle'}" deactivated`, 'success');
      fetchBlacklist();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to deactivate entry', 'error');
    }
  };

  // Handle Add Entry Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim() && !form.phone.trim() && !form.vehicle_number.trim()) {
      errs.general = 'Provide at least one identifier: Name, Phone, or Vehicle Plate';
    }
    if (!form.reason.trim() || form.reason.trim().length < 5) {
      errs.reason = 'Security reason is mandatory (min 5 characters)';
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/blacklist', {
        name: form.name.trim() || undefined,
        phone: form.phone.trim() || undefined,
        vehicle_number: form.vehicle_number.trim().toUpperCase() || undefined,
        reason: form.reason.trim(),
      });
      showToast('New entry added to security blacklist', 'success');
      setAddModalOpen(false);
      setForm({ name: '', phone: '', vehicle_number: '', reason: '' });
      setFormErrors({});
      fetchBlacklist();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to add entry', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Quick Check
  const handleRunCheck = async (e) => {
    e.preventDefault();
    if (!checkInput.name.trim() && !checkInput.phone.trim() && !checkInput.vehicle_number.trim()) {
      showToast('Enter a phone, name, or vehicle number to check', 'error');
      return;
    }

    setChecking(true);
    try {
      const res = await api.post('/blacklist/check', checkInput);
      setCheckResult(res.data);
    } catch {
      showToast('Verification check failed', 'error');
    } finally {
      setChecking(false);
    }
  };

  return (
    <PageShell>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Campus Security Blacklist</h1>
          <p className="page-subtitle">BML Munjal University · Prohibited persons, flagged vehicles, hit audit log, and instant verification</p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="btn-danger flex items-center gap-2 self-start sm:self-auto text-xs font-bold"
        >
          <span>➕</span>
          <span>Flag New Blacklist Entry</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('entries')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'entries'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Active Blacklist Entries ({entries.filter(e => e.active).length})
        </button>

        <button
          onClick={() => setActiveTab('tool')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'tool'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Instant Verification Tool
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'logs'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Audit Hit Logs ({logs.length})
        </button>
      </div>

      {loading ? (
        <div className="card flex items-center justify-center py-20">
          <Spinner size="lg" message="Loading security database..." />
        </div>
      ) : activeTab === 'entries' ? (
        /* Tab 1: Blacklist Entries Table */
        entries.length === 0 ? (
          <div className="card py-16">
            <EmptyState
              icon="🛡️"
              title="Blacklist is currently empty"
              message="No visitors or vehicles are currently prohibited from campus entry."
            />
          </div>
        ) : (
          <div className="card overflow-x-auto p-0 border border-slate-200">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Flagged Subject</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Vehicle Plate</th>
                  <th className="py-3 px-4">Security Reason</th>
                  <th className="py-3 px-4">Added By / Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((e) => (
                  <tr key={e.entry_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                      {e.name || <span className="text-slate-400 italic font-normal">Name unspecified</span>}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {e.phone || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {e.vehicle_number ? (
                        <span className="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          {e.vehicle_number}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate" title={e.reason}>
                      {e.reason}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      <div>{e.added_by_name || 'Admin'}</div>
                      <div className="text-slate-400">{new Date(e.added_at).toLocaleDateString()}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        e.active
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {e.active ? '● Active Alert' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {e.active === 1 && (
                        <button
                          onClick={() => handleDeactivate(e.entry_id, e.name)}
                          className="btn-ghost text-xs text-slate-500 hover:text-red-600"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : activeTab === 'tool' ? (
        /* Tab 2: Instant Verification Tool (R21) */
        <div className="max-w-2xl mx-auto card p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Manual Security Blacklist Verifier</h3>
            <p className="text-xs text-slate-500">Instantly test if a visitor or vehicle plate triggers an active security alert</p>
          </div>

          <form onSubmit={handleRunCheck} className="space-y-4">
            <div>
              <label className="label text-xs">Visitor Name</label>
              <input
                type="text"
                placeholder="e.g. Deepak Joshi"
                value={checkInput.name}
                onChange={(e) => setCheckInput(c => ({ ...c, name: e.target.value }))}
                className="input text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label text-xs">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 9123456789"
                  value={checkInput.phone}
                  onChange={(e) => setCheckInput(c => ({ ...c, phone: e.target.value }))}
                  className="input text-sm font-mono"
                />
              </div>

              <div>
                <label className="label text-xs">Vehicle Plate Number</label>
                <input
                  type="text"
                  placeholder="e.g. MH12AB3456"
                  value={checkInput.vehicle_number}
                  onChange={(e) => setCheckInput(c => ({ ...c, vehicle_number: e.target.value }))}
                  className="input text-sm uppercase font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={checking}
              className="btn-primary w-full py-2.5 text-sm font-bold"
            >
              {checking ? 'Querying Database...' : 'Run Security Check'}
            </button>
          </form>

          {/* Verification Result Feedback Banner */}
          {checkResult && (
            <div className={`p-5 rounded-2xl border-2 ${
              checkResult.hit 
                ? 'bg-red-50 border-red-500 text-red-900' 
                : 'bg-emerald-50 border-emerald-500 text-emerald-900'
            }`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{checkResult.hit ? '🚨' : '✅'}</span>
                <div>
                  <h4 className="font-bold text-base">
                    {checkResult.hit ? 'BLACKLIST MATCH FOUND — ENTRY PROHIBITED' : 'CLEAR — No Blacklist Match Found'}
                  </h4>
                  {checkResult.hit ? (
                    <div className="text-xs mt-2 space-y-1">
                      <div><strong>Match Field:</strong> {checkResult.matchField?.toUpperCase()}</div>
                      <div><strong>Reason:</strong> {checkResult.entry?.reason}</div>
                      <div><strong>Flagged On:</strong> {new Date(checkResult.entry?.added_at).toLocaleString()}</div>
                    </div>
                  ) : (
                    <p className="text-xs mt-1 text-emerald-700">
                      The credentials provided do not match any active entries in the prohibited registry.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Tab 3: Blacklist Hit Audit Logs */
        logs.length === 0 ? (
          <div className="card py-16">
            <EmptyState
              icon="📜"
              title="No blacklist hits logged"
              message="No visitor attempts matching prohibited records have been recorded by the gate."
            />
          </div>
        ) : (
          <div className="card overflow-x-auto p-0 border border-slate-200">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Log ID</th>
                  <th className="py-3 px-4">Matched Field</th>
                  <th className="py-3 px-4">Action Taken</th>
                  <th className="py-3 px-4">Blacklist Reason</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.log_id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono text-slate-500 font-semibold">#{log.log_id}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-red-50 text-red-700 border border-red-200">
                        {log.match_field}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action_taken.includes('blocked')
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {log.action_taken}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-800">{log.blacklist_reason}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(log.hit_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Add Blacklist Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Subject to Security Blacklist"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <p className="text-xs text-slate-500">
            Provide at least one identifier (Name, Phone number, or Vehicle Registration Plate).
          </p>

          {formErrors.general && (
            <p className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
              {formErrors.general}
            </p>
          )}

          <div>
            <label className="label text-xs">Subject Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. John Doe"
              className="input text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label text-xs">Contact Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="10-digit number"
                className="input text-sm font-mono"
              />
            </div>

            <div>
              <label className="label text-xs">Vehicle Plate</label>
              <input
                type="text"
                value={form.vehicle_number}
                onChange={(e) => setForm(f => ({ ...f, vehicle_number: e.target.value }))}
                placeholder="e.g. DL01AB9999"
                className="input text-sm uppercase font-mono"
              />
            </div>
          </div>

          <div>
            <label className="label text-xs">Security Flag Reason *</label>
            <textarea
              rows={3}
              value={form.reason}
              onChange={(e) => setForm(f => ({ ...f, reason: e.target.value }))}
              placeholder="e.g. Repeated trespass without permit, aggressive behavior at Gate 1, suspended contractor"
              className={`input text-sm ${formErrors.reason ? 'border-red-500 ring-1 ring-red-500' : ''}`}
            />
            {formErrors.reason && <p className="text-xs text-red-500 mt-1">{formErrors.reason}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-danger btn-sm text-xs font-bold"
            >
              {submitting ? 'Adding...' : 'Flag and Prohibit Entry'}
            </button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
