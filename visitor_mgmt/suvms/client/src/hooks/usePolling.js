import { useEffect, useRef } from 'react';

/**
 * usePolling — calls `fn` immediately and every `intervalMs`.
 * Stops when component unmounts or `enabled` becomes false.
 */
export function usePolling(fn, intervalMs = 5000, enabled = true) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!enabled) return;
    fnRef.current(); // immediate first call
    const id = setInterval(() => fnRef.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}
