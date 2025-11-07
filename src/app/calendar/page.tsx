"use client";

import { useEffect, useState } from "react";
import CalendarView from "./components/CalendarView";
import Topbar from "../components/Topbar";
import { ClassEvent, DeadlineEvent } from "./types/schedule";
import { toast } from "sonner";

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [classes, setClasses] = useState<ClassEvent[]>([]);
  const [deadlines, setDeadlines] = useState<DeadlineEvent[]>([]);

  // Set initial date on client to avoid hydration mismatch
  useEffect(() => {
    setDate(new Date());
    // Load classes from localStorage if available
    const savedClasses = localStorage.getItem("calendar-classes");
    if (savedClasses) {
      try {
        const parsed = JSON.parse(savedClasses);
        // Convert date strings back to Date objects
        const classesWithDates = parsed.map((cls: any) => ({
          ...cls,
          date: cls.date ? new Date(cls.date) : undefined,
        }));
        setClasses(classesWithDates);
      } catch (error) {
        console.error("Error loading classes from localStorage:", error);
      }
    }

    // Load deadlines from localStorage if available
    const savedDeadlines = localStorage.getItem("calendar-deadlines");
    if (savedDeadlines) {
      try {
        const parsed = JSON.parse(savedDeadlines);
        // Convert dateTime strings back to Date objects
        const deadlinesWithDates = parsed.map((dl: any) => ({
          ...dl,
          dateTime: new Date(dl.dateTime),
        }));
        setDeadlines(deadlinesWithDates);
      } catch (error) {
        console.error("Error loading deadlines from localStorage:", error);
      }
    }
  }, []);

  // Save classes to localStorage whenever classes change
  useEffect(() => {
    if (classes.length > 0 || localStorage.getItem("calendar-classes")) {
      localStorage.setItem("calendar-classes", JSON.stringify(classes));
    }
  }, [classes]);

  // Save deadlines to localStorage whenever deadlines change
  useEffect(() => {
    if (deadlines.length > 0 || localStorage.getItem("calendar-deadlines")) {
      localStorage.setItem("calendar-deadlines", JSON.stringify(deadlines));
    }
  }, [deadlines]);

  const handleAddClass = (classEvent: ClassEvent) => {
    setClasses((prev) => [...prev, classEvent]);
  };

  const handleUnschedule = (classEvent: ClassEvent) => {
    setClasses((prev) => prev.filter((cls) => cls.id !== classEvent.id));
    toast.success("Class unscheduled", {
      description: `${classEvent.course} has been removed from the calendar`,
    });
  };

  const handleAddDeadline = (deadlineEvent: DeadlineEvent) => {
    setDeadlines((prev) => [...prev, deadlineEvent]);
  };

  const handleUnscheduleDeadline = (deadlineEvent: DeadlineEvent) => {
    setDeadlines((prev) => prev.filter((dl) => dl.id !== deadlineEvent.id));
    toast.success("Deadline removed", {
      description: `${deadlineEvent.name} has been removed from the calendar`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
      <Topbar />
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-xl border bg-card text-card-foreground shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden">
          <CalendarView
            date={date}
            onDateChange={setDate}
            classes={classes}
            deadlines={deadlines}
            onUnschedule={handleUnschedule}
            onUnscheduleDeadline={handleUnscheduleDeadline}
            onAddClass={handleAddClass}
            onAddDeadline={handleAddDeadline}
          />
        </div>
      </main>
    </div>
  );
}
