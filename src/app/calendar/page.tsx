"use client";

import { useEffect, useState } from "react";
import CalendarView from "./components/CalendarView";
import Topbar from "../components/Topbar";
import { ClassEvent, DeadlineEvent, CustomEvent } from "./types/schedule";
import { toast } from "sonner";
import { actionItemsAPI, ActionItem } from "../lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import { getAccessToken } from "../lib/auth";
import { exportCalendarToIcs } from "../lib/icsExport";
import { Button } from "@/app/components/ui/button";
import { Download, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/app/components/ui/dialog";

export default function CalendarPage() {
  const searchParams = useSearchParams();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [classes, setClasses] = useState<ClassEvent[]>([]);
  const [deadlines, setDeadlines] = useState<DeadlineEvent[]>([]);
  const [events, setEvents] = useState<CustomEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportStartMonth, setExportStartMonth] = useState(1);
  const [exportStartYear, setExportStartYear] = useState(new Date().getFullYear());
  const [exportEndMonth, setExportEndMonth] = useState(12);
  const [exportEndYear, setExportEndYear] = useState(new Date().getFullYear());
  const router = useRouter();

  // Set initial date and load data
  useEffect(() => {
    // Check for month/year in query params
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    
    if (month && year) {
      const initialDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      setDate(initialDate);
    } else {
      setDate(new Date());
    }
    
    const token = getAccessToken();
    setCurrentToken(token);
    loadCalendarData();
  }, [searchParams]);

  // Monitor for account changes and reload data
  useEffect(() => {
    const token = getAccessToken();
    if (token !== currentToken) {
      // Account changed (logged in/out or switched accounts)
      setCurrentToken(token);
      setClasses([]);
      setDeadlines([]);
      setEvents([]);
      if (token) {
        loadCalendarData();
      }
    }

    // Check for account changes every second
    const interval = setInterval(() => {
      const newToken = getAccessToken();
      if (newToken !== currentToken) {
        setCurrentToken(newToken);
        setClasses([]);
        setDeadlines([]);
        setEvents([]);
        if (newToken) {
          loadCalendarData();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentToken]);

  // Load calendar data from backend and localStorage
  const loadCalendarData = async () => {
    setIsLoading(true);
    try {
      // Get user profile to identify the current user
      const token = getAccessToken();
      if (!token) {
        setClasses([]);
        setDeadlines([]);
        setEvents([]);
        return;
      }

      // Load classes from localStorage with user-specific key
      const userClassesKey = `calendar-classes-${token.substring(0, 20)}`; // Use token prefix as user identifier
      const savedClasses = localStorage.getItem(userClassesKey);
      if (savedClasses) {
        try {
          const parsed = JSON.parse(savedClasses);
          const classesWithDates = parsed.map((cls: any) => ({
            ...cls,
            date: cls.date ? new Date(cls.date) : undefined,
          }));
          setClasses(classesWithDates);
        } catch (error) {
          console.error("Error loading classes from localStorage:", error);
        }
      }

      // Fetch deadlines from backend (action items with due_date)
      const actionItems = await actionItemsAPI.getAll();
      const deadlineEvents: DeadlineEvent[] = actionItems
        .filter(item => item.due_date) // Only items with due dates
        .map(item => ({
          id: item.id,
          name: item.content,
          dateTime: new Date(item.due_date!),
          priority: getPriorityFromType(item.type),
          actionItemId: item.id, // Store reference to action item
          type: item.type,
        }));
      
      setDeadlines(deadlineEvents);
    } catch (error: any) {
      console.error("Error loading calendar data:", error);
      if (error.message.includes("401") || error.message.includes("403")) {
        toast.error("Please login to view your calendar");
        router.push("/auth/login");
      } else {
        toast.error("Failed to load deadlines from server");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Map action item type to priority
  const getPriorityFromType = (type: string): "urgent" | "normal" | "early" => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes("urgent") || lowerType.includes("exam") || lowerType.includes("quiz")) {
      return "urgent";
    } else if (lowerType.includes("early") || lowerType.includes("reading")) {
      return "early";
    }
    return "normal";
  };

  // Save classes to localStorage whenever classes change
  useEffect(() => {
    if (classes.length > 0 || localStorage.getItem(`calendar-classes-${currentToken?.substring(0, 20) || ""}`)) {
      const token = getAccessToken();
      if (token) {
        const userClassesKey = `calendar-classes-${token.substring(0, 20)}`;
        localStorage.setItem(userClassesKey, JSON.stringify(classes));
      }
    }
  }, [classes, currentToken]);

  // Note: Deadlines are now managed via backend API, not localStorage

  const handleAddClass = (classEvent: ClassEvent) => {
    setClasses((prev) => [...prev, classEvent]);
  };

  const handleUnschedule = (classEvent: ClassEvent) => {
    setClasses((prev) => prev.filter((cls) => cls.id !== classEvent.id));
    toast.success("Class unscheduled", {
      description: `${classEvent.course} has been removed from the calendar`,
    });
  };

  const handleAddDeadline = async (deadlineEvent: DeadlineEvent) => {
    try {
      // Create or update action item in backend
      if (deadlineEvent.actionItemId) {
        // Update existing action item
        await actionItemsAPI.update(deadlineEvent.actionItemId, {
          content: deadlineEvent.name,
          type: deadlineEvent.type || "deadline",
          due_date: deadlineEvent.dateTime.toISOString(),
        });
        toast.success("Deadline updated successfully");
      } else {
        // This deadline isn't associated with a lecture/action item on the backend.
        // The backend's ActionItem model requires a `lecture_id`, so standalone
        // deadlines can't be persisted server-side right now. Keep it in local
        // calendar state and inform the user.
        setDeadlines(prev => [...prev, deadlineEvent]);
        toast.success("Deadline added", { description: `${deadlineEvent.name} - ${deadlineEvent.priority} priority` });
        return;
      }

      // Reload data from backend (for updates/creates that touched the server)
      await loadCalendarData();
    } catch (error) {
      console.error("Error adding deadline:", error);
      toast.error("Failed to add deadline");
    }
  };

  const handleUnscheduleDeadline = async (deadlineEvent: DeadlineEvent) => {
    try {
      if (deadlineEvent.actionItemId) {
        // Delete from backend
        await actionItemsAPI.delete(deadlineEvent.actionItemId);
        toast.success("Deadline removed", {
          description: `${deadlineEvent.name} has been removed from the calendar`,
        });
        // Reload data
        await loadCalendarData();
      } else {
        // Remove from local state only
        setDeadlines((prev) => prev.filter((dl) => dl.id !== deadlineEvent.id));
        toast.success("Deadline removed");
      }
    } catch (error) {
      console.error("Error removing deadline:", error);
      toast.error("Failed to remove deadline");
    }
  };

  const handleAddEvent = (customEvent: CustomEvent) => {
    setEvents((prev) => [...prev, customEvent]);
    toast.success("Event added to calendar");
  };

  const handleUnscheduleEvent = (customEvent: CustomEvent) => {
    setEvents((prev) => prev.filter((evt) => evt.id !== customEvent.id));
    toast.success("Event removed", {
      description: `${customEvent.name} has been removed from the calendar`,
    });
  };

  const filterEventsByDateRange = () => {
    const startDate = new Date(exportStartYear, exportStartMonth - 1, 1);
    const endDate = new Date(exportEndYear, exportEndMonth, 0, 23, 59, 59);

    const filteredClasses = classes.filter((cls) => {
      if (cls.type === "one-time" && cls.date) {
        return cls.date >= startDate && cls.date <= endDate;
      }
      // Include all recurring events as they span multiple dates
      return cls.type === "recurring";
    });

    const filteredDeadlines = deadlines.filter((dl) => {
      return dl.dateTime >= startDate && dl.dateTime <= endDate;
    });

    const filteredEvents = events.filter((evt) => {
      return evt.dateTime >= startDate && evt.dateTime <= endDate;
    });

    return { filteredClasses, filteredDeadlines, filteredEvents };
  };

  const handleExportCalendar = () => {
    try {
      const { filteredClasses, filteredDeadlines, filteredEvents } =
        filterEventsByDateRange();

      const startMonth = String(exportStartMonth).padStart(2, "0");
      const endMonth = String(exportEndMonth).padStart(2, "0");
      const fileName = `tutorbot-calendar-${exportStartYear}-${startMonth}-to-${exportEndYear}-${endMonth}.ics`;

      exportCalendarToIcs(
        filteredClasses,
        filteredDeadlines,
        filteredEvents,
        fileName
      );

      toast.success("Calendar exported!", {
        description: `Downloaded as ${fileName}`,
      });

      setShowExportDialog(false);
    } catch (error) {
      console.error("Error exporting calendar:", error);
      toast.error("Failed to export calendar");
    }
  };

  const handleOpenExportDialog = () => {
    // Set default range to current year
    const now = new Date();
    setExportStartMonth(1);
    setExportStartYear(now.getFullYear());
    setExportEndMonth(12);
    setExportEndYear(now.getFullYear());
    setShowExportDialog(true);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-[#000000] dark:to-[#000000] transition-colors">
      <Topbar />
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Export Button */}
        <div className="mb-4 flex justify-end">
          <Button
            onClick={handleOpenExportDialog}
            className="gap-2"
            variant="default"
          >
            <Download className="h-4 w-4" />
            Export to ICS
          </Button>
        </div>

        {/* Export Date Range Dialog */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent className="bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Export Calendar</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Select the date range for export
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Start Date */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">From</h3>
                <div className="flex gap-3">
                  {/* Start Month */}
                  <div className="flex-1">
                    <label className="text-xs text-gray-600 dark:text-gray-400">
                      Month
                    </label>
                    <select
                      value={exportStartMonth}
                      onChange={(e) => setExportStartMonth(Number(e.target.value))}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(2024, i).toLocaleString("en-US", {
                            month: "long",
                          })}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Start Year */}
                  <div className="flex-1">
                    <label className="text-xs text-gray-600 dark:text-gray-400">
                      Year
                    </label>
                    <select
                      value={exportStartYear}
                      onChange={(e) => setExportStartYear(Number(e.target.value))}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    >
                      {Array.from({ length: 10 }, (_, i) => {
                        const year = new Date().getFullYear() - 5 + i;
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              {/* End Date */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">To</h3>
                <div className="flex gap-3">
                  {/* End Month */}
                  <div className="flex-1">
                    <label className="text-xs text-gray-600 dark:text-gray-400">
                      Month
                    </label>
                    <select
                      value={exportEndMonth}
                      onChange={(e) => setExportEndMonth(Number(e.target.value))}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(2024, i).toLocaleString("en-US", {
                            month: "long",
                          })}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* End Year */}
                  <div className="flex-1">
                    <label className="text-xs text-gray-600 dark:text-gray-400">
                      Year
                    </label>
                    <select
                      value={exportEndYear}
                      onChange={(e) => setExportEndYear(Number(e.target.value))}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    >
                      {Array.from({ length: 10 }, (_, i) => {
                        const year = new Date().getFullYear() - 5 + i;
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              {/* Date Range Summary */}
              <div className="pt-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-md">
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  Exporting events from{" "}
                  <span className="font-semibold">
                    {new Date(2024, exportStartMonth - 1).toLocaleString(
                      "en-US",
                      { month: "long" }
                    )}{" "}
                    {exportStartYear}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold">
                    {new Date(2024, exportEndMonth - 1).toLocaleString("en-US", {
                      month: "long",
                    })}{" "}
                    {exportEndYear}
                  </span>
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 flex justify-end">
              <Button
                onClick={() => setShowExportDialog(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button onClick={handleExportCalendar} variant="default">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="rounded-xl border bg-card dark:bg-[#1a1a1a] text-card-foreground shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden">
          <CalendarView
            date={date}
            onDateChange={setDate}
            classes={classes}
            deadlines={deadlines}
            events={events}
            onUnschedule={handleUnschedule}
            onUnscheduleDeadline={handleUnscheduleDeadline}
            onAddClass={handleAddClass}
            onAddDeadline={handleAddDeadline}
            onAddEvent={handleAddEvent}
          />
        </div>
      </main>
    </div>
  );
}
