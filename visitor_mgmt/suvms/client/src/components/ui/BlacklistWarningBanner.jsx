export default function BlacklistWarningBanner({ blacklistMatch, onOverride, overrideAllowed = true }) {
  if (!blacklistMatch || !blacklistMatch.hit) return null;

  const { matchField, entry } = blacklistMatch;

  return (
    <div className="w-full bg-red-50 border-2 border-red-500 rounded-2xl p-5 mb-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="text-3xl text-red-600">⚠️</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-red-900 uppercase tracking-wide">
              Security Alert: Blacklist Match Detected!
            </h4>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-600 text-white">
              MATCH: {matchField.toUpperCase()}
            </span>
          </div>

          <p className="text-xs text-red-800 mt-1 font-medium">
            This visitor or vehicle is flagged in the Campus Security Blacklist.
          </p>

          <div className="mt-3 bg-white border border-red-200 rounded-xl p-3 text-xs text-slate-800 space-y-1 shadow-xs">
            <div><strong className="text-slate-900">Reason:</strong> <span className="text-red-700 font-medium">{entry?.reason}</span></div>
            {entry?.name && <div><strong className="text-slate-900">Flagged Name:</strong> {entry.name}</div>}
            {entry?.phone && <div><strong className="text-slate-900">Flagged Phone:</strong> {entry.phone}</div>}
            {entry?.vehicle_number && <div><strong className="text-slate-900">Flagged Vehicle:</strong> <span className="font-mono font-bold text-red-700">{entry.vehicle_number}</span></div>}
            <div className="text-slate-500 text-[11px] pt-1 border-t border-slate-100">Flagged On: {new Date(entry?.added_at).toLocaleString()}</div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-red-700 font-bold">
              ⛔ Gate check-in and clearance are restricted.
            </span>
            {overrideAllowed && onOverride && (
              <button
                type="button"
                onClick={onOverride}
                className="btn-danger btn-sm text-xs font-bold self-start sm:self-auto"
              >
                Security Supervisor Override
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
