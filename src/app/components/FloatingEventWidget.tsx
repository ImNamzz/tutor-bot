"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { cn } from "@/app/components/ui/utils"; // adjust if utility path differs
import { Button } from "@/app/components/ui/button";
import { X, ChevronsLeft, ChevronsRight } from "lucide-react";

// Types
interface FloatingEventWidgetProps {
  events?: { id: string; title: string; time?: string; meta?: string }[];
  className?: string;
}

const MIN_WIDTH = 300;
const MAX_WIDTH = 500;

export const FloatingEventWidget: React.FC<FloatingEventWidgetProps> = ({
  events = [],
  className,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [width, setWidth] = useState<number>(360);
  const draggingResize = useRef(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(width);

  // Motion values for drag
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Snap back to right edge (x:0) on drag end
  const handleDragEnd = useCallback(() => {
    animate(x, 0, { type: "spring", stiffness: 260, damping: 28 });
  }, [x]);

  // Resize logic via left handle
  const onResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    draggingResize.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    document.addEventListener("mousemove", onResizeMouseMove);
    document.addEventListener("mouseup", onResizeMouseUp);
  };

  const onResizeMouseMove = (e: MouseEvent) => {
    if (!draggingResize.current) return;
    const dx = startXRef.current - e.clientX; // dragging left handle horizontally
    let next = startWidthRef.current + dx;
    if (next < MIN_WIDTH) next = MIN_WIDTH;
    if (next > MAX_WIDTH) next = MAX_WIDTH;
    setWidth(next);
  };

  const onResizeMouseUp = () => {
    draggingResize.current = false;
    document.removeEventListener("mousemove", onResizeMouseMove);
    document.removeEventListener("mouseup", onResizeMouseUp);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", onResizeMouseMove);
      document.removeEventListener("mouseup", onResizeMouseUp);
    };
  }, []);

  // Collapsed icon drag container size
  const collapsedSize = 52;

  return (
    <motion.div
      drag
      dragMomentum={false}
      style={{ x, y, width: expanded ? width : collapsedSize }}
      onDragEnd={handleDragEnd}
      dragConstraints={{ left: -800, right: 800, top: -800, bottom: 800 }}
      className={cn(
        "fixed right-4 top-20 z-50 select-none",
        expanded
          ? "max-h-[70vh]"
          : "h-[52px] w-[52px] flex items-center justify-center",
        className
      )}
    >
      <div
        className={cn(
          "relative h-full w-full overflow-hidden",
          expanded &&
            "rounded-xl bg-card shadow-2xl border border-border flex flex-col"
        )}
      >
        {expanded ? (
          <>
            {/* Resize handle on left */}
            <div
              onMouseDown={onResizeMouseDown}
              className="absolute left-0 top-0 h-full w-1 cursor-ew-resize hover:bg-purple-500/60 active:bg-purple-600"
              aria-label="Resize panel"
            />
            {/* Header drag handle */}
            <motion.div
              drag
              dragMomentum={false}
              dragListener={false}
              // We'll proxy header drag to the parent by adjusting parent y directly
              onPointerDown={(e) => {
                // allow dragging only when header is grabbed
                const onMove = (ev: PointerEvent) => {
                  y.set(y.get() + ev.movementY);
                };
                const onUp = () => {
                  window.removeEventListener("pointermove", onMove);
                  window.removeEventListener("pointerup", onUp);
                  handleDragEnd();
                };
                window.addEventListener("pointermove", onMove);
                window.addEventListener("pointerup", onUp);
              }}
              className="cursor-grab active:cursor-grabbing flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50"
            >
              <span className="text-xs font-semibold tracking-wide text-gray-600 uppercase">
                Events
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(false)}
                  aria-label="Collapse"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(false)}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {events.length === 0 && (
                <p className="text-xs text-gray-500">No recent events.</p>
              )}
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-md border border-border bg-card p-2 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-gray-700 truncate">
                      {ev.title}
                    </p>
                    {ev.time && (
                      <span className="text-[10px] text-gray-400">
                        {ev.time}
                      </span>
                    )}
                  </div>
                  {ev.meta && (
                    <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">
                      {ev.meta}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-xl bg-card shadow-2xl border border-border flex items-center justify-center h-full w-full">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Expand events"
              onClick={() => setExpanded(true)}
              className="hover:bg-purple-50"
            >
              <ChevronsLeft className="h-5 w-5 text-purple-600" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FloatingEventWidget;
