"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  X,
  Check,
  Clock,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/app/components/ui/utils";
import { Button } from "@/app/components/ui/button";

export type TodoStatus = "todo" | "in-progress" | "done";

export type TodoItem = {
  id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  updatedAt?: number;
  focusCount?: number;
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function loadTodos(): TodoItem[] {
  try {
    const raw = localStorage.getItem("todos");
    return raw ? (JSON.parse(raw) as TodoItem[]) : [];
  } catch {
    return [];
  }
}

function saveTodos(items: TodoItem[]) {
  localStorage.setItem("todos", JSON.stringify(items));
}

export default function KanbanBoard() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [focusId, setFocusId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const [hInput, setHInput] = useState("00");
  const [mInput, setMInput] = useState("25");
  const [sInput, setSInput] = useState("00");
  const [timeError, setTimeError] = useState<string | null>(null);

  useEffect(() => {
    setTodos(loadTodos());
  }, []);

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  useEffect(() => {
    if (!running || secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [running, secondsLeft]);

  const columns: { key: TodoStatus; title: string }[] = [
    { key: "todo", title: "To Do" },
    { key: "in-progress", title: "In Progress" },
    { key: "done", title: "Done" },
  ];

  function addTodo() {
    if (!newTitle.trim()) return;
    setTodos((prev) => [
      {
        id: uid(),
        title: newTitle.trim(),
        status: "todo",
        completed: false,
        createdAt: Date.now(),
      },
      ...prev,
    ]);
    setNewTitle("");
  }

  function updateTodo(id: string, patch: Partial<TodoItem>) {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t
      )
    );
  }

  function removeTodo(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  function toggleComplete(id: string) {
    setTodos((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const completed = !t.completed;
        return {
          ...t,
          completed,
          status: completed ? "done" : t.status === "done" ? "todo" : t.status,
          completedAt: completed ? Date.now() : undefined,
        };
      })
    );
  }

  // streak: >2 tasks finished within 1 hour
  const recentDoneCount = useMemo(() => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    return todos.filter((t) => t.completedAt && t.completedAt >= oneHourAgo)
      .length;
  }, [todos]);
  const showCompliment = recentDoneCount >= 3;

  const allDone = todos.length > 0 && todos.every((t) => t.completed);

  function startFocus(id: string, seconds: number) {
    setFocusId(id);
    setSecondsLeft(seconds);
    setRunning(true);
    updateTodo(id, {
      focusCount: (todos.find((t) => t.id === id)?.focusCount || 0) + 1,
    });
  }

  function parseCustomTime(): number {
    const h = Number(hInput);
    const m = Number(mInput);
    const s = Number(sInput);
    if ([h, m, s].some((v) => Number.isNaN(v) || v < 0)) {
      setTimeError("Invalid time values");
      return 0;
    }
    if (m > 59 || s > 59) {
      setTimeError("Minutes/seconds must be < 60");
      return 0;
    }
    const total = h * 3600 + m * 60 + s;
    if (total === 0) {
      setTimeError("Time must be > 0");
      return 0;
    }
    if (total > 12 * 3600) {
      setTimeError("Max 12 hours");
      return 0;
    }
    setTimeError(null);
    return total;
  }

  function startCustomFocus() {
    const seconds = parseCustomTime();
    if (!seconds) return;
    startFocus(focusId || todos[0]?.id, seconds);
  }

  function setPreset(minutes: number) {
    setHInput("00");
    setMInput(String(minutes).padStart(2, "0"));
    setSInput("00");
    startFocus(focusId || todos[0]?.id, minutes * 60);
  }

  function stopFocus() {
    setRunning(false);
    setFocusId(null);
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a task..."
          className="border rounded px-3 py-2 w-full"
        />
        <Button onClick={addTodo}>
          <Plus className="size-4 mr-1" /> Add
        </Button>
      </div>

      {/* Compliment banner */}
      {showCompliment && (
        <div className="p-3 rounded border bg-green-50 text-green-700">
          Great streak! You’ve completed 3+ tasks in the last hour. Keep it up!
        </div>
      )}

      {/* Focus mode: hidden until focusId set */}
      {focusId && (
        <div className="p-4 rounded border flex flex-col gap-4 bg-gray-50">
          <div className="flex items-center gap-3">
            <Clock className="size-4" />
            <div>
              <div className="text-sm">
                Focusing: {todos.find((t) => t.id === focusId)?.title}
              </div>
              <div className="text-lg font-mono">{formatTime(secondsLeft)}</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={hInput}
              onChange={(e) => setHInput(e.target.value.slice(0, 2))}
              className="w-14 border rounded px-2 py-1 font-mono text-sm"
              placeholder="HH"
            />
            <span className="font-mono">:</span>
            <input
              type="number"
              min={0}
              max={59}
              value={mInput}
              onChange={(e) => setMInput(e.target.value.slice(0, 2))}
              className="w-14 border rounded px-2 py-1 font-mono text-sm"
              placeholder="MM"
            />
            <span className="font-mono">:</span>
            <input
              type="number"
              min={0}
              max={59}
              value={sInput}
              onChange={(e) => setSInput(e.target.value.slice(0, 2))}
              className="w-14 border rounded px-2 py-1 font-mono text-sm"
              placeholder="SS"
            />
            <Button variant="outline" onClick={startCustomFocus} disabled={!!timeError}>
              <Play className="size-4 mr-1" /> Start
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setPreset(25)}>
              25m
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setPreset(50)}>
              50m
            </Button>
            <Button
              variant="outline"
              onClick={() => setRunning((v) => !v)}
              disabled={!focusId}
            >
              {running ? (
                <Pause className="size-4 mr-1" />
              ) : (
                <Play className="size-4 mr-1" />
              )} {running ? "Pause" : "Resume"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setSecondsLeft(0);
                stopFocus();
              }}
            >
              <RotateCcw className="size-4" />
            </Button>
          </div>
        </div>
        {timeError && (
          <div className="text-xs text-red-600">{timeError}</div>
        )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col) => (
          <div key={col.key} className="border rounded-lg p-3">
            <div className="font-semibold mb-2">{col.title}</div>
            <div className="space-y-2">
              {todos
                .filter((t) =>
                  col.key === "done"
                    ? t.status === "done"
                    : t.status === col.key && !t.completed
                )
                .map((t) => (
                  <div
                    key={t.id}
                    className={cn(
                      "border rounded p-2 bg-white",
                      t.completed && "opacity-70"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={t.completed}
                            onChange={() => toggleComplete(t.id)}
                          />
                          <span
                            className={cn(
                              "font-medium",
                              t.completed && "line-through"
                            )}
                          >
                            {t.title}
                          </span>
                        </label>
                        {t.description && (
                          <div
                            className={cn(
                              "text-sm text-gray-600 mt-1",
                              t.completed && "line-through"
                            )}
                          >
                            {t.description}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateTodo(t.id, { status: "todo" })}
                        >
                          ToDo
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            updateTodo(t.id, { status: "in-progress" })
                          }
                        >
                          Do
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            updateTodo(t.id, {
                              status: "done",
                              completed: true,
                              completedAt: Date.now(),
                            })
                          }
                        >
                          <Check className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTodo(t.id)}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    </div>
                    {focusId !== t.id ? (
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startFocus(t.id, 25 * 60)}
                        >
                          <Play className="size-4 mr-1" /> Focus
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-gray-600">
                        Focus count: {t.focusCount || 0}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Generate List */}
      <div className="mt-6 border rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Generate List</div>
            <div className="text-sm text-gray-600">
              Drafts a todo list using your recent transcripts and scheduled
              classes. You can review and apply them.
            </div>
          </div>
          <Button>
            <Pencil className="size-4 mr-1" /> Generate List
          </Button>
        </div>
      </div>

      {/* Finish all announcement */}
      {allDone && (
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-2 rounded shadow">
            Finish all task 🎉
          </div>
          {/* simple confetti dots */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            {Array.from({ length: 120 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-emerald-500 animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDuration: `${0.8 + Math.random()}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
