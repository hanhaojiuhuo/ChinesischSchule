"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Auto-logout timeout in milliseconds (10 minutes). */
export const TIMEOUT_MS = 10 * 60 * 1000;

/** How many seconds before expiry the warning popup appears (2 minutes). */
export const WARNING_THRESHOLD_S = 2 * 60;

/** How often the countdown display updates (every second). */
const TICK_INTERVAL_MS = 1_000;

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

/**
 * Hook that automatically logs the user out after {@link TIMEOUT_MS}.
 *
 * The timer is **not** reset by general activity (mouse, keyboard, etc.).
 * Instead a warning popup appears {@link WARNING_THRESHOLD_S} seconds before
 * expiry. Only an explicit call to `extendSession()` (e.g. by clicking
 * "Extend" in the popup) resets the timer.
 *
 * @param active  – whether the session is currently active (e.g. `isAdmin`)
 * @param onLogout – callback to invoke when time expires
 */
export function useAutoLogout(
  active: boolean,
  onLogout: () => void
): AutoLogoutState {
  const totalSeconds = Math.floor(TIMEOUT_MS / 1000);

  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [showWarning, setShowWarning] = useState(false);

  // Track the wall-clock timestamp when the session should expire.
  const deadlineRef = useRef<number>(0);

  // Keep onLogout ref stable to avoid re-subscribing event listeners.
  const logoutRef = useRef(onLogout);
  useEffect(() => {
    logoutRef.current = onLogout;
  }, [onLogout]);

  // --- extend session callback ---
  const extendSession = useCallback(() => {
    deadlineRef.current = Date.now() + TIMEOUT_MS;
    setShowWarning(false);
    setRemainingSeconds(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (!active) return;

    // Initialise deadline on activation.
    deadlineRef.current = Date.now() + TIMEOUT_MS;

    // --- 1-second tick to update `remainingSeconds` and check expiry ---
    const tick = window.setInterval(() => {
      const ms = deadlineRef.current - Date.now();
      if (ms <= 0) {
        setRemainingSeconds(0);
        setShowWarning(false);
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
