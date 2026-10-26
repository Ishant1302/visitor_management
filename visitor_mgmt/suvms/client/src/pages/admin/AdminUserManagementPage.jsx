import { useState, useEffect, useCallback } from 'react';
import PageShell from '../../components/layout/PageShell';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import api from '../../api/axiosClient';
import { useAuth } from '../../hooks/useAuth';
import { useToastContext } from '../../App';

export default function AdminUserManagementPage() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToastContext();

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  // Create User Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'guard',
    department_id: '',
  });
  const [createErrors, setCreateErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Edit User Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    user_id: null,
    name: '',
    department_id: '',
    account_status: 'active',
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page };
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.q = searchTerm;

      const res = await api.get('/users', { params });
      setUsers(res.data.users || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch {
      showToast('Failed to load user directory', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, statusFilter, searchTerm, showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Fetch departments for dropdowns
  useEffect(() => {
    api.get('/departments')
      .then(res => setDepartments(res.data.departments || []))
      .catch(() => {});
  }, []);

  // Handle Toggle User Status (Activate / Deactivate)
  const handleToggleStatus = async (user) => {
    if (user.user_id === currentUser.user_id) {
      showToast('You cannot deactivate your own administrative account', 'error');
      return;
    }

    const newStatus = user.account_status === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/users/${user.user_id}`, { account_status: newStatus });
      showToast(`User ${user.name} is now ${newStatus}`, 'success');
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update account status', 'error');
    }
  };

  // Handle Create User
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!createForm.name.trim()) errs.name = 'Full name is required';
    if (!createForm.email.trim() || !createForm.email.includes('@')) errs.email = 'Valid email is required';
    if (!createForm.password || createForm.password.length < 6) errs.password = 'Password must be at least 6 characters';

    if (Object.keys(errs).length > 0) {
      setCreateErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/users', {
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: createForm.role,
        department_id: createForm.department_id ? Number(createForm.department_id) : undefined,
      });
      showToast(`Account created for ${createForm.name}!`, 'success');
      setCreateModalOpen(false);
      setCreateForm({ name: '', email: '', password: '', role: 'guard', department_id: '' });
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create user account', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (user) => {
    setEditForm({
      user_id: user.user_id,
      name: user.name,
      department_id: user.department_id || '',
      account_status: user.account_status,
    });
    setEditModalOpen(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`/users/${editForm.user_id}`, {
        name: editForm.name.trim(),
        department_id: editForm.department_id ? Number(editForm.department_id) : undefined,
        account_status: editForm.account_status,
      });
      showToast('User updated successfully', 'success');
      setEditModalOpen(false);
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update user', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">User Account Administration</h1>
          <p className="page-subtitle">BML Munjal University · Manage student, faculty, guard, and administrator access</p>
        </div>

        {/* Create Guard / Admin Button (R16) */}
        <button
          onClick={() => setCreateModalOpen(true)}
          className="btn-primary flex items-center gap-2 self-start sm:self-auto text-xs font-bold"
        >
          <span>➕</span>
          <span>Create Staff Account</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="input pl-9 text-sm"
            />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="input text-sm cursor-pointer"
            >
              <option value="">All Roles (Member, Guard, Admin)</option>
              <option value="member">Members (Students/Faculty)</option>
              <option value="guard">Security Guards</option>
              <option value="admin">Administrators</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="input text-sm cursor-pointer"
            >
              <option value="">All Statuses (Active & Inactive)</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive / Deactivated Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="card flex items-center justify-center py-20">
          <Spinner size="lg" message="Loading user directory..." />
        </div>
      ) : users.length === 0 ? (
        <div className="card py-16">
          <EmptyState
            icon="👥"
            title="No users found"
            message="No user accounts matched the search criteria."
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card overflow-x-auto p-0 border border-slate-200">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.user_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{u.name}</div>
                      <div className="text-slate-500 text-[11px] font-mono">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                        u.role === 'admin' 
                          ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                          : u.role === 'guard' 
                          ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                          : 'bg-primary-50 text-primary-700 border border-primary-200'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 capitalize">
                      {u.member_type || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {u.department_name || 'Campus Wide'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.account_status === 'active' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {u.account_status === 'active' ? '● Active' : '✕ Deactivated'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="btn-secondary btn-sm text-[11px] py-1 px-2.5 font-semibold"
                        >
                          Edit
                        </button>
                        {u.user_id !== currentUser?.user_id && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`btn-sm text-[11px] py-1 px-2.5 font-bold ${
                              u.account_status === 'active'
                                ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {u.account_status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-2 text-xs text-slate-500">
            <div>
              Showing {users.length} of {total} accounts (Page {page} of {pages})
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-secondary btn-sm py-1 px-3 text-xs disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page >= pages}
                className="btn-secondary btn-sm py-1 px-3 text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Staff or Guard Account"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input
              type="text"
              value={createForm.name}
              onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Inspector Surendra"
              className={`input ${createErrors.name ? 'border-red-500 ring-1 ring-red-500' : ''}`}
            />
            {createErrors.name && <p className="text-xs text-red-500 mt-1">{createErrors.name}</p>}
          </div>

          <div>
            <label className="label">Official Email Address *</label>
            <input
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))}
              placeholder="e.g. guard3@bmu.edu.in"
              className={`input ${createErrors.email ? 'border-red-500 ring-1 ring-red-500' : ''}`}
            />
            {createErrors.email && <p className="text-xs text-red-500 mt-1">{createErrors.email}</p>}
          </div>

          <div>
            <label className="label">Initial Password *</label>
            <input
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Minimum 6 characters"
              className={`input ${createErrors.password ? 'border-red-500 ring-1 ring-red-500' : ''}`}
            />
            {createErrors.password && <p className="text-xs text-red-500 mt-1">{createErrors.password}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Assigned Role</label>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm(f => ({ ...f, role: e.target.value }))}
                className="input cursor-pointer"
              >
                <option value="guard">Security Guard</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div>
              <label className="label">Department (Optional)</label>
              <select
                value={createForm.department_id}
                onChange={(e) => setCreateForm(f => ({ ...f, department_id: e.target.value }))}
                className="input cursor-pointer"
              >
                <option value="">Campus Wide</option>
                {departments.map(d => (
                  <option key={d.department_id} value={d.department_id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary btn-sm"
            >
              {submitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit User Details"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
              className="input"
            />
          </div>

          <div>
            <label className="label">Department</label>
            <select
              value={editForm.department_id}
              onChange={(e) => setEditForm(f => ({ ...f, department_id: e.target.value }))}
              className="input cursor-pointer"
            >
              <option value="">Campus Wide / None</option>
              {departments.map(d => (
                <option key={d.department_id} value={d.department_id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Account Status</label>
            <select
              value={editForm.account_status}
              onChange={(e) => setEditForm(f => ({ ...f, account_status: e.target.value }))}
              className="input cursor-pointer"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive / Deactivated</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary btn-sm"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
