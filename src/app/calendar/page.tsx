"use client";

import { useEffect, useState } from "react";
import CalendarView from "./components/CalendarView";
import Topbar from "../components/Topbar";
import { ClassEvent, DeadlineEvent, CustomEvent } from "./types/schedule";
import { toast } from "sonner";
import { actionItemsAPI, ActionItem } from "../lib/api";
import { useRouter } from "next/navigation";
import { getAccessToken } from "../lib/auth";

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [classes, setClasses] = useState<ClassEvent[]>([]);
  const [deadlines, setDeadlines] = useState<DeadlineEvent[]>([]);
  const [events, setEvents] = useState<CustomEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const router = useRouter();

  // Set initial date and load data
  useEffect(() => {
    setDate(new Date());
    const token = getAccessToken();
    setCurrentToken(token);
    loadCalendarData();
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-[#000000] dark:to-[#000000] transition-colors">
      <Topbar />
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
