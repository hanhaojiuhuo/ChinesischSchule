"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Auto-logout timeout in milliseconds (10 minutes). */
export const TIMEOUT_MS = 10 * 60 * 1000;

/** How many seconds before expiry the warning popup appears (2 minutes). */
export const WARNING_THRESHOLD_S = 2 * 60;

/** How often the countdown display updates (every second). */
const TICK_INTERVAL_MS = 1_000;

/** sessionStorage key used to persist the deadline across page navigations. */
const DEADLINE_STORAGE_KEY = "yixin-session-deadline";

export interface AutoLogoutState {
  /** Seconds left until automatic logout. */
  remainingSeconds: number;
  /** Total session timeout in seconds. */
  totalSeconds: number;
  /** True when the warning popup should be shown. */
  showWarning: boolean;
  /** Call this to extend the session by another full timeout period. */
  extendSession: () => void;
}

/** Read the persisted deadline from sessionStorage, or return 0. */
function readDeadline(): number {
  try {
    const raw = sessionStorage.getItem(DEADLINE_STORAGE_KEY);
    if (raw) {
      const v = Number(raw);
      if (Number.isFinite(v) && v > 0) return v;
    }
  } catch { /* SSR / privacy mode */ }
  return 0;
}

/** Persist the deadline so it survives page navigations. */
function writeDeadline(deadline: number): void {
  try {
    sessionStorage.setItem(DEADLINE_STORAGE_KEY, String(deadline));
  } catch { /* ignore */ }
}

/** Remove the persisted deadline (e.g. on logout / expiry). */
function clearDeadline(): void {
  try {
    sessionStorage.removeItem(DEADLINE_STORAGE_KEY);
  } catch { /* ignore */ }
}

/**
 * Hook that automatically logs the user out after {@link TIMEOUT_MS}.
 *
 * The timer is **not** reset by general activity (mouse, keyboard, etc.).
 * Instead a warning popup appears {@link WARNING_THRESHOLD_S} seconds before
 * expiry. Only an explicit call to `extendSession()` (e.g. by clicking
 * "Extend" in the popup) resets the timer.
 *
 * The deadline is stored in `sessionStorage` so the countdown is preserved
 * when the user navigates between pages (e.g. edit-mode website ↔ admin panel).
 *
 * @param active  – whether the session is currently active (e.g. `isAdmin`)
 * @param onLogout – callback to invoke when time expires
 */
export function useAutoLogout(
  active: boolean,
  onLogout: () => void
): AutoLogoutState {
  const totalSeconds = Math.floor(TIMEOUT_MS / 1000);

  // Compute initial remaining seconds from a persisted deadline (if any).
  // Always check sessionStorage even when `active` is false (auth still
  // loading) so the UI never briefly flashes the full 10-min default when
  // navigating between pages.
  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    const stored = readDeadline();
    if (stored > Date.now()) return Math.ceil((stored - Date.now()) / 1000);
    return totalSeconds;
  });
  const [showWarning, setShowWarning] = useState(() => {
    const stored = readDeadline();
    if (stored > Date.now()) {
      return Math.ceil((stored - Date.now()) / 1000) <= WARNING_THRESHOLD_S;
    }
    return false;
  });

  // Track the wall-clock timestamp when the session should expire.
  const deadlineRef = useRef<number>(0);

  // Track whether the session was previously active so we can distinguish
  // an initial mount (active starts as false while auth loads) from a real
  // logout (active transitions true → false).
  const wasActiveRef = useRef(false);

  // Keep onLogout ref stable to avoid re-subscribing event listeners.
  const logoutRef = useRef(onLogout);
  useEffect(() => {
    logoutRef.current = onLogout;
  }, [onLogout]);

  // --- extend session callback ---
  const extendSession = useCallback(() => {
    const newDeadline = Date.now() + TIMEOUT_MS;
    deadlineRef.current = newDeadline;
    writeDeadline(newDeadline);
    setShowWarning(false);
    setRemainingSeconds(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (!active) {
      // Only clear the persisted deadline on a real logout (active went from
      // true → false), not on initial mount where active starts as false while
      // AuthContext is still restoring the session asynchronously.
      if (wasActiveRef.current) {
        clearDeadline();
      }
      wasActiveRef.current = false;
      return;
    }
    wasActiveRef.current = true;

    // Restore a previously-persisted deadline, or create a fresh one.
    // Immediately sync React state so the UI never shows a stale value
    // (e.g. the full 10-min default) between this effect and the first tick.
    const stored = readDeadline();
    if (stored > Date.now()) {
      deadlineRef.current = stored;
      const secs = Math.ceil((stored - Date.now()) / 1000);
      setRemainingSeconds(secs);
      setShowWarning(secs <= WARNING_THRESHOLD_S);
    } else {
      const newDeadline = Date.now() + TIMEOUT_MS;
      deadlineRef.current = newDeadline;
      writeDeadline(newDeadline);
      setRemainingSeconds(totalSeconds);
      setShowWarning(false);
    }

    // --- 1-second tick to update `remainingSeconds` and check expiry ---
    const tick = window.setInterval(() => {
      const ms = deadlineRef.current - Date.now();
      if (ms <= 0) {
        setRemainingSeconds(0);
        setShowWarning(false);
        clearDeadline();
        logoutRef.current();
      } else {
        const secs = Math.ceil(ms / 1000);
        setRemainingSeconds(secs);
        // Show warning when we enter the threshold window
        if (secs <= WARNING_THRESHOLD_S) {
          setShowWarning(true);
        }
      }
    }, TICK_INTERVAL_MS);

    return () => {
      window.clearInterval(tick);
    };
  }, [active]);

  return {
    remainingSeconds: active ? remainingSeconds : 0,
    totalSeconds,
    showWarning: active ? showWarning : false,
    extendSession,
  };
}
