"use client";

import { useEffect, useState } from "react";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";
import { ClassEvent } from "../types/schedule";

export type ScheduleClassProps = {
  selectedDate?: Date;
  onAddClass: (event: ClassEvent) => void;
  onClose?: () => void;
};

export default function ScheduleClass({
  selectedDate,
  onAddClass,
  onClose,
}: ScheduleClassProps) {
  const [course, setCourse] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [mode, setMode] = useState<"select" | "new">("select");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("eduassist_classes");
      if (raw) {
        const parsed = JSON.parse(raw);
        console.log("Loaded classes:", parsed);
        if (Array.isArray(parsed)) setAvailableClasses(parsed);
      }
    } catch (e) {
      console.log("Failed to parse classes", e);
    }
  }, []);

  useEffect(() => {
    if (mode !== "select") return;
    if (!course) return;
    const found = availableClasses.find(
      (c) => (c.title || c.name || "") === course
    );
    if (found && found.location) setLocation(found.location);
  }, [course, mode, availableClasses]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDate) {
      toast.error("Select a date first");
      return;
    }
    const newClass: ClassEvent = {
      id: crypto.randomUUID(),
      course: course || "Untitled",
      time: time || "--:--",
      location: location || undefined,
      date: selectedDate,
      type: "one-time",
      color: "bg-green-500",
    };
    onAddClass(newClass);
    toast.success("Class scheduled", {
      description: `${
        newClass.course
      } on ${selectedDate.toLocaleDateString()} at ${newClass.time}${
        newClass.location ? ` in ${newClass.location}` : ""
      }`,
    });
    setCourse("");
    setTime("");
    setLocation("");
    onClose?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="date">Selected date</Label>
        <Input
          id="date"
          value={
            selectedDate ? selectedDate.toDateString() : "No date selected"
          }
          readOnly
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="course">Course</Label>
        <select
          id="course"
          value={mode === "new" ? "new" : course || ""}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "new") {
              setMode("new");
              setCourse("");
              return;
            }
            setMode("select");
            setCourse(val);
          }}
          className="w-full flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          required
        >
          <option value="" disabled>
            Select a course...
          </option>
          {availableClasses.length > 0 ? (
            availableClasses.map((cls) => (
              <option key={cls.id} value={cls.title || cls.name || ""}>
                {cls.title || cls.name || "Untitled"}
              </option>
            ))
          ) : (
            <option disabled>No classes found in Dashboard</option>
          )}
          <option value="new">+ Type manually...</option>
        </select>
        {mode === "new" && (
          <Input
            placeholder="Type course name"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            required
            className="mt-2"
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="time">Class time</Label>
        <Input
          id="time"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          placeholder="e.g., Room 101 or Zoom link"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      <div className="pt-2">
        <Button type="submit" className="w-full">
          Schedule
        </Button>
      </div>
    </form>
  );
}
