export type ClassEvent = {
  id: string;
  course: string;
  time: string;
  location?: string;
  date?: Date; // For one-time events
  recurringDay?: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday. For recurring events
  type: "one-time" | "recurring";
  color?: string; // Tailwind color class for display
};

export type DeadlineEvent = {
  id: string;
  name: string;
  dateTime: Date; // Date and time of deadline
  priority: "urgent" | "normal" | "early"; // Priority level
  actionItemId?: string; // Reference to backend ActionItem ID
  type?: string; // Action item type from backend
};

export type ScheduleState = {
  classes: ClassEvent[];
  deadlines: DeadlineEvent[];
};
