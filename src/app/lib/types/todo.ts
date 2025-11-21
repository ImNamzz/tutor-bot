export type TodoStatus = "todo" | "in-progress" | "done";

export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  updatedAt?: number;
  focusCount?: number;
}
