"use client";

import { useMemo } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { ClassEvent, DeadlineEvent } from "../types/schedule";
import { getCourseColorClasses } from "../utils/colors";
import { cn } from "../../components/ui/utils";

export type DayClassesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  classes: ClassEvent[];
  deadlines?: DeadlineEvent[];
  onUnschedule?: (classEvent: ClassEvent) => void;
  onUnscheduleDeadline?: (deadlineEvent: DeadlineEvent) => void;
};

export default function DayClassesDialog({
  open,
  onOpenChange,
  date,
  classes,
  deadlines = [],
  onUnschedule,
  onUnscheduleDeadline,
}: DayClassesDialogProps) {
  // Sort classes by time (earliest to latest)
  const sortedClasses = useMemo(() => {
    if (!classes || classes.length === 0) return [];

    return [...classes].sort((a, b) => {
      const timeA = a.time || "00:00";
      const timeB = b.time || "00:00";
      // Compare time strings (HH:MM format)
      if (timeA < timeB) return -1;
      if (timeA > timeB) return 1;
      // If same time, sort by course name
      return a.course.localeCompare(b.course);
    });
  }, [classes]);

  // Sort deadlines by dateTime (earliest to latest)
  const sortedDeadlines = useMemo(() => {
    if (!deadlines || deadlines.length === 0) return [];

    return [...deadlines].sort((a, b) => {
      return a.dateTime.getTime() - b.dateTime.getTime();
    });
  }, [deadlines]);

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{date ? formatDate(date) : "Classes"}</DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {/* Deadlines */}
          {sortedDeadlines.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-muted-foreground">
                Deadlines
              </h3>
              {sortedDeadlines.map((deadline) => {
                const priorityColors = {
                  urgent: {
                    bg: "bg-red-100 dark:bg-red-900/30",
                    text: "text-red-700 dark:text-red-300",
                    border: "border-red-300 dark:border-red-700",
                  },
                  normal: {
                    bg: "bg-blue-100 dark:bg-blue-900/30",
                    text: "text-blue-700 dark:text-blue-300",
                    border: "border-blue-300 dark:border-blue-700",
                  },
                  early: {
                    bg: "bg-green-100 dark:bg-green-900/30",
                    text: "text-green-700 dark:text-green-300",
                    border: "border-green-300 dark:border-green-700",
                  },
                };
                const colors = priorityColors[deadline.priority];
                const deadlineTime = deadline.dateTime.toLocaleTimeString(
                  "en-US",
                  {
                    hour: "numeric",
                    minute: "2-digit",
                  }
                );

                return (
                  <div
                    key={deadline.id}
                    className={cn(
                      "p-4 rounded-lg border transition-all border-2",
                      colors.bg,
                      colors.border
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className={cn("font-semibold mb-1", colors.text)}>
                          {deadline.name}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Time:</span>
                            <span>{deadlineTime}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary capitalize">
                              {deadline.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                      {onUnscheduleDeadline && (
                        <button
                          onClick={() => {
                            onUnscheduleDeadline(deadline);
                            if (
                              sortedClasses.length === 0 &&
                              sortedDeadlines.length === 1
                            ) {
                              onOpenChange(false);
                            }
                          }}
                          className={cn(
                            "p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors",
                            colors.text
                          )}
                          aria-label="Remove deadline"
                        >
                          <X className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Classes */}
          {sortedClasses.length > 0 && (
            <>
              {sortedDeadlines.length > 0 && (
                <h3 className="text-sm font-semibold text-muted-foreground mt-4">
                  Classes
                </h3>
              )}
              {sortedClasses.map((classEvent) => {
                const colorClasses = getCourseColorClasses(classEvent.course);

                return (
                  <div
                    key={classEvent.id}
                    className={cn(
                      "p-4 rounded-lg border transition-all",
                      colorClasses.bg,
                      colorClasses.border,
                      "border-2"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div
                          className={cn(
                            "font-semibold mb-1",
                            colorClasses.text
                          )}
                        >
                          {classEvent.course}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Time:</span>
                            <span>{formatTime(classEvent.time)}</span>
                          </div>
                          {classEvent.location && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Location:</span>
                              <span>{classEvent.location}</span>
                            </div>
                          )}
                          {classEvent.type === "recurring" && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">
                                Recurring
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      {onUnschedule && (
                        <button
                          onClick={() => {
                            onUnschedule(classEvent);
                            if (sortedClasses.length === 1) {
                              onOpenChange(false);
                            }
                          }}
                          className={cn(
                            "p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors",
                            colorClasses.text
                          )}
                          aria-label="Unschedule class"
                        >
                          <X className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {sortedClasses.length === 0 && sortedDeadlines.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No events scheduled for this day
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
