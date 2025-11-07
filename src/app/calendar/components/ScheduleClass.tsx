"use client";

import { useState, useEffect } from "react";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { toast } from "sonner";
import { ClassEvent } from "../types/schedule";

export type ScheduleClassProps = {
  selectedDate?: Date;
  onSchedule?: (classEvent: ClassEvent) => void;
};

const weekDays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function ScheduleClass({
  selectedDate,
  onSchedule,
}: ScheduleClassProps) {
  const [course, setCourse] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number | null>(
    null
  );

  // Update selectedDayOfWeek when selectedDate changes
  useEffect(() => {
    if (selectedDate && !isRecurring) {
      setSelectedDayOfWeek(selectedDate.getDay());
    }
  }, [selectedDate, isRecurring]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

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
      ...(isRecurring
        ? { recurringDay: selectedDayOfWeek! }
        : { date: selectedDate! }),
    };

    onSchedule?.(classEvent);

    toast.success(
      isRecurring
        ? `Class scheduled every ${weekDays[selectedDayOfWeek!]}`
        : "Class scheduled",
      {
        description: `${course} at ${time}${location ? ` in ${location}` : ""}`,
      }
    );

    // Reset form
    setCourse("");
    setTime("");
    setLocation("");
    setIsRecurring(false);
    setSelectedDayOfWeek(null);
  }

  const getDayName = (dayIndex: number) => {
    return weekDays[dayIndex];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="date" className="text-sm">
          Selected date
        </Label>
        <Input
          id="date"
          value={
            selectedDate ? selectedDate.toDateString() : "No date selected"
          }
          readOnly
          disabled={isRecurring}
          className="h-8 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="course" className="text-sm">
          Course name
        </Label>
        <Input
          id="course"
          placeholder="e.g., Calculus I"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          required
          className="h-8 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="time" className="text-sm">
          Class time
        </Label>
        <Input
          id="time"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
          className="h-8 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="location" className="text-sm">
          Location
        </Label>
        <Input
          id="location"
          placeholder="e.g., Room 101"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      {/* Recurring checkbox */}
      <div className="flex items-center space-x-2 pt-1">
        <Checkbox
          id="recurring"
          checked={isRecurring}
          onCheckedChange={(checked) => {
            setIsRecurring(checked as boolean);
            if (!checked) {
              setSelectedDayOfWeek(null);
            } else if (selectedDate) {
              setSelectedDayOfWeek(selectedDate.getDay());
            }
          }}
        />
        <Label
          htmlFor="recurring"
          className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          Recurring (Every week)
        </Label>
      </div>

      {/* Day of week selector for recurring */}
      {isRecurring && (
        <div className="space-y-1.5">
          <Label className="text-sm">Every</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {weekDays.map((day, index) => (
              <Button
                key={index}
                type="button"
                variant={selectedDayOfWeek === index ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDayOfWeek(index)}
                className="text-xs h-7"
              >
                {day}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="pt-1">
        <Button type="submit" className="w-full h-8 text-sm">
          {isRecurring ? "Schedule Recurring" : "Schedule"}
        </Button>
      </div>
    </form>
  );
}
