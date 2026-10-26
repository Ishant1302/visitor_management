import { useState, useRef, useEffect } from 'react';
import { useTime } from '../../hooks/useTime';

export default function LiveClock({ variant = 'navbar', className = '' }) {
  const {
    currentDate,
    formattedDate,
    formattedDateLong,
    formattedTime,
    formattedTimeCompact,
    is24Hour,
    toggle12_24Hour,
    isSimulated,
    setSimulatedTime,
    addTimeOffset,
    resetToLive,
    serverStatus,
    serverTimezone,
    dateInputValue,
    timeInputValue,
  } = useTime();

  const [isOpen, setIsOpen] = useState(false);
  const [customDate, setCustomDate] = useState(dateInputValue);
  const [customTime, setCustomTime] = useState(timeInputValue);
  const popoverRef = useRef(null);

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Keep input values in sync if user opens dialog
  useEffect(() => {
    if (!isOpen) {
      setCustomDate(dateInputValue);
      setCustomTime(timeInputValue);
    }
  }, [isOpen, dateInputValue, timeInputValue]);

  const handleApplyCustom = (e) => {
    e.preventDefault();
    if (!customDate || !customTime) return;
    const combined = new Date(`${customDate}T${customTime}:00`);
    if (!isNaN(combined.getTime())) {
      setSimulatedTime(combined);
      setIsOpen(false);
    }
  };

  /* ─────────────────────────────────────────────────────────────────
   * 1. CARD VARIANT (For Guard Dashboard & Admin Hero Sections)
   * ───────────────────────────────────────────────────────────────── */
  if (variant === 'card') {
    return (
      <div className={`relative bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-md border border-slate-700/60 flex flex-col justify-between ${className}`}>
        {/* Top meta row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSimulated ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isSimulated ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              {isSimulated ? '⚡ Simulation Clock' : '● Live Gate Time'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggle12_24Hour}
              className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition-colors"
              title="Toggle 12h / 24h format"
            >
              {is24Hour ? '24H' : '12H'}
            </button>
            <button
              onClick={() => setIsOpen(true)}
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-primary-600/80 hover:bg-primary-600 text-white transition-colors"
              title="Adjust or simulate gate time"
            >
              ⚙ Adjust
            </button>
          </div>
        </div>

        {/* Big Time Display */}
        <div className="my-1">
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono text-white flex items-baseline gap-1">
            <span>{formattedTime}</span>
          </div>
          <div className="text-sm font-medium text-slate-300 mt-1 flex items-center gap-2">
            <span>📅 {formattedDateLong}</span>
          </div>
        </div>

        {/* Bottom Status / Local Host info */}
        <div className="mt-3 pt-3 border-t border-slate-700/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Host: {serverTimezone}</span>
          {isSimulated ? (
            <button
              onClick={resetToLive}
              className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2"
            >
              Reset to Live Clock
            </button>
          ) : (
            <span className="text-emerald-400 font-medium">Synced with Local OS</span>
          )}
        </div>

        {/* Optional Modal/Popover for time adjustment */}
        {isOpen && renderAdjustModal()}
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────────
   * 2. NAVBAR VARIANT (Top-Right-Most Corner Stacked Widget)
   * ───────────────────────────────────────────────────────────────── */
  return (
    <div className={`relative ${className}`} ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`group flex items-center gap-2 px-2.5 py-1 rounded-xl border text-left transition-all duration-150 shadow-2xs select-none hover:shadow-xs ${
          isSimulated
            ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/90 hover:border-slate-300'
        }`}
        title="Current Local Host Date & Time · Click to configure or test"
      >
        {/* Pulsing indicator */}
        <span className="flex h-2 w-2 relative flex-shrink-0">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            isSimulated ? 'bg-amber-400' : 'bg-emerald-400'
          }`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${
            isSimulated ? 'bg-amber-500' : 'bg-emerald-500'
          }`} />
        </span>

        {/* Two-row compact stacked display */}
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1">
            <span className="font-mono font-bold text-xs text-slate-900 tracking-tight">
              {formattedTime}
            </span>
            {isSimulated && (
              <span className="text-[9px] bg-amber-200 text-amber-900 font-bold px-1 rounded leading-none">
                SIM
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 font-medium mt-0.5">
            {formattedDate}
          </span>
        </div>
      </button>

      {/* Popover Menu */}
      {isOpen && renderPopover()}
    </div>
  );

  /* ─────────────────────────────────────────────────────────────────
   * Render Popover (Dropdown from Navbar)
   * ───────────────────────────────────────────────────────────────── */
  function renderPopover() {
    return (
      <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-4 animate-scale-in text-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🕒</span>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Host System Clock</h4>
              <p className="text-[10px] text-slate-500">Local Machine Hardware Time</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded"
          >
            ✕
          </button>
        </div>

        {/* Full Date & Time Details */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 mb-3">
          <div className="text-[11px] text-slate-500">Current Local Time:</div>
          <div className="text-xl font-black font-mono text-slate-900 my-0.5">
            {formattedTime}
          </div>
          <div className="text-xs font-medium text-slate-700">
            {formattedDateLong}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Timezone: {serverTimezone}</span>
            <span className="text-emerald-600 font-semibold">● Local Host</span>
          </div>
        </div>

        {/* 12h vs 24h Toggle */}
        <div className="flex items-center justify-between py-2 border-t border-slate-100 text-xs">
          <span className="font-medium text-slate-600">Display Format:</span>
          <button
            onClick={toggle12_24Hour}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700 text-xs transition-colors"
          >
            Switch to {is24Hour ? '12-Hour (AM/PM)' : '24-Hour (Military)'}
          </button>
        </div>

        {/* Simulation / Update Section */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800">Update / Test Time:</span>
            {isSimulated && (
              <button
                onClick={resetToLive}
                className="text-[11px] font-bold text-primary-600 hover:text-primary-700 underline"
              >
                Reset to Live
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mb-2.5 leading-relaxed">
            Need to test tomorrow’s visits or different hours? You can adjust the system time below:
          </p>

          <form onSubmit={handleApplyCustom} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Date</label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full text-xs p-1.5 border border-slate-200 rounded-lg focus:border-primary-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Time</label>
                <input
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="w-full text-xs p-1.5 border border-slate-200 rounded-lg focus:border-primary-500 font-medium"
                />
              </div>
            </div>

            {/* Quick offset buttons */}
            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => addTimeOffset(60)}
                className="btn-secondary btn-sm flex-1 text-[10px] py-1"
                title="Add 1 hour"
              >
                +1 Hour
              </button>
              <button
                type="button"
                onClick={() => addTimeOffset(24 * 60)}
                className="btn-secondary btn-sm flex-1 text-[10px] py-1"
                title="Add 1 day"
              >
                +1 Day
              </button>
              <button
                type="submit"
                className="btn-primary btn-sm flex-1 text-[10px] py-1"
              >
                Apply
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────────
   * Render Modal (For Card variant adjust button)
   * ───────────────────────────────────────────────────────────────── */
  function renderAdjustModal() {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 text-slate-900 animate-scale-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🕒</span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Adjust System Date & Time</h3>
                <p className="text-[11px] text-slate-500">Test visitor flows across different dates/times</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 rounded"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleApplyCustom} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Date</label>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full text-sm p-2.5 border border-slate-200 rounded-xl focus:border-primary-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Time</label>
              <input
                type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="w-full text-sm p-2.5 border border-slate-200 rounded-xl focus:border-primary-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  resetToLive();
                  setIsOpen(false);
                }}
                className="btn-secondary btn-sm flex-1 text-xs"
              >
                Reset to Live
              </button>
              <button
                type="submit"
                className="btn-primary btn-sm flex-1 text-xs"
              >
                Set System Time
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}
