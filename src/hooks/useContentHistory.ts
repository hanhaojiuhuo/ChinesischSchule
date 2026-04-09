"use client";

import { useState, useCallback, useRef } from "react";
import type { SiteContent } from "@/i18n/translations";

interface ContentSnapshot {
  de: SiteContent;
  zh: SiteContent;
  en: SiteContent;
}

const MAX_HISTORY = 30;

/**
 * Tracks content snapshots for undo/redo.
 * Call `pushSnapshot` after meaningful edits (e.g. before each save, or on demand).
 * Call `undo()` / `redo()` to move through the history.
 */
export function useContentHistory(initial: ContentSnapshot) {
  // History stack: past snapshots (most recent at end)
  const pastRef = useRef<ContentSnapshot[]>([]);
  // Future stack: snapshots after undo (most recent at end)
  const futureRef = useRef<ContentSnapshot[]>([]);
  // Force re-render counter
  const [, setTick] = useState(0);
  const bump = useCallback(() => setTick((t) => t + 1), []);

  // Current snapshot (the one the user is looking at right now)
  const currentRef = useRef<ContentSnapshot>(initial);

  /** Save the current state as a snapshot before making a new change. */
  const pushSnapshot = useCallback(
    (snapshot: ContentSnapshot) => {
      pastRef.current = [...pastRef.current.slice(-(MAX_HISTORY - 1)), currentRef.current];
      currentRef.current = snapshot;
      futureRef.current = []; // new edit clears redo stack
      bump();
    },
    [bump],
  );

  /** Undo: go back one step. Returns the restored snapshot, or null if nothing to undo. */
  const undo = useCallback((): ContentSnapshot | null => {
    if (pastRef.current.length === 0) return null;
    const prev = pastRef.current[pastRef.current.length - 1];
    pastRef.current = pastRef.current.slice(0, -1);
    futureRef.current = [...futureRef.current, currentRef.current];
    currentRef.current = prev;
    bump();
    return prev;
  }, [bump]);

  /** Redo: go forward one step. Returns the restored snapshot, or null if nothing to redo. */
  const redo = useCallback((): ContentSnapshot | null => {
    if (futureRef.current.length === 0) return null;
    const next = futureRef.current[futureRef.current.length - 1];
    futureRef.current = futureRef.current.slice(0, -1);
    pastRef.current = [...pastRef.current, currentRef.current];
    currentRef.current = next;
    bump();
    return next;
  }, [bump]);

  return {
    /** Push the current content state into history (call before overwriting drafts). */
    pushSnapshot,
    /** Undo to the previous snapshot. */
    undo,
    /** Redo a previously undone snapshot. */
    redo,
    /** Whether undo is available. */
    canUndo: pastRef.current.length > 0,
    /** Whether redo is available. */
    canRedo: futureRef.current.length > 0,
    /** Number of undo steps available. */
    undoCount: pastRef.current.length,
    /** Number of redo steps available. */
    redoCount: futureRef.current.length,
  };
}
