"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/** Auto-logout timeout in milliseconds (10 minutes). */
const TIMEOUT_MS = 10 * 60 * 1000;

/** How often the countdown display updates (every second). */
const TICK_INTERVAL_MS = 1_000;

/** Events that count as "user activity". */
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "click",
];

/**
 * Hook that automatically logs the user out after {@link TIMEOUT_MS} of
 * inactivity.  Returns `remainingSeconds` so the UI can display a countdown.
 *
 * @param active  – whether the session is currently active (e.g. `isAdmin`)
 * @param onLogout – callback to invoke when time expires
 */
export function useAutoLogout(
  active: boolean,
  onLogout: () => void
): { remainingSeconds: number } {
  const [remainingSeconds, setRemainingSeconds] = useState(
    Math.floor(TIMEOUT_MS / 1000)
  );

  // Track the wall-clock timestamp when the session should expire.
  const deadlineRef = useRef<number>(0);

  // Keep onLogout ref stable to avoid re-subscribing event listeners.
  const logoutRef = useRef(onLogout);
  useEffect(() => {
    logoutRef.current = onLogout;
  }, [onLogout]);

  /** Reset the deadline to "now + TIMEOUT_MS". */
  const resetTimer = useCallback(() => {
    deadlineRef.current = Date.now() + TIMEOUT_MS;
  }, []);

  useEffect(() => {
    if (!active) return;

    // Initialise deadline on activation.
    deadlineRef.current = Date.now() + TIMEOUT_MS;

    // --- activity listeners ---
    const handleActivity = () => {
      deadlineRef.current = Date.now() + TIMEOUT_MS;
    };

    for (const evt of ACTIVITY_EVENTS) {
      window.addEventListener(evt, handleActivity, { passive: true });
    }

    // --- 1-second tick to update `remainingSeconds` and check expiry ---
    const tick = window.setInterval(() => {
      const ms = deadlineRef.current - Date.now();
      if (ms <= 0) {
        setRemainingSeconds(0);
        logoutRef.current();
      } else {
        setRemainingSeconds(Math.ceil(ms / 1000));
      }
    }, TICK_INTERVAL_MS);

    return () => {
      for (const evt of ACTIVITY_EVENTS) {
        window.removeEventListener(evt, handleActivity);
      }
      window.clearInterval(tick);
    };
  }, [active, resetTimer]);

  return { remainingSeconds: active ? remainingSeconds : 0 };
}
