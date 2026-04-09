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
  // Use state for the stacks so React re-renders when they change
  const [past, setPast] = useState<ContentSnapshot[]>([]);
  const [future, setFuture] = useState<ContentSnapshot[]>([]);

  // Current snapshot (the one the user is looking at right now)
  const currentRef = useRef<ContentSnapshot>(initial);

  /** Save the current state as a snapshot before making a new change. */
  const pushSnapshot = useCallback(
    (snapshot: ContentSnapshot) => {
      setPast((prev) => [...prev.slice(-(MAX_HISTORY - 1)), currentRef.current]);
      currentRef.current = snapshot;
      setFuture([]); // new edit clears redo stack
    },
    [],
  );

  /** Undo: go back one step. Returns the restored snapshot, or null if nothing to undo. */
  const undo = useCallback((): ContentSnapshot | null => {
    let result: ContentSnapshot | null = null;
    setPast((prev) => {
      if (prev.length === 0) return prev;
      result = prev[prev.length - 1];
      setFuture((f) => [...f, currentRef.current]);
      currentRef.current = result!;
      return prev.slice(0, -1);
    });
    return result;
  }, []);

  /** Redo: go forward one step. Returns the restored snapshot, or null if nothing to redo. */
  const redo = useCallback((): ContentSnapshot | null => {
    let result: ContentSnapshot | null = null;
    setFuture((prev) => {
      if (prev.length === 0) return prev;
      result = prev[prev.length - 1];
      setPast((p) => [...p, currentRef.current]);
      currentRef.current = result!;
      return prev.slice(0, -1);
    });
    return result;
  }, []);

  return {
    /** Push the current content state into history (call before overwriting drafts). */
    pushSnapshot,
    /** Undo to the previous snapshot. */
    undo,
    /** Redo a previously undone snapshot. */
    redo,
    /** Whether undo is available. */
    canUndo: past.length > 0,
    /** Whether redo is available. */
    canRedo: future.length > 0,
    /** Number of undo steps available. */
    undoCount: past.length,
    /** Number of redo steps available. */
    redoCount: future.length,
  };
}
