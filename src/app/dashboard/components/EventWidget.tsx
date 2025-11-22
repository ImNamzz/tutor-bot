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
import { X, ChevronsRight, Bell, Filter as FilterIcon, ChevronDown, Calendar as CalendarIcon } from "lucide-react";
import { actionItemsAPI } from "@/app/lib/api";
import { toast } from "sonner";

export interface EventItem {
  id: string;
  title: string;
  description?: string;
  timestamp?: string;
  isSeen?: boolean;
}

export interface Lecture {
  id: string;
  title: string;
  action_items?: EventItem[];
}

export interface ClassGroup {
  id: string;
  name: string;
  color: string;
  lectures: Lecture[];
}

export interface EventWidgetProps {
  items?: EventItem[];
  classGroups?: ClassGroup[];
  className?: string;
}

const MIN_WIDTH = 300;
const MAX_WIDTH = 500;

export const EventWidget: React.FC<EventWidgetProps> = ({
  items = [],
  classGroups = [],
  className,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [width, setWidth] = useState<number>(360);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [mounted, setMounted] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterDate, setFilterDate] = useState<string>("");
  const [selectedLectureId, setSelectedLectureId] = useState<string | null>(null);
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [selectedEventForCalendar, setSelectedEventForCalendar] = useState<EventItem | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(new Date());
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);
  const [eventFormTime, setEventFormTime] = useState<string>("");
  const [eventFormLocation, setEventFormLocation] = useState<string>("");
  const [useEventType, setUseEventType] = useState(false);

  // Parse date from event title
  const extractDateFromTitle = (title: string): Date | null => {
    if (!title) return null;

    // Common date patterns: "April 15", "April 15, 2025", "4/15", "4/15/2025", "15 April", etc.
    const monthNames = [
      "january", "february", "march", "april", "may", "june",
      "july", "august", "september", "october", "november", "december"
    ];

    // Helper function to create a local date (no timezone conversion)
    const createLocalDate = (year: number, month: number, day: number): Date => {
      const date = new Date(year, month - 1, day);
      // Adjust for timezone offset to ensure the date stays correct
      const offset = date.getTimezoneOffset();
      date.setMinutes(date.getMinutes() - offset);
      return date;
    };

    // Pattern 1: "Month Day" or "Month Day, Year" (e.g., "April 15" or "April 15, 2025")
    const pattern1 = new RegExp(
      `(${monthNames.join("|")})\\s+(\\d{1,2})(?:,?\\s*(\\d{4}))?`,
      "i"
    );
    const match1 = title.match(pattern1);
    if (match1) {
      const month = monthNames.indexOf(match1[1].toLowerCase()) + 1;
      const day = parseInt(match1[2]);
      const year = match1[3] ? parseInt(match1[3]) : new Date().getFullYear();
      return createLocalDate(year, month, day);
    }

    // Pattern 2: "Day Month" or "Day Month Year" (e.g., "15 April" or "15 April 2025")
    const pattern2 = new RegExp(
      `(\\d{1,2})\\s+(${monthNames.join("|")})(?:\\s+(\\d{4}))?`,
      "i"
    );
    const match2 = title.match(pattern2);
    if (match2) {
      const day = parseInt(match2[1]);
      const month = monthNames.indexOf(match2[2].toLowerCase()) + 1;
      const year = match2[3] ? parseInt(match2[3]) : new Date().getFullYear();
      return createLocalDate(year, month, day);
    }

    // Pattern 3: Numeric dates "M/D" or "M/D/YYYY" (e.g., "4/15" or "4/15/2025")
    const pattern3 = /(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/;
    const match3 = title.match(pattern3);
    if (match3) {
      const month = parseInt(match3[1]);
      const day = parseInt(match3[2]);
      const year = match3[3] ? parseInt(match3[3]) : new Date().getFullYear();
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return createLocalDate(year, month, day);
      }
    }

    return null;
  };

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

  const unseenCount = useMemo(() => {
    if (classGroups.length > 0) {
      let count = 0;
      classGroups.forEach(cls => {
        cls.lectures.forEach(lec => {
          lec.action_items?.forEach(item => {
            if (!item.isSeen) count++;
          });
        });
      });
      return count;
    }
    return items.reduce((acc, ev) => acc + (!ev.isSeen ? 1 : 0), 0);
  }, [items, classGroups]);

  const filteredItems = useMemo(() => {
    if (!filterDate) return items;
    const matchDate = filterDate;
    return items.filter((ev) => {
      if (!ev.timestamp) return false;
      const d = new Date(ev.timestamp);
      if (isNaN(d.getTime())) return false;
      const iso = d.toISOString().slice(0, 10);
      return iso === matchDate;
    });
  }, [items, filterDate]);

  const getSelectedLectureItems = () => {
    if (!selectedLectureId || classGroups.length === 0) return [];
    for (const cls of classGroups) {
      for (const lec of cls.lectures) {
        if (lec.id === selectedLectureId) {
          return lec.action_items || [];
        }
      }
    }
    return [];
  };

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

  const handleAddToCalendar = async (event: EventItem) => {
    setSelectedEventForCalendar(event);
    // Try to extract date from title
    const extractedDate = extractDateFromTitle(event.title);
    setSelectedCalendarDate(extractedDate || new Date());
    setEventFormTime("");
    setEventFormLocation("");
    setUseEventType(true);
    setCalendarDialogOpen(true);
  };

  const handleConfirmAddToCalendar = async () => {
    if (!selectedEventForCalendar || !selectedCalendarDate) {
      toast.error("Please select a date");
      return;
    }

    try {
      setIsAddingToCalendar(true);
      
      if (useEventType) {
        // Add as Event type to calendar (for now, just show success)
        // In a real app, you'd send this to the calendar API
        toast.success(
          `Added "${selectedEventForCalendar.title}" as event for ${selectedCalendarDate.toDateString()}${
            eventFormTime ? ` at ${eventFormTime}` : ""
          }${eventFormLocation ? ` in ${eventFormLocation}` : ""}`
        );
      } else {
        // Add as Deadline type
        await actionItemsAPI.update(selectedEventForCalendar.id, {
          due_date: selectedCalendarDate.toISOString(),
        });

        toast.success(
          `Added "${selectedEventForCalendar.title}" as deadline for ${selectedCalendarDate.toDateString()}`
        );
      }

      setCalendarDialogOpen(false);
      setSelectedEventForCalendar(null);
      setSelectedCalendarDate(undefined);
      setEventFormTime("");
      setEventFormLocation("");
      setUseEventType(false);
    } catch (error) {
      console.error("Error adding to calendar:", error);
      toast.error("Failed to add event to calendar");
    } finally {
      setIsAddingToCalendar(false);
    }
  };

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
              {/* Show hierarchical view if classGroups provided */}
              {classGroups.length > 0 ? (
                <>
                  {selectedLectureId ? (
                    // Show action items for selected lecture
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mb-2 text-left text-xs"
                        onClick={() => setSelectedLectureId(null)}
                      >
                        ← Back to Classes
                      </Button>
                      {getSelectedLectureItems().length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <p className="text-xs text-muted-foreground">
                            No action items for this lecture.
                          </p>
                        </div>
                      ) : (
                        getSelectedLectureItems().map((ev) => (
                          <div
                            key={ev.id}
                            className="rounded-lg border border-border bg-card p-2.5 shadow-sm hover:shadow-md hover:border-primary/40 transition-all"
                          >
                            <div className="flex flex-col gap-2">
                              <div
                                onClick={() => setSelectedEvent(ev)}
                                className="cursor-pointer"
                              >
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
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full h-7 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCalendar(ev);
                                }}
                              >
                                <CalendarIcon className="w-3 h-3 mr-1" />
                                Add to Calendar
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </>
                  ) : (
                    // Show classes and lectures
                    classGroups.map((cls) => (
                      <div key={cls.id} className="space-y-1">
                        <button
                          onClick={() =>
                            setExpandedClasses((prev) => {
                              const next = new Set(prev);
                              if (next.has(cls.id)) {
                                next.delete(cls.id);
                              } else {
                                next.add(cls.id);
                              }
                              return next;
                            })
                          }
                          className="w-full text-left px-2.5 py-2 rounded-lg border border-border bg-card hover:bg-card/80 transition-all flex items-center justify-between"
                        >
                          <span
                            className="w-2 h-2 rounded-full mr-2 flex-shrink-0"
                            style={{ backgroundColor: cls.color }}
                          />
                          <span className="text-sm font-semibold text-foreground flex-1 truncate">
                            {cls.name}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {cls.lectures.reduce((acc, l) => acc + (l.action_items?.length || 0), 0)}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ml-1 ${
                              expandedClasses.has(cls.id) ? '' : '-rotate-90'
                            }`}
                          />
                        </button>

                        {expandedClasses.has(cls.id) && (
                          <div className="ml-3 space-y-1 border-l border-border/50 pl-2">
                            {cls.lectures.map((lec) => (
                              <button
                                key={lec.id}
                                onClick={() => setSelectedLectureId(lec.id)}
                                className="w-full text-left px-2 py-1.5 rounded text-xs bg-card/50 hover:bg-card border border-border/30 hover:border-border transition-all flex items-center justify-between"
                              >
                                <span className="text-foreground/80 truncate flex-1">
                                  {lec.title}
                                </span>
                                <span className="text-[11px] text-muted-foreground ml-1 flex-shrink-0">
                                  {lec.action_items?.length || 0}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </>
              ) : (
                // Show flat list if classGroups not provided
                <>
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
                      className="rounded-lg border border-border bg-card p-2.5 shadow-sm hover:shadow-md hover:border-primary/40 transition-all"
                    >
                      <div className="flex flex-col gap-2">
                        <div
                          onClick={() => setSelectedEvent(ev)}
                          className="cursor-pointer"
                        >
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
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full h-7 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCalendar(ev);
                          }}
                        >
                          <CalendarIcon className="w-3 h-3 mr-1" />
                          Add to Calendar
                        </Button>
                      </div>
                    </div>
                  ))}
                </>
              )}
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
      {/* Calendar Date Picker Dialog */}
      {mounted &&
        calendarDialogOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-lg shadow-lg p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Add to Calendar</h3>
              {selectedEventForCalendar && (
                <p className="text-sm text-muted-foreground mb-4">
                  Event: <strong>{selectedEventForCalendar.title}</strong>
                </p>
              )}

              {/* Date Field */}
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Select Date</label>
                <input
                  type="date"
                  value={selectedCalendarDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedCalendarDate(new Date(e.target.value));
                    }
                  }}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>

              {/* Event-specific fields */}
              <>
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">Time (Optional)</label>
                  <input
                    type="time"
                    placeholder="e.g., 14:30"
                    value={eventFormTime}
                    onChange={(e) => setEventFormTime(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">Location (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., Conference room B"
                    value={eventFormLocation}
                    onChange={(e) => setEventFormLocation(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </>


              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCalendarDialogOpen(false);
                    setSelectedEventForCalendar(null);
                    setEventFormTime("");
                    setEventFormLocation("");
                    setUseEventType(true);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmAddToCalendar}
                  disabled={isAddingToCalendar || !selectedCalendarDate}
                >
                  {isAddingToCalendar ? "Adding..." : "Add to Calendar"}
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
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
