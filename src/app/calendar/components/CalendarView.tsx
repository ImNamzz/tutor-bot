"use client";

import CalendarGrid from "./CalendarGrid";
import { ClassEvent, DeadlineEvent } from "../types/schedule";

export type CalendarViewProps = {
  date?: Date;
  onDateChange?: (date?: Date) => void;
  classes?: ClassEvent[];
  deadlines?: DeadlineEvent[];
  onUnschedule?: (classEvent: ClassEvent) => void;
  onUnscheduleDeadline?: (deadlineEvent: DeadlineEvent) => void;
  onAddClass?: (classEvent: ClassEvent) => void;
  onAddDeadline?: (deadlineEvent: DeadlineEvent) => void;
};

export default function CalendarView({
  date,
  onDateChange,
  classes,
  deadlines,
  onUnschedule,
  onUnscheduleDeadline,
  onAddClass,
  onAddDeadline,
}: CalendarViewProps) {
  return (
    <div className="p-5 sm:p-6">
      <CalendarGrid
        date={date}
        onDateChange={onDateChange}
        classes={classes}
        deadlines={deadlines}
        onUnschedule={onUnschedule}
        onUnscheduleDeadline={onUnscheduleDeadline}
        onAddClass={onAddClass}
        onAddDeadline={onAddDeadline}
      />
    </div>
  );
}
