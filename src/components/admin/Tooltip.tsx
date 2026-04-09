"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

/**
 * Inline help tooltip that shows on hover.
 * Wraps any element and shows a tooltip text on hover/focus.
 */
export function Tooltip({ text, children, position = "top" }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    timeoutRef.current = setTimeout(() => setVisible(false), 150);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const positionClasses: Record<string, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className={`absolute z-50 px-2.5 py-1.5 text-xs text-white bg-gray-800 rounded shadow-lg whitespace-nowrap pointer-events-none ${positionClasses[position]}`}
        >
          {text}
        </span>
      )}
    </span>
  );
}

/**
 * Small "?" help icon that reveals a tooltip on hover.
 */
export function HelpIcon({ text, position = "top" }: { text: string; position?: TooltipProps["position"] }) {
  return (
    <Tooltip text={text} position={position}>
      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-[10px] font-bold cursor-help hover:bg-gray-300 transition-colors ml-1">
        ?
      </span>
    </Tooltip>
  );
}
