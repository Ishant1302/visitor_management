import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/axiosClient';

const TimeContext = createContext(null);

export function TimeProvider({ children }) {
  // Offset in milliseconds from local system time (0 = live clock)
  const [simulatedOffsetMs, setSimulatedOffsetMs] = useState(() => {
    try {
      const saved = sessionStorage.getItem('suvms_time_offset');
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  // 12-hour vs 24-hour preference
  const [is24Hour, setIs24Hour] = useState(() => {
    try {
      return localStorage.getItem('suvms_clock_24h') === 'true';
    } catch {
      return false;
    }
  });

  // Current ticking timestamp
  const [nowTimestamp, setNowTimestamp] = useState(() => Date.now() + simulatedOffsetMs);
  const [serverStatus, setServerStatus] = useState('connecting'); // 'synced' | 'local_only' | 'connecting'
  const [serverTimezone, setServerTimezone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'
  );

  // Sync with host server API on load
  const syncWithServer = useCallback(async () => {
    try {
      const res = await api.get('/system/time');
      if (res.data?.status === 'ok') {
        setServerStatus('synced');
        if (res.data.timezone) {
          setServerTimezone(res.data.timezone);
        }
      }
    } catch {
      // Local host fallback — browser clock is already local system time
      setServerStatus('local_only');
    }
  }, []);

  useEffect(() => {
    syncWithServer();
    const serverInterval = setInterval(syncWithServer, 60000); // verify sync every minute
    return () => clearInterval(serverInterval);
  }, [syncWithServer]);

  // Tick every second (1000ms)
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTimestamp(Date.now() + simulatedOffsetMs);
    }, 1000);
    return () => clearInterval(timer);
  }, [simulatedOffsetMs]);

  // Active Date object
  const currentDate = useMemo(() => new Date(nowTimestamp), [nowTimestamp]);

  // Set simulated time (e.g., test tomorrow's passes or evening check-in)
  const setSimulatedTime = useCallback((targetDate) => {
    const targetMs = targetDate instanceof Date ? targetDate.getTime() : new Date(targetDate).getTime();
    if (isNaN(targetMs)) return;
    const offset = targetMs - Date.now();
    setSimulatedOffsetMs(offset);
    setNowTimestamp(Date.now() + offset);
    try {
      sessionStorage.setItem('suvms_time_offset', String(offset));
    } catch {
      // ignore
    }
  }, []);

  // Quick helper to offset by minutes/hours/days
  const addTimeOffset = useCallback((minutesToAdd) => {
    const newOffset = simulatedOffsetMs + (minutesToAdd * 60 * 1000);
    setSimulatedOffsetMs(newOffset);
    setNowTimestamp(Date.now() + newOffset);
    try {
      sessionStorage.setItem('suvms_time_offset', String(newOffset));
    } catch {
      // ignore
    }
  }, [simulatedOffsetMs]);

  // Reset back to live system hardware clock
  const resetToLive = useCallback(() => {
    setSimulatedOffsetMs(0);
    setNowTimestamp(Date.now());
    try {
      sessionStorage.removeItem('suvms_time_offset');
    } catch {
      // ignore
    }
  }, []);

  // Toggle 12h / 24h
  const toggle12_24Hour = useCallback(() => {
    setIs24Hour(prev => {
      const next = !prev;
      try {
        localStorage.setItem('suvms_clock_24h', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Formatted date strings
  const formattedDate = useMemo(() => {
    return currentDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [currentDate]);

  const formattedDateLong = useMemo(() => {
    return currentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [currentDate]);

  // Formatted time with ticking seconds
  const formattedTime = useMemo(() => {
    return currentDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: !is24Hour,
    });
  }, [currentDate, is24Hour]);

  // Compact time (without seconds, for mobile or small tags)
  const formattedTimeCompact = useMemo(() => {
    return currentDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: !is24Hour,
    });
  }, [currentDate, is24Hour]);

  // Local ISO date format YYYY-MM-DD (safe against UTC offset shifts)
  const dateInputValue = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, '0');
    const d = String(currentDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [currentDate]);

  // Local time format HH:MM
  const timeInputValue = useMemo(() => {
    const h = String(currentDate.getHours()).padStart(2, '0');
    const m = String(currentDate.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }, [currentDate]);

  const isSimulated = Math.abs(simulatedOffsetMs) > 1000;

  const value = {
    currentDate,
    formattedDate,
    formattedDateLong,
    formattedTime,
    formattedTimeCompact,
    dateInputValue,
    timeInputValue,
    is24Hour,
    toggle12_24Hour,
    isSimulated,
    simulatedOffsetMs,
    setSimulatedTime,
    addTimeOffset,
    resetToLive,
    syncWithServer,
    serverStatus,
    serverTimezone,
  };

  return (
    <TimeContext.Provider value={value}>
      {children}
    </TimeContext.Provider>
  );
}

export function useTime() {
  const ctx = useContext(TimeContext);
  if (!ctx) {
    throw new Error('useTime must be used within a TimeProvider');
  }
  return ctx;
}
