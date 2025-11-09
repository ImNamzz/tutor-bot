"use client";

import { useState } from "react";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";

export type ScheduleClassProps = {
  selectedDate?: Date;
};

export default function ScheduleClass({ selectedDate }: ScheduleClassProps) {
  const [course, setCourse] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    toast.success("Class scheduled", {
      description: `${course || "Untitled"} on ${
        selectedDate?.toLocaleDateString() || "no date"
      } at ${time || "--:--"} in ${location || "TBD"}`,
    });
    setCourse("");
    setTime("");
    setLocation("");
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
        <Label htmlFor="course">Course name</Label>
        <Input
          id="course"
          placeholder="e.g., Calculus I"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          required
        />
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
