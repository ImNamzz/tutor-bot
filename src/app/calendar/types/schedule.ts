export type ClassEvent = {
  id: string;
  course: string;
  time: string;
  location?: string;
  date?: Date; // For one-time events
  recurringDay?: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday. For recurring events
  type: "one-time" | "recurring";
};

export type DeadlineEvent = {
  id: string;
  name: string;
  dateTime: Date; // Date and time of deadline
  priority: "urgent" | "normal" | "early"; // Priority level
};

export type ScheduleState = {
  classes: ClassEvent[];
  deadlines: DeadlineEvent[];
};
