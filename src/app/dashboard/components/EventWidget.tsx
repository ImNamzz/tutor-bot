"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  animate,
  useDragControls,
} from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/components/ui/utils";
import { X, ChevronsLeft, ChevronsRight } from "lucide-react";

export interface EventItem {
  id: string;
  title: string;
  description?: string;
  timestamp?: string;
}

export interface EventWidgetProps {
  items?: EventItem[];
  className?: string;
}

const MIN_WIDTH = 300;
const MAX_WIDTH = 500;

export const EventWidget: React.FC<EventWidgetProps> = ({
  items = [],
  className,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [width, setWidth] = useState<number>(360);

  // Resize refs
  const draggingResize = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(width);
  // Distinguish drag vs click (especially in collapsed state)
  const isDraggingRef = useRef(false);

  // Motion values
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const dragControls = useDragControls();

  // Snap logic: return to right edge (x=0) on drag end
  const handleDragEnd = useCallback(() => {
    // snap back to right edge (x = 0)
    animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
    // allow y to remain wherever user placed it (except constrained by dragConstraints)
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);
  }, [x]);

  // Manage vertical position when expanded/collapsed
  useEffect(() => {
    if (expanded) {
      // Align with Add Class button approx 96px from top
      animate(y, 96, { type: "spring", stiffness: 260, damping: 28 });
    }
    // When collapsing we do not adjust y (user retains position)
  }, [expanded, y]);

  // --- Resize Logic ---
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
    const dx = startXRef.current - e.clientX; // Dragging left increases width
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

  const collapsedSize = 52;

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      onDragStart={() => {
        isDraggingRef.current = true;
      }}
      style={{ x, y, width: expanded ? width : collapsedSize }}
      onDragEnd={handleDragEnd}
      // Updated constraints: prevent moving above topbar (top:0 baseline) and allow downward freedom
      dragConstraints={{ left: -1500, right: 0, top: 0, bottom: 1000 }}
      className={cn(
        "fixed right-4 top-0 z-50 select-none flex flex-col items-end",
        className
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-white border border-gray-200 shadow-2xl transition-all duration-200",
          expanded
            ? "rounded-xl flex flex-col"
            : "h-[52px] w-[52px] rounded-full flex items-center justify-center",
          expanded && "max-h-[70vh]"
        )}
        style={{ width: expanded ? width : collapsedSize }}
      >
        {expanded ? (
          <>
            {/* Resize Handle (Left Border) */}
            <div
              onMouseDown={onResizeMouseDown}
              className="absolute left-0 top-0 h-full w-1.5 cursor-ew-resize hover:bg-purple-500/50 z-20"
              title="Drag to resize"
            />

            {/* Header (Drag Zone) */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="cursor-grab active:cursor-grabbing flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 touch-none"
            >
              <span className="text-xs font-bold tracking-wide text-gray-600 uppercase pointer-events-none">
                Captured Events
              </span>

              {/* Buttons Area - Stop propagation to prevent drag start */}
              <div
                className="flex items-center gap-1"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-gray-200 rounded-full"
                  onClick={() => setExpanded(false)}
                  title="Collapse"
                >
                  <ChevronsRight className="h-4 w-4 text-gray-500" />
                </Button>
              </div>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-white">
              {items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-xs text-gray-400">
                    No items captured yet.
                  </p>
                </div>
              )}
              {items.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-lg border border-gray-100 bg-white p-2.5 shadow-sm hover:shadow-md hover:border-purple-200 transition-all cursor-default"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {ev.title}
                    </p>
                    {ev.timestamp && (
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {ev.timestamp}
                      </span>
                    )}
                  </div>
                  {ev.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 leading-snug">
                      {ev.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          // Collapsed State (Icon) - Draggable
          <div
            className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-purple-50 rounded-full"
            onClick={() => {
              if (isDraggingRef.current) return;
              setExpanded(true);
            }}
            onPointerDown={(e) => dragControls.start(e)}
          >
            <ChevronsLeft className="h-6 w-6 text-purple-600" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default EventWidget;
