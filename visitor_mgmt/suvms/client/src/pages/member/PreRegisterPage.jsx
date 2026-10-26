import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import api from '../../api/axiosClient';
import { useToastContext } from '../../App';

const VISITOR_TYPES = [
  { value: 'guest', label: 'Guest / Friend' },
  { value: 'family', label: 'Family Member' },
  { value: 'parent', label: 'Parent / Guardian' },
  { value: 'delivery', label: 'Delivery / Courier' },
  { value: 'cab_driver', label: 'Cab / Taxi Driver' },
  { value: 'vendor', label: 'Vendor / Contractor' },
  { value: 'maintenance', label: 'Maintenance / Service' },
  { value: 'other', label: 'Other' },
];

export default function PreRegisterPage() {
  const navigate = useNavigate();
  const { showToast } = useToastContext();
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const [form, setForm] = useState({
    name: '',
    phone: '',
    visitor_type: 'guest',
    relationship: '',
    purpose: '',
    expected_date: todayStr,
    expected_time: '10:00',
    id_info: '',
    notes: '',
    has_vehicle: false,
    vehicle_type: 'Car',
    registration_number: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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
      errs.phone = 'Valid 10-digit Indian mobile number required';
    }
    if (!form.purpose.trim() || form.purpose.trim().length < 3) {
      errs.purpose = 'Purpose of visit is required (min 3 chars)';
    }
    if (!form.expected_date || form.expected_date < todayStr) {
      errs.expected_date = 'Date cannot be in the past';
    }
    if (form.has_vehicle) {
      if (!form.registration_number.trim() || form.registration_number.trim().length < 4) {
        errs.registration_number = 'Vehicle registration plate number is required';
      }
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        visitor_type: form.visitor_type,
        relationship: form.relationship.trim() || undefined,
        purpose: form.purpose.trim(),
        expected_date: form.expected_date,
        expected_time: form.expected_time || undefined,
        id_info: form.id_info.trim() || undefined,
        notes: form.notes.trim() || undefined,
        vehicle: form.has_vehicle ? {
          vehicle_type: form.vehicle_type,
          registration_number: form.registration_number.trim().toUpperCase(),
        } : undefined,
      };

      const res = await api.post('/visits', payload);
      const visit = res.data.visit;

      showToast(`Visitor ${visit.visitor_name} pre-registered successfully!`, 'success');
      navigate('/member/visitors');
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to pre-register visitor';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto">
        <div className="page-header mb-6">
          <h1 className="page-title">Pre-Register a Visitor</h1>
          <p className="page-subtitle">Schedule an expected visitor for swift clearance and automated gate pass generation</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-6">
          {/* Visitor Details Section */}
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
                  placeholder="e.g. Ramesh Patel"
                  className={`input ${errors.name ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="label">Contact Mobile Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="10-digit number"
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
                <label className="label">Relationship / Affiliation</label>
                <input
                  type="text"
                  name="relationship"
                  value={form.relationship}
                  onChange={handleChange}
                  placeholder="e.g. Brother, Research Colleague, Client"
                  className="input"
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">ID Info / Reference (Optional)</label>
                <input
                  type="text"
                  name="id_info"
                  value={form.id_info}
                  onChange={handleChange}
                  placeholder="e.g. Aadhaar / DL last 4 digits, Company badge ID"
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Visit Details Section */}
          <div>
            <h3 className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
              2. Visit Schedule & Purpose
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Expected Date *</label>
                <input
                  type="date"
                  name="expected_date"
                  value={form.expected_date}
                  min={todayStr}
                  onChange={handleChange}
                  className={`input ${errors.expected_date ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                />
                {errors.expected_date && <p className="text-xs text-red-500 mt-1">{errors.expected_date}</p>}
              </div>

              <div>
                <label className="label">Expected Time (Approx)</label>
                <input
                  type="time"
                  name="expected_time"
                  value={form.expected_time}
                  onChange={handleChange}
                  className="input"
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Purpose of Visit *</label>
                <textarea
                  name="purpose"
                  rows={2}
                  value={form.purpose}
                  onChange={handleChange}
                  placeholder="e.g. Academic project collaboration, Hostel room visit, Courier parcel handover"
                  className={`input ${errors.purpose ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                />
                {errors.purpose && <p className="text-xs text-red-500 mt-1">{errors.purpose}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="label">Gate Instructions (Optional)</label>
                <input
                  type="text"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="e.g. Park near Gate 2, Carrying laptop"
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Vehicle Details Section */}
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-4">
              <h3 className="text-xs font-bold text-primary-600 uppercase tracking-wider">
                3. Vehicle Details (Optional)
              </h3>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  name="has_vehicle"
                  checked={form.has_vehicle}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300"
                />
                <span>Coming by vehicle</span>
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
                    <option value="Car">Car / Sedan / SUV</option>
                    <option value="Two-Wheeler">Motorcycle / Scooter</option>
                    <option value="Auto">Auto Rickshaw</option>
                    <option value="Van">Van / Mini Truck</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="label">Registration / Number Plate *</label>
                  <input
                    type="text"
                    name="registration_number"
                    value={form.registration_number}
                    onChange={handleChange}
                    placeholder="e.g. DL-01-AB-1234"
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
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => navigate('/member/visitors')}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Pre-registering...' : 'Confirm Pre-Registration'}
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}
