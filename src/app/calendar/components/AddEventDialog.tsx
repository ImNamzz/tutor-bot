"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { ClassEvent, DeadlineEvent, CustomEvent } from "../types/schedule";
import { toast } from "sonner";
import ViewToggle from "./ViewToggle";

const weekDays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export type AddEventDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  onAddClass?: (classEvent: ClassEvent) => void;
  onAddDeadline?: (deadlineEvent: DeadlineEvent) => void;
  onAddEvent?: (customEvent: CustomEvent) => void;
};

export default function AddEventDialog({
  open,
  onOpenChange,
  date,
  onAddClass,
  onAddDeadline,
  onAddEvent,
}: AddEventDialogProps) {
  const [viewType, setViewType] = useState<"class" | "deadline" | "event">("class");

  // Class fields
  const [course, setCourse] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number | null>(
    null
  );

  // Deadline fields
  const [deadlineName, setDeadlineName] = useState("");
  const [deadlineDateTime, setDeadlineDateTime] = useState("");
  const [priority, setPriority] = useState<"urgent" | "normal" | "early">(
    "normal"
  );

  // Event fields
  const [eventName, setEventName] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDate, setEventDate] = useState("");

  // Update selectedDayOfWeek when date changes
  useEffect(() => {
    if (date && !isRecurring && viewType === "class") {
      setSelectedDayOfWeek(date.getDay());
    }
  }, [date, isRecurring, viewType]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setCourse("");
      setTime("");
      setLocation("");
      setIsRecurring(false);
      setSelectedDayOfWeek(null);
      setDeadlineName("");
      setDeadlineDateTime("");
      setPriority("normal");
      setEventName("");
      setEventTime("");
      setEventLocation("");
      setEventDate("");
      setViewType("class");
    }
  }, [open]);

  // Set default deadline date/time when date changes
  useEffect(() => {
    if (date && viewType === "deadline" && !deadlineDateTime) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const defaultTime = "23:59";
      setDeadlineDateTime(`${year}-${month}-${day}T${defaultTime}`);
    }
    if (date && viewType === "event" && !eventDate) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      setEventDate(`${year}-${month}-${day}`);
    }
  }, [date, viewType, deadlineDateTime, eventDate]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (viewType === "class") {
      if (!course || !time) {
        toast.error("Please fill in required fields");
        return;
      }

      if (isRecurring && selectedDayOfWeek === null) {
        toast.error("Please select a day of the week for recurring class");
        return;
      }

      const classEvent: ClassEvent = {
        id: `class-${Date.now()}-${Math.random()}`,
        course,
        time,
        location: location || undefined,
        type: isRecurring ? "recurring" : "one-time",
        color: "bg-green-500",
        ...(isRecurring
          ? { recurringDay: selectedDayOfWeek! }
          : { date: date! }),
      };

      onAddClass?.(classEvent);

      toast.success(
        isRecurring
          ? `Class scheduled every ${weekDays[selectedDayOfWeek!]}`
          : "Class scheduled",
        {
          description: `${course} at ${time}${
            location ? ` in ${location}` : ""
          }`,
        }
      );
    } else if (viewType === "deadline") {
      // Deadline
      if (!deadlineName || !deadlineDateTime) {
        toast.error("Please fill in required fields");
        return;
      }

      if (!date) {
        toast.error("Please select a date first");
        return;
      }

      const deadlineEvent: DeadlineEvent = {
        id: `deadline-${Date.now()}-${Math.random()}`,
        name: deadlineName,
        dateTime: new Date(deadlineDateTime),
        priority,
      };

      onAddDeadline?.(deadlineEvent);

      toast.success("Deadline added", {
        description: `${deadlineName} - ${priority} priority`,
      });
    } else {
      // Event
      if (!eventName || !eventDate) {
        toast.error("Please fill in required fields");
        return;
      }

      const eventDateTime = new Date(eventDate);
      if (eventTime) {
        const [hours, minutes] = eventTime.split(":").map(Number);
        eventDateTime.setHours(hours, minutes);
      }

      const customEvent: CustomEvent = {
        id: `event-${Date.now()}-${Math.random()}`,
        name: eventName,
        dateTime: eventDateTime,
        time: eventTime || undefined,
        location: eventLocation || undefined,
      };

      onAddEvent?.(customEvent);

      toast.success("Event added", {
        description: `${eventName}${eventTime ? ` at ${eventTime}` : ""}${
          eventLocation ? ` in ${eventLocation}` : ""
        }`,
      });
    }

    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Add{" "}
            {viewType === "class"
              ? "Class"
              : viewType === "deadline"
              ? "Deadline"
              : "Event"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* View Toggle */}
          <ViewToggle value={viewType} onChange={setViewType} />

          {viewType === "class" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="course">Course name</Label>
                <Input
                  id="course"
                  placeholder="e.g., Calculus I"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="time">Class time</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Room 101"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              {/* Recurring checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recurring"
                  checked={isRecurring}
                  onCheckedChange={(checked) => {
                    setIsRecurring(checked as boolean);
                    if (!checked) {
                      setSelectedDayOfWeek(null);
                    } else if (date) {
                      setSelectedDayOfWeek(date.getDay());
                    }
                  }}
                />
                <Label
                  htmlFor="recurring"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Recurring (Every week)
                </Label>
              </div>

              {/* Day of week selector for recurring */}
              {isRecurring && (
                <div className="space-y-2">
                  <Label>Every</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {weekDays.map((day, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant={
                          selectedDayOfWeek === index ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setSelectedDayOfWeek(index)}
                        className="text-xs"
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : viewType === "deadline" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="deadlineName">Deadline name</Label>
                <Input
                  id="deadlineName"
                  placeholder="e.g., Assignment 1"
                  value={deadlineName}
                  onChange={(e) => setDeadlineName(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Note: Deadlines are managed through action items from lectures.
                  New deadlines should be created by analyzing lecture content.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="deadlineDateTime">Date & Time</Label>
                <Input
                  id="deadlineDateTime"
                  type="datetime-local"
                  value={deadlineDateTime}
                  onChange={(e) => setDeadlineDateTime(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <RadioGroup
                  value={priority}
                  onValueChange={(value: any) => setPriority(value)}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="urgent" id="urgent" />
                    <Label
                      htmlFor="urgent"
                      className="cursor-pointer font-normal text-red-600 dark:text-red-400"
                    >
                      Urgent
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="normal" id="normal" />
                    <Label
                      htmlFor="normal"
                      className="cursor-pointer font-normal text-blue-600 dark:text-blue-400"
                    >
                      Normal
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="early" id="early" />
                    <Label
                      htmlFor="early"
                      className="cursor-pointer font-normal text-green-600 dark:text-green-400"
                    >
                      Early
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="eventName">Event name</Label>
                <Input
                  id="eventName"
                  placeholder="e.g., Project meeting"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="eventDate">Date</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="eventTime">Time (Optional)</Label>
                <Input
                  id="eventTime"
                  type="time"
                  placeholder="e.g., 14:30"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="eventLocation">Location (Optional)</Label>
                <Input
                  id="eventLocation"
                  placeholder="e.g., Conference room B"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add{" "}
              {viewType === "class"
                ? "Class"
                : viewType === "deadline"
                ? "Deadline"
                : "Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
