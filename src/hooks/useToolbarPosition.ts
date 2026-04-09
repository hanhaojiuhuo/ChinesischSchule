"use client";

import { useState, useEffect, useCallback } from "react";
import { TOOLBAR_POS_KEY, type ToolbarPos } from "@/lib/constants";

/**
 * Manages the admin toolbar position (top / bottom) with persistence in
 * `sessionStorage` and cross-component synchronisation via a custom DOM event.
 */
export function useToolbarPosition(isAdmin: boolean) {
  const [toolbarPosition, setToolbarPositionState] = useState<ToolbarPos>("bottom");

  // Read toolbar position from sessionStorage on mount (only when admin)
  useEffect(() => {
    if (!isAdmin) return;
    try {
      const stored = sessionStorage.getItem(TOOLBAR_POS_KEY) as ToolbarPos | null;
      if (stored === "top" || stored === "bottom") {
        setToolbarPositionState(stored);
      }
    } catch { /* ignore */ }
  }, [isAdmin]);

  const setToolbarPosition = useCallback((pos: ToolbarPos) => {
    setToolbarPositionState(pos);
    try { sessionStorage.setItem(TOOLBAR_POS_KEY, pos); } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent("toolbar-position-change", { detail: pos }));
  }, []);

  return { toolbarPosition, setToolbarPosition } as const;
}
