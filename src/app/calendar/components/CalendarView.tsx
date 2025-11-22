"use client";

import CalendarGrid from "./CalendarGrid";
import { ClassEvent, DeadlineEvent, CustomEvent } from "../types/schedule";
import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Plus } from "lucide-react";

export type CalendarViewProps = {
  date?: Date;
  onDateChange?: (date?: Date) => void;
  classes?: ClassEvent[];
  deadlines?: DeadlineEvent[];
  events?: CustomEvent[];
  onUnschedule?: (classEvent: ClassEvent) => void;
  onUnscheduleDeadline?: (deadlineEvent: DeadlineEvent) => void;
  onAddClass?: (classEvent: ClassEvent) => void;
  onAddDeadline?: (deadlineEvent: DeadlineEvent) => void;
  onAddEvent?: (customEvent: CustomEvent) => void;
};

export default function CalendarView({
  date,
  onDateChange,
  classes,
  deadlines,
  events,
  onUnschedule,
  onUnscheduleDeadline,
  onAddClass,
  onAddDeadline,
  onAddEvent,
}: CalendarViewProps) {
  const [openAddFn, setOpenAddFn] = useState<(() => void) | null>(null);

  return (
    <div className="p-5 sm:p-6 relative">
      <CalendarGrid
        date={date}
        onDateChange={onDateChange}
        classes={classes}
        deadlines={deadlines}
        events={events}
        onUnschedule={onUnschedule}
        onUnscheduleDeadline={onUnscheduleDeadline}
        onAddClass={onAddClass}
        onAddDeadline={onAddDeadline}
        onAddEvent={onAddEvent}
        onBindAddTrigger={(fn) => setOpenAddFn(() => fn)}
      />
      {openAddFn && (
        <Button
          type="button"
          onClick={() => openAddFn()}
          className="fixed bottom-8 right-8 rounded-full shadow-lg shadow-primary/30 size-14 p-0 flex items-center justify-center text-lg font-bold"
        >
          <Plus className="size-6" />
          <span className="sr-only">Add Event</span>
        </Button>
      )}
    </div>
  );
}
