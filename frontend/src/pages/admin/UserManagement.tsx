import { useState, useEffect, useCallback } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { adminService } from '../../services';
import { toast } from '../../hooks/useToast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import type { User, Role } from '../../types';
import {
  Plus, Search, X, Edit2, Trash2, RefreshCw,
  GraduationCap, Shield, UserCog, ChevronLeft, ChevronRight, Mail, Phone
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const ROLE_CONFIG: Record<Role, { label: string; color: string; bg: string; icon: typeof Shield }> = {
  GUARD: { label: 'Guard', color: '#16a34a', bg: '#f0fdf4', icon: Shield },
  MEMBER: { label: 'Member', color: '#2563eb', bg: '#eff6ff', icon: GraduationCap },
  ADMIN: { label: 'Admin', color: '#7c3aed', bg: '#f5f3ff', icon: UserCog },
};

const emptyUserForm = {
  name: '', email: '', password: '', phone: '', role: 'MEMBER' as Role,
  memberType: 'STUDENT', rollNo: '', employeeId: '', department: '', publicMeetingPoint: '',
};

export default function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [formData, setFormData] = useState(emptyUserForm);
  const [formLoading, setFormLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: LIMIT };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const data = await adminService.getUsers(params);
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch {
      toast('error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Debounce search
  useEffect(() => { setPage(1); }, [search, roleFilter]);

  const openCreateForm = () => {
    setEditUser(null);
    setFormData(emptyUserForm);
    setShowForm(true);
  };

  const openEditForm = (u: User) => {
    setEditUser(u);
    setFormData({
      name: u.name, email: u.email, password: '', phone: u.phone || '',
      role: u.role,
      memberType: u.member?.memberType || 'STUDENT',
      rollNo: u.member?.rollNo || '',
      employeeId: u.member?.employeeId || '',
      department: u.member?.department || '',
      publicMeetingPoint: u.member?.publicMeetingPoint || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editUser) {
        const { password, memberType, rollNo, employeeId, department, publicMeetingPoint, ...rest } = formData;
        await adminService.updateUser(editUser.id, rest);
        toast('success', 'User updated');
      } else {
        await adminService.createUser(formData);
        toast('success', 'User created', `${formData.name} can now log in.`);
      }
      setShowForm(false);
      await fetchUsers();
    } catch (e: any) {
      toast('error', editUser ? 'Update failed' : 'Creation failed', e?.response?.data?.error || 'Please try again');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminService.deleteUser(deleteTarget.id);
      toast('success', 'User deleted');
      setDeleteTarget(null);
      await fetchUsers();
    } catch (e: any) {
      toast('error', 'Deletion failed', e?.response?.data?.error || 'Try again');
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <AppLayout title="Manage Users">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>User Management</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: '4px 0 0' }}>
            {total} total users
          </p>
        </div>
        <button id="create-user-btn" className="btn btn-primary" onClick={openCreateForm}>
          <Plus size={15} /> Add User
        </button>
      </div>

      {/* Role summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {(['GUARD', 'MEMBER', 'ADMIN'] as Role[]).map(role => {
          const cfg = ROLE_CONFIG[role];
          const Icon = cfg.icon;
          const count = users.filter(u => u.role === role).length;
          return (
            <button
              key={role}
              id={`role-filter-${role.toLowerCase()}`}
              onClick={() => setRoleFilter(prev => prev === role ? '' : role)}
              style={{
                background: roleFilter === role ? cfg.bg : 'white',
                border: `1.5px solid ${roleFilter === role ? cfg.color : '#e2e8f0'}`,
                borderRadius: 10, padding: '12px 16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={cfg.color} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{loading ? '—' : users.filter(u => u.role === role).length || count}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{cfg.label}s</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search + Table */}
      <div className="card">
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
            <Search size={15} color="#94a3b8" />
            <input
              id="user-search-input"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
                <X size={13} />
              </button>
            )}
          </div>
          {roleFilter && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setRoleFilter('')}
            >
              <X size={13} /> {roleFilter}
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={fetchUsers}><RefreshCw size={13} /></button>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Loading users...</div>
        ) : users.length === 0 ? (
          <div style={{ padding: 64, textAlign: 'center' }}>
            <UserCog size={40} style={{ color: '#cbd5e1', marginBottom: 12 }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: '#475569', margin: 0 }}>No users found</p>
            <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Contact</th>
                    <th>Department / Details</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const cfg = ROLE_CONFIG[u.role];
                    const Icon = cfg.icon;
                    return (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: '50%',
                              background: `linear-gradient(135deg, ${cfg.color}33, ${cfg.color}55)`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 13, fontWeight: 700, color: cfg.color, flexShrink: 0,
                            }}>
                              {u.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{u.name}</div>
                              <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Mail size={11} />{u.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '3px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 600,
                            background: cfg.bg, color: cfg.color,
                          }}>
                            <Icon size={11} /> {cfg.label}
                          </span>
                        </td>
                        <td>
                          {u.phone ? (
                            <span style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Phone size={11} />{u.phone}
                            </span>
                          ) : <span style={{ color: '#cbd5e1', fontSize: 13 }}>—</span>}
                        </td>
                        <td>
                          {u.member ? (
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500 }}>{u.member.department}</div>
                              <div style={{ fontSize: 11, color: '#64748b' }}>
                                {u.member.memberType} {u.member.rollNo ? `· ${u.member.rollNo}` : ''} {u.member.employeeId ? `· ${u.member.employeeId}` : ''}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: '#cbd5e1', fontSize: 13 }}>—</span>
                          )}
                        </td>
                        <td style={{ fontSize: 13, color: '#64748b' }}>
                          {u.createdAt ? format(parseISO(u.createdAt), 'd MMM yyyy') : '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              id={`edit-user-${u.id}`}
                              className="btn btn-secondary btn-sm"
                              onClick={() => openEditForm(u)}
                            >
                              <Edit2 size={13} /> Edit
                            </button>
                            <button
                              id={`delete-user-${u.id}`}
                              className="btn btn-sm"
                              style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                              onClick={() => setDeleteTarget(u)}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>
                  Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft size={14} />
                  </button>
                  <span style={{ padding: '5px 10px', fontSize: 13, fontWeight: 600 }}>{page} / {totalPages}</span>
                  <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {editUser ? `Edit — ${editUser.name}` : 'Add New User'}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Full Name *</label>
                  <input className="form-input" required placeholder="Full name" value={formData.name}
                    onChange={e => setFormData(d => ({ ...d, name: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Email *</label>
                  <input className="form-input" type="email" required placeholder="user@example.com" value={formData.email}
                    onChange={e => setFormData(d => ({ ...d, email: e.target.value }))} />
                </div>
                {!editUser && (
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Password *</label>
                    <input className="form-input" type="password" required placeholder="Min 8 characters" value={formData.password}
                      onChange={e => setFormData(d => ({ ...d, password: e.target.value }))} />
                  </div>
                )}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Phone</label>
                  <input className="form-input" placeholder="Phone number" value={formData.phone}
                    onChange={e => setFormData(d => ({ ...d, phone: e.target.value }))} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Role *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {(['GUARD', 'MEMBER', 'ADMIN'] as Role[]).map(role => {
                      const cfg = ROLE_CONFIG[role];
                      const Icon = cfg.icon;
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setFormData(d => ({ ...d, role }))}
                          disabled={!!editUser}
                          style={{
                            border: `1.5px solid ${formData.role === role ? cfg.color : '#e2e8f0'}`,
                            borderRadius: 8, padding: '8px 12px', cursor: editUser ? 'not-allowed' : 'pointer',
                            background: formData.role === role ? cfg.bg : 'white',
                            display: 'flex', alignItems: 'center', gap: 6,
                            fontSize: 13, fontWeight: 600, color: formData.role === role ? cfg.color : '#374151',
                            opacity: editUser ? 0.6 : 1, transition: 'all 0.15s',
                          }}
                        >
                          <Icon size={14} /> {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Member-specific fields */}
                {formData.role === 'MEMBER' && !editUser && (
                  <>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Member Type *</label>
                      <select className="form-input" value={formData.memberType}
                        onChange={e => setFormData(d => ({ ...d, memberType: e.target.value }))}>
                        <option value="STUDENT">Student</option>
                        <option value="FACULTY">Faculty</option>
                        <option value="EMPLOYEE">Employee</option>
                        <option value="MANAGEMENT">Management</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Department *</label>
                      <input className="form-input" placeholder="Department name" value={formData.department}
                        onChange={e => setFormData(d => ({ ...d, department: e.target.value }))} />
                    </div>
                    {(formData.memberType === 'STUDENT') && (
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Roll Number</label>
                        <input className="form-input" placeholder="e.g. CS21001" value={formData.rollNo}
                          onChange={e => setFormData(d => ({ ...d, rollNo: e.target.value }))} />
                      </div>
                    )}
                    {(formData.memberType !== 'STUDENT') && (
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Employee ID</label>
                        <input className="form-input" placeholder="Employee ID" value={formData.employeeId}
                          onChange={e => setFormData(d => ({ ...d, employeeId: e.target.value }))} />
                      </div>
                    )}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Public Meeting Point</label>
                      <input className="form-input" placeholder="e.g. Academic Block Room 203" value={formData.publicMeetingPoint}
                        onChange={e => setFormData(d => ({ ...d, publicMeetingPoint: e.target.value }))} />
                    </div>
                  </>
                )}
              </div>
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button id="user-form-submit" type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? (editUser ? 'Saving...' : 'Creating...') : (editUser ? 'Save Changes' : 'Create User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to permanently delete ${deleteTarget?.name}? This will remove all their data and cannot be undone.`}
        confirmLabel="Delete User"
        danger
        isLoading={deleteLoading}
      />
    </AppLayout>
  );
}
