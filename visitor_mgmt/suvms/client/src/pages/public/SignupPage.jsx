import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axiosClient';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate   = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '',
    member_type: 'student', department_id: '',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    api.get('/departments')
      .then(r => setDepartments(r.data.departments || []))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim())        errs.name = 'Full name is required';
    if (!form.email.trim() || !form.email.includes('@')) errs.email = 'Valid university email is required';
    if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match';
    if (!form.member_type)        errs.member_type = 'Please select your university affiliation';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await signup({
        name:          form.name.trim(),
        email:         form.email.trim(),
        password:      form.password,
        member_type:   form.member_type,
        department_id: form.department_id ? Number(form.department_id) : undefined,
      });
      navigate('/member/visitors');
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        const fieldErrs = {};
        data.errors.forEach(e => { fieldErrs[e.field] = e.message; });
        setErrors(fieldErrs);
      } else {
        setApiError(data?.error || 'Registration failed. Please check your information.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-slate-200/90 p-8 sm:p-10 animate-fade-in">
        {/* Header Branding */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-primary-600 font-extrabold text-2xl">//</span>
          <div>
            <span className="font-extrabold text-slate-900 text-lg tracking-tight">SUVMS</span>
            <div className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
              BML Munjal University
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Register Member Account
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Sign up to pre-register your expected visitors and receive instant gate clearance alerts.
          </p>
        </div>

        {apiError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold mb-5 flex items-center gap-2">
            <span>⚠️</span>
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Priya Patel"
              className={`input ${errors.name ? 'border-red-500 ring-1 ring-red-500' : ''}`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="label">University Email Address *</label>
            <input
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="e.g. priya@bmu.edu.in"
              className={`input ${errors.email ? 'border-red-500 ring-1 ring-red-500' : ''}`}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Affiliation / Role *</label>
              <select
                name="member_type"
                value={form.member_type}
                onChange={handleChange}
                className="input cursor-pointer"
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty / Professor</option>
                <option value="employee">Staff / Employee</option>
                <option value="management">Management / Admin</option>
              </select>
            </div>

            <div>
              <label className="label">Department</label>
              <select
                name="department_id"
                value={form.department_id}
                onChange={handleChange}
                className="input cursor-pointer"
              >
                <option value="">Campus Wide</option>
                {departments.map(d => (
                  <option key={d.department_id} value={d.department_id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Password (min 6 chars) *</label>
              <input
                name="password"
                type="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`input ${errors.password ? 'border-red-500 ring-1 ring-red-500' : ''}`}
              />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="label">Confirm Password *</label>
              <input
                name="confirm"
                type="password"
                required
                value={form.confirm}
                onChange={handleChange}
                placeholder="••••••••"
                className={`input ${errors.confirm ? 'border-red-500 ring-1 ring-red-500' : ''}`}
              />
              {errors.confirm && <p className="text-xs text-red-500 mt-1">{errors.confirm}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-sm font-bold shadow-md shadow-primary-500/20 mt-2"
          >
            {loading ? 'Creating account...' : 'Create Member Account →'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Already registered with SUVMS?</span>
          <Link to="/login" className="font-bold text-primary-600 hover:text-primary-700">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
