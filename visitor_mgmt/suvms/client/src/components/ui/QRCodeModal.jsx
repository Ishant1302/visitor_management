import { QRCodeSVG } from 'qrcode.react';
import Modal from './Modal';
import StatusBadge from './StatusBadge';

export default function QRCodeModal({ isOpen, onClose, visit }) {
  if (!visit) return null;

  const passPayload = JSON.stringify({
    pass: 'SUVMS',
    id: visit.visit_id,
    name: visit.visitor_name,
    date: visit.expected_date,
    host: visit.host_name,
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Visitor Gate Pass" maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center">
        {/* Pass Card Container */}
        <div id="visitor-pass-card" className="w-full bg-slate-50 p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col items-center mb-6">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="text-primary-600 font-extrabold text-2xl">//</span>
            <div>
              <div className="text-xs font-bold text-slate-900 tracking-wider uppercase">BML Munjal University</div>
              <div className="text-[10px] text-slate-500 font-mono">Gate Entry Pass #{String(visit.visit_id).padStart(6, '0')}</div>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200 mb-3">
            <QRCodeSVG 
              value={passPayload} 
              size={170} 
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="text-[11px] text-slate-500 mb-4 font-mono">
            Scan at Campus Security Gate or quote Pass #{String(visit.visit_id).padStart(6, '0')}
          </div>

          <div className="w-full border-t border-slate-200 pt-4 space-y-2 text-left text-xs text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Visitor:</span>
              <span className="font-bold text-slate-900">{visit.visitor_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Phone:</span>
              <span className="font-mono text-slate-800">{visit.visitor_phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Category:</span>
              <span className="font-semibold text-primary-600 capitalize">{visit.visitor_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Host:</span>
              <span className="font-semibold text-slate-900">{visit.host_name || 'N/A'} ({visit.department_name || 'Campus'})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Expected:</span>
              <span className="font-semibold text-slate-900">{visit.expected_date} {visit.expected_time || ''}</span>
            </div>
            {visit.registration_number && (
              <div className="flex justify-between">
                <span className="text-slate-500">Vehicle:</span>
                <span className="font-mono font-bold text-slate-900">{visit.vehicle_type} - {visit.registration_number}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
              <span className="text-slate-500">Pass Status:</span>
              <StatusBadge status={visit.status} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={() => window.print()}
            className="btn-secondary flex-1 py-2 text-xs"
          >
            🖨️ Print Pass
          </button>
          <button
            onClick={onClose}
            className="btn-primary flex-1 py-2 text-xs"
          >
            Close Pass
          </button>
        </div>
      </div>
    </Modal>
  );
}
