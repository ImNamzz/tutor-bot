"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  motion,
  useMotionValue,
  animate,
  useDragControls,
  AnimatePresence,
} from "framer-motion";
import { createPortal } from "react-dom";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/components/ui/utils";
import { X, ChevronsRight, Bell, Filter as FilterIcon } from "lucide-react";

export interface EventItem {
  id: string;
  title: string;
  description?: string;
  timestamp?: string;
  isSeen?: boolean;
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
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [mounted, setMounted] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterDate, setFilterDate] = useState<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const unseenCount = useMemo(
    () => items.reduce((acc, ev) => acc + (!ev.isSeen ? 1 : 0), 0),
    [items]
  );

  const filteredItems = useMemo(() => {
    if (!filterDate) return items;
    const matchDate = filterDate; // yyyy-mm-dd
    return items.filter((ev) => {
      if (!ev.timestamp) return false;
      const d = new Date(ev.timestamp);
      if (isNaN(d.getTime())) return false;
      const iso = d.toISOString().slice(0, 10);
      return iso === matchDate;
    });
  }, [items, filterDate]);

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
          "relative bg-card border border-border shadow-2xl transition-all duration-200",
          expanded
            ? "overflow-hidden rounded-xl flex flex-col max-h-[70vh]"
            : "overflow-visible h-[52px] w-[52px] rounded-full flex items-center justify-center"
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
              className="cursor-grab active:cursor-grabbing flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 touch-none relative"
            >
              <div className="flex items-center gap-2 pointer-events-none">
                <span className="text-xs font-bold tracking-wide text-gray-600 uppercase">
                  Captured Events
                </span>
                <span className="text-[10px] text-gray-400">
                  Total: {filteredItems.length}
                </span>
              </div>

              {/* Buttons Area - Stop propagation to prevent drag start */}
              <div
                className="flex items-center gap-1"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-gray-200 rounded-full"
                  onClick={() => setFilterOpen((v) => !v)}
                  title="Filter by date"
                >
                  <FilterIcon className="h-4 w-4 text-gray-500" />
                </Button>
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

            {/* Filter Control */}
            {filterOpen && (
              <div
                className="px-4 py-2 border-b border-gray-100 bg-background/80"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <label className="text-[11px] text-gray-500 mr-2">Date:</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="rounded-md border border-border bg-card px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                {filterDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-7 px-2 text-xs"
                    onClick={() => setFilterDate("")}
                  >
                    Clear
                  </Button>
                )}
              </div>
            )}

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-background dark:bg-card/40">
              {items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-xs text-gray-400">
                    No items captured yet.
                  </p>
                </div>
              )}
              {filteredItems.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className="rounded-lg border border-border bg-card p-2.5 shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-pointer"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground dark:text-white flex-1 whitespace-normal">
                        {ev.title && ev.title.length > 0 ? ev.title : 'Action Item'}
                      </p>
                      {ev.timestamp && (
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                          {ev.timestamp}
                        </span>
                      )}
                    </div>
                    {ev.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
                        {ev.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          // Collapsed State (Icon) - Draggable
          <div
            className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-purple-50 rounded-full relative"
            onClick={() => {
              if (isDraggingRef.current) return;
              setExpanded(true);
            }}
            onPointerDown={(e) => dragControls.start(e)}
          >
            <Bell className="h-6 w-6 text-purple-600" />
            {unseenCount > 0 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                className="pointer-events-none absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold z-10"
              >
                {unseenCount > 99 ? "99+" : unseenCount}
              </motion.div>
            )}
          </div>
        )}
      </div>
      {/* Detail Popup via Portal */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {selectedEvent && (
              <motion.div
                key="event-overlay"
                className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedEvent(null)}
              >
                <motion.div
                  key="event-modal"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl p-6 relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-3 right-3 h-8 w-8 rounded-full hover:bg-muted"
                    onClick={() => setSelectedEvent(null)}
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="space-y-3">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                      {selectedEvent.title}
                    </h2>
                    {selectedEvent.timestamp && (
                      <p className="text-xs text-muted-foreground">
                        {selectedEvent.timestamp}
                      </p>
                    )}
                    {selectedEvent.description && (
                      <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                        {selectedEvent.description}
                      </p>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </motion.div>
  );
};

export default EventWidget;
