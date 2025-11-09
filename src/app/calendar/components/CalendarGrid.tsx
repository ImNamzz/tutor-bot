"use client";

import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Plus } from "lucide-react";
import { Button } from "../../components/ui/button";
import { cn } from "../../components/ui/utils";
import { ClassEvent, DeadlineEvent } from "../types/schedule";
import { getCourseColorClasses } from "../utils/colors";
import DayClassesDialog from "./DayClassesDialog";
import AddEventDialog from "./AddEventDialog";

export type CalendarDay = {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
};

export type CalendarGridProps = {
  date?: Date;
  onDateChange?: (date?: Date) => void;
  classes?: ClassEvent[];
  deadlines?: DeadlineEvent[];
  onUnschedule?: (classEvent: ClassEvent) => void;
  onUnscheduleDeadline?: (deadlineEvent: DeadlineEvent) => void;
  onAddClass?: (classEvent: ClassEvent) => void;
  onAddDeadline?: (deadlineEvent: DeadlineEvent) => void;
};

export default function CalendarGrid({
  date,
  onDateChange,
  classes = [],
  deadlines = [],
  onUnschedule,
  onUnscheduleDeadline,
  onAddClass,
  onAddDeadline,
}: CalendarGridProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = date || new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  // View dialog state restored
  const [selectedDayForDialog, setSelectedDayForDialog] = useState<Date | null>(
    null
  );
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDayForAdd, setSelectedDayForAdd] = useState<Date | null>(null);

  // Update current month when date prop changes
  useEffect(() => {
    if (date) {
      const newMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      setCurrentMonth(newMonth);
    }
  }, [date]);

  const monthDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    // First day to display (might be from previous month)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Go back to Sunday

    // Last day to display (ensure we have exactly 5 weeks = 35 days)
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 34);

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = date ? new Date(date) : null;
    if (selectedDate) {
      selectedDate.setHours(0, 0, 0, 0);
    }

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateCopy = new Date(currentDate);
      const isCurrentMonth = currentDate.getMonth() === month;
      const isToday = dateCopy.getTime() === today.getTime();
      const isSelected =
        selectedDate !== null && dateCopy.getTime() === selectedDate.getTime();

      days.push({
        date: dateCopy,
        day: currentDate.getDate(),
        isCurrentMonth,
        isToday,
        isSelected,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }, [currentMonth, date]);

  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const handleDateClick = (day: CalendarDay) => {
    // Just select the date, don't open dialog
    onDateChange?.(day.date);
  };

  const handleOpenViewDialog = (day: CalendarDay, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedDayForDialog(day.date);
    setIsViewDialogOpen(true);
  };

  const handleOpenAddDialog = (day: CalendarDay, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedDayForAdd(day.date);
    setIsAddDialogOpen(true);
  };

  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(date.getDate()).padStart(2, "0")}`;
  };

  // Calculate events and deadlines for the displayed month
  const eventsByDate = useMemo(() => {
    const eventsMap: { [key: string]: ClassEvent[] } = {};
    const deadlinesMap: { [key: string]: DeadlineEvent[] } = {};
    const startDate = monthDays[0]?.date;
    const endDate = monthDays[monthDays.length - 1]?.date;

    if (!startDate || !endDate)
      return { events: eventsMap, deadlines: deadlinesMap };

    // Process classes
    classes.forEach((classEvent) => {
      if (classEvent.type === "one-time" && classEvent.date) {
        const dateKey = formatDateKey(classEvent.date);
        if (!eventsMap[dateKey]) {
          eventsMap[dateKey] = [];
        }
        eventsMap[dateKey].push(classEvent);
      } else if (
        classEvent.type === "recurring" &&
        classEvent.recurringDay !== undefined
      ) {
        // Generate recurring events for the visible month
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          if (currentDate.getDay() === classEvent.recurringDay) {
            const dateKey = formatDateKey(currentDate);
            if (!eventsMap[dateKey]) {
              eventsMap[dateKey] = [];
            }
            eventsMap[dateKey].push(classEvent);
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    });

    // Process deadlines
    deadlines.forEach((deadline) => {
      const dateKey = formatDateKey(deadline.dateTime);
      if (!deadlinesMap[dateKey]) {
        deadlinesMap[dateKey] = [];
      }
      deadlinesMap[dateKey].push(deadline);
    });

    return { events: eventsMap, deadlines: deadlinesMap };
  }, [classes, deadlines, monthDays]);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPreviousMonth}
          className="size-8"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <h2 className="text-lg font-bold text-foreground">{monthName}</h2>
        <Button
          variant="outline"
          size="icon"
          onClick={goToNextMonth}
          className="size-8"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className="text-center py-2 text-sm font-semibold text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {monthDays.map((day, index) => {
          const dateKey = formatDateKey(day.date);
          const dayEvents = eventsByDate.events[dateKey] || [];
          const dayDeadlines = eventsByDate.deadlines[dateKey] || [];
          const hasAnyEvents = dayEvents.length > 0 || dayDeadlines.length > 0;

          return (
            <div
              key={index}
              onClick={() => handleDateClick(day)}
              className={cn(
                "min-h-[120px] p-2.5 border rounded-lg cursor-pointer transition-all duration-200",
                "flex flex-col hover:border-primary/40 hover:shadow-sm",
                "relative group",
                day.isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-md ring-2 ring-primary/20"
                  : "bg-card border-border",
                !day.isCurrentMonth && "opacity-40",
                day.isToday &&
                  !day.isSelected &&
                  "border-2 border-primary/60 bg-accent/30 font-semibold"
              )}
            >
              {/* Date number and View Classes button */}
              <div className="flex items-start justify-between mb-2 flex-shrink-0">
                <div
                  className={cn(
                    "text-sm font-semibold",
                    day.isSelected
                      ? "text-primary-foreground"
                      : day.isCurrentMonth
                      ? "text-foreground"
                      : "text-muted-foreground",
                    day.isToday && !day.isSelected && "text-primary"
                  )}
                >
                  {day.day}
                </div>
                {/* Plus button to add class/deadline */}
                <button
                  onClick={(e) => handleOpenAddDialog(day, e)}
                  className={cn(
                    "size-5 rounded-full flex items-center justify-center",
                    "transition-all duration-200",
                    "hover:scale-110 active:scale-95",
                    "opacity-0 group-hover:opacity-100",
                    "bg-primary/10 hover:bg-primary/20 shadow-sm hover:shadow",
                    day.isSelected
                      ? "text-primary-foreground bg-primary-foreground/20 hover:bg-primary-foreground/30"
                      : "text-primary"
                  )}
                  aria-label="Add class or deadline"
                  title="Add class or deadline"
                >
                  <Plus className="size-3" />
                </button>

                {/* Removed view-all (+) button */}
              </div>

              {/* Events/Classes area */}
              <div className="flex-1 space-y-1 overflow-hidden">
                {/* Display deadlines first */}
                {dayDeadlines.slice(0, 2).map((deadline) => {
                  const priorityColors = {
                    urgent:
                      "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700",
                    normal:
                      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700",
                    early:
                      "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700",
                  };

                  return (
                    <div
                      key={deadline.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenViewDialog(day, e);
                      }}
                      className={cn(
                        "event-item",
                        "text-xs px-2 py-1 rounded-md group relative cursor-pointer",
                        "hover:opacity-80 transition-opacity border",
                        priorityColors[deadline.priority]
                      )}
                      title={`${deadline.name} - ${deadline.priority} priority`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold truncate flex-1">
                          {deadline.name}
                        </span>
                        {onUnscheduleDeadline && (
                          <X
                            className="size-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUnscheduleDeadline(deadline);
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Display classes */}
                {dayEvents.slice(0, 3 - dayDeadlines.length).map((event) => {
                  const colorClasses = getCourseColorClasses(event.course);

                  return (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenViewDialog(day, e);
                      }}
                      className={cn(
                        "event-item",
                        "text-xs px-2 py-1.5 rounded-md group relative cursor-pointer",
                        "hover:opacity-80 transition-opacity",
                        colorClasses.bg,
                        colorClasses.border,
                        "border"
                      )}
                      title={`${event.course} at ${event.time}${
                        event.location ? ` - ${event.location}` : ""
                      }${event.type === "recurring" ? " (Recurring)" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex-1 min-w-0">
                          <div
                            className={cn(
                              "font-semibold truncate",
                              colorClasses.text
                            )}
                          >
                            {event.course}
                          </div>
                          <div
                            className={cn(
                              "text-[10px] mt-0.5",
                              colorClasses.text,
                              "opacity-80"
                            )}
                          >
                            {event.time}
                          </div>
                        </div>
                        {onUnschedule && (
                          <X
                            className={cn(
                              "size-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0",
                              colorClasses.text
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              onUnschedule(event);
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Show more indicator */}
                {dayEvents.length + dayDeadlines.length > 3 && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenViewDialog(day, e);
                    }}
                    className={cn(
                      "text-xs font-medium cursor-pointer hover:underline",
                      day.isSelected
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                    )}
                  >
                    +{dayEvents.length + dayDeadlines.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Day Classes Dialog */}
      <DayClassesDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        date={selectedDayForDialog}
        classes={
          selectedDayForDialog
            ? eventsByDate.events[formatDateKey(selectedDayForDialog)] || []
            : []
        }
        deadlines={
          selectedDayForDialog
            ? eventsByDate.deadlines[formatDateKey(selectedDayForDialog)] || []
            : []
        }
        onUnschedule={onUnschedule}
        onUnscheduleDeadline={onUnscheduleDeadline}
      />

      {/* Add Event Dialog */}
      <AddEventDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        date={selectedDayForAdd}
        onAddClass={onAddClass}
        onAddDeadline={onAddDeadline}
      />
    </div>
  );
}
