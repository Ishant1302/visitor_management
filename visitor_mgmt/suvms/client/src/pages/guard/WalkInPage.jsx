import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import api from '../../api/axiosClient';
import { useToastContext } from '../../App';

const VISITOR_TYPES = [
  { value: 'guest', label: 'Guest / Casual Visitor' },
  { value: 'delivery', label: 'Delivery / Courier / Parcel' },
  { value: 'vendor', label: 'Vendor / Contractor' },
  { value: 'parent', label: 'Parent / Family Member' },
  { value: 'cab_driver', label: 'Cab / Taxi Driver' },
  { value: 'maintenance', label: 'Maintenance / Service Worker' },
  { value: 'other', label: 'Other Walk-in' },
];

export default function WalkInPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToastContext();

  const isDeliveryShortcut = searchParams.get('type') === 'delivery';

  const [form, setForm] = useState({
    name: '',
    phone: '',
    visitor_type: isDeliveryShortcut ? 'delivery' : 'guest',
    purpose: isDeliveryShortcut ? 'Parcel / Courier Delivery' : '',
    host_type: 'member', // 'member' | 'department'
    host_user_id: '',
    host_department_id: '',
    relationship: isDeliveryShortcut ? 'Courier Service' : '',
    id_info: '',
    notes: '',
    has_vehicle: isDeliveryShortcut,
    vehicle_type: isDeliveryShortcut ? 'Two-Wheeler' : 'Two-Wheeler',
    registration_number: '',
  });

  const [departments, setDepartments] = useState([]);
  const [members, setMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [searchingMembers, setSearchingMembers] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch departments for dropdown
  useEffect(() => {
    api.get('/departments')
      .then(res => setDepartments(res.data.departments || []))
      .catch(() => {});
  }, []);

  // Search members dynamically
  useEffect(() => {
    if (form.host_type !== 'member') return;
    const timer = setTimeout(() => {
      setSearchingMembers(true);
      api.get(`/users/members?q=${encodeURIComponent(memberSearch)}`)
        .then(res => setMembers(res.data.members || []))
        .catch(() => {})
        .finally(() => setSearchingMembers(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [memberSearch, form.host_type]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 2) {
      errs.name = 'Full name is required (min 2 chars)';
    }
    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
      errs.phone = 'Valid 10-digit mobile number required';
    }
    if (!form.purpose.trim() || form.purpose.trim().length < 3) {
      errs.purpose = 'Purpose of visit is required';
    }
    if (form.host_type === 'member' && !form.host_user_id) {
      errs.host_user_id = 'Please select a host member';
    }
    if (form.host_type === 'department' && !form.host_department_id) {
      errs.host_department_id = 'Please select a department';
    }
    if (form.has_vehicle) {
      if (!form.registration_number.trim() || form.registration_number.trim().length < 4) {
        errs.registration_number = 'Vehicle number plate is required';
      }
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      showToast('Please complete all required fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        visitor_type: form.visitor_type,
        purpose: form.purpose.trim(),
        host_user_id: form.host_type === 'member' ? Number(form.host_user_id) : undefined,
        host_department_id: form.host_type === 'department' ? Number(form.host_department_id) : undefined,
        relationship: form.relationship.trim() || undefined,
        id_info: form.id_info.trim() || undefined,
        notes: form.notes.trim() || undefined,
        vehicle: form.has_vehicle ? {
          vehicle_type: form.vehicle_type,
          registration_number: form.registration_number.trim().toUpperCase(),
        } : undefined,
      };

      const res = await api.post('/visits/walkin', payload);
      const visit = res.data.visit;

      if (visit.blacklist_match) {
        showToast('SECURITY WARNING: Blacklist match flagged for this visitor!', 'error');
      } else {
        showToast(`Walk-in visitor ${visit.visitor_name} registered! Ready for Check-In.`, 'success');
      }

      // Navigate to Visit Detail for immediate Check-In action
      navigate(`/guard/visit/${visit.visit_id}`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to register walk-in visitor';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-title">
                {isDeliveryShortcut ? '📦 Delivery Personnel Entry' : '🚶 Walk-In Visitor Registration'}
              </h1>
              {isDeliveryShortcut && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  Quick Shortcut Active
                </span>
              )}
            </div>
            <p className="page-subtitle">
              {isDeliveryShortcut 
                ? 'Fast-track clearance for couriers, parcels, and delivery partners at gate' 
                : 'Instant gate entry record for unscheduled or ad-hoc university visitors'}
            </p>
          </div>

          <Link to="/guard" className="btn-secondary btn-sm text-xs font-semibold">
            ← Back to Gate
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-6">
          {/* 1. Visitor Details */}
          <div>
            <h3 className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
              1. Visitor Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Visitor Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Sunil Verma"
                  className={`input ${errors.name ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="label">Contact Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  className={`input ${errors.phone ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="label">Visitor Category *</label>
                <select
                  name="visitor_type"
                  value={form.visitor_type}
                  onChange={handleChange}
                  className="input cursor-pointer"
                >
                  {VISITOR_TYPES.map(vt => (
                    <option key={vt.value} value={vt.value}>{vt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Company / Service / Relationship</label>
                <input
                  type="text"
                  name="relationship"
                  value={form.relationship}
                  onChange={handleChange}
                  placeholder="e.g. Amazon, Zomato, Plumber, Electrician"
                  className="input"
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">ID Proof / Badge / Ref Info (Optional)</label>
                <input
                  type="text"
                  name="id_info"
                  value={form.id_info}
                  onChange={handleChange}
                  placeholder="e.g. DL / Aadhaar last 4 digits, Delivery App Order ID"
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* 2. Destination / Host */}
          <div>
            <h3 className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
              2. Person or Department to Visit
            </h3>

            {/* Host type selector tabs */}
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="radio"
                  name="host_type"
                  value="member"
                  checked={form.host_type === 'member'}
                  onChange={handleChange}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span>Individual Host (Student / Faculty / Employee)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="radio"
                  name="host_type"
                  value="department"
                  checked={form.host_type === 'department'}
                  onChange={handleChange}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span>Department / Office Directly</span>
              </label>
            </div>

            {form.host_type === 'member' ? (
              <div className="space-y-2">
                <label className="label">Search and Select Host Member *</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type name or email to filter members..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="input mb-2 text-sm"
                  />
                  {searchingMembers && (
                    <span className="absolute right-3 top-3 text-xs text-slate-400">Searching...</span>
                  )}
                </div>

                <select
                  name="host_user_id"
                  value={form.host_user_id}
                  onChange={handleChange}
                  className={`input cursor-pointer ${errors.host_user_id ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                >
                  <option value="">-- Select Member from Results ({members.length}) --</option>
                  {members.map(m => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.name} ({m.member_type ? m.member_type.toUpperCase() : 'Member'}) - {m.email}
                    </option>
                  ))}
                </select>
                {errors.host_user_id && <p className="text-xs text-red-500">{errors.host_user_id}</p>}
              </div>
            ) : (
              <div>
                <label className="label">Select Destination Department *</label>
                <select
                  name="host_department_id"
                  value={form.host_department_id}
                  onChange={handleChange}
                  className={`input cursor-pointer ${errors.host_department_id ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                >
                  <option value="">-- Select Campus Department --</option>
                  {departments.map(d => (
                    <option key={d.department_id} value={d.department_id}>{d.name}</option>
                  ))}
                </select>
                {errors.host_department_id && <p className="text-xs text-red-500 mt-1">{errors.host_department_id}</p>}
              </div>
            )}

            <div className="mt-4">
              <label className="label">Purpose of Visit *</label>
              <input
                type="text"
                name="purpose"
                value={form.purpose}
                onChange={handleChange}
                placeholder="e.g. Parcel delivery, AC repair in Lab 3, Urgent meeting"
                className={`input ${errors.purpose ? 'border-red-500 ring-1 ring-red-500' : ''}`}
              />
              {errors.purpose && <p className="text-xs text-red-500 mt-1">{errors.purpose}</p>}
            </div>
          </div>

          {/* 3. Vehicle Details */}
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-4">
              <h3 className="text-xs font-bold text-primary-600 uppercase tracking-wider">
                3. Vehicle Details
              </h3>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  name="has_vehicle"
                  checked={form.has_vehicle}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300"
                />
                <span>Visitor entered with a vehicle</span>
              </label>
            </div>

            {form.has_vehicle && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <label className="label">Vehicle Type</label>
                  <select
                    name="vehicle_type"
                    value={form.vehicle_type}
                    onChange={handleChange}
                    className="input cursor-pointer"
                  >
                    <option value="Two-Wheeler">Two-Wheeler (Bike / Scooter)</option>
                    <option value="Car">Car / Sedan / SUV</option>
                    <option value="Auto">Auto Rickshaw</option>
                    <option value="Van">Van / Delivery Truck</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="label">License / Number Plate *</label>
                  <input
                    type="text"
                    name="registration_number"
                    value={form.registration_number}
                    onChange={handleChange}
                    placeholder="e.g. DL-04-XY-9876"
                    className={`input uppercase font-mono ${errors.registration_number ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                  />
                  {errors.registration_number && (
                    <p className="text-xs text-red-500 mt-1">{errors.registration_number}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <Link to="/guard" className="btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-8 py-3 text-sm font-bold shadow-md shadow-primary-500/20"
            >
              {loading ? 'Processing...' : 'Register Walk-In & Proceed →'}
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}
