"use client";

import { useState, useCallback } from "react";
import { TOOLBAR_POS_KEY, type ToolbarPos } from "@/lib/constants";

/**
 * Manages the admin toolbar position (top / bottom) with persistence in
 * `sessionStorage` and cross-component synchronisation via a custom DOM event.
 */
export function useToolbarPosition(isAdmin: boolean) {
  // Read initial position from sessionStorage (lazy initializer — no effect needed)
  const [toolbarPosition, setToolbarPositionState] = useState<ToolbarPos>(() => {
    if (!isAdmin) return "bottom";
    try {
      const stored = sessionStorage.getItem(TOOLBAR_POS_KEY) as ToolbarPos | null;
      if (stored === "top" || stored === "bottom") return stored;
    } catch { /* ignore – SSR / privacy mode */ }
    return "bottom";
  });

  const setToolbarPosition = useCallback((pos: ToolbarPos) => {
    setToolbarPositionState(pos);
    try { sessionStorage.setItem(TOOLBAR_POS_KEY, pos); } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent("toolbar-position-change", { detail: pos }));
  }, []);

  return { toolbarPosition, setToolbarPosition } as const;
}
