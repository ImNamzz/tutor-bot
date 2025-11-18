"use client";
import React, { useEffect, useState } from "react";
import Topbar from "../components/Topbar";
import { ToDoSidebar } from "./components/ToDoSidebar";
import { AddClassModal } from "./components/AddClassModal";
import { ClassCard } from "./components/ClassCard";
import { ClassItem } from "@/app/lib/types/class";
import { PanelRightOpen, PanelRightClose } from "lucide-react";

const STORAGE_KEY = "eduassist_classes";

export default function DashboardPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(true);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setClasses(JSON.parse(raw));
    } catch (e) {
      console.error("Failed to load classes", e);
    }
  }, []);

  const persist = (next: ClassItem[]) => {
    setClasses(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("Failed to save classes", e);
    }
  };

  const handleAddClass = (item: ClassItem) => {
    persist([item, ...classes]);
  };

  const handleRenameClass = (id: string, newName: string) => {
    const next = classes.map((c) =>
      c.id === id ? { ...c, name: newName } : c
    );
    persist(next);
  };

  const handleDeleteClass = (id: string) => {
    const next = classes.filter((c) => c.id !== id);
    persist(next);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
      <Topbar />
      <main className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative">
          {/* Left main content */}
          <div className={`space-y-6`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <AddClassModal onAdd={handleAddClass} />
            </div>
            {mounted && classes.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No classes yet. Create one to get started.
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
              {classes.map((c) => (
                <ClassCard
                  key={c.id}
                  item={c}
                  onRename={handleRenameClass}
                  onDelete={handleDeleteClass}
                />
              ))}
            </div>
          </div>
          {/* Captured Events right rail (zip in/out like Tutor chat) */}
          <div className="fixed top-24 right-4 z-20 w-[320px] max-w-[80vw]">
            {/* Expanded panel kept mounted for slide animation */}
            <div
              className={`absolute top-0 right-0 w-[320px] max-w-[80vw] rounded-xl border bg-card shadow-xl overflow-hidden transition-all duration-300 ease-in-out ${
                eventsOpen
                  ? "translate-x-0 opacity-100"
                  : "translate-x-full opacity-0 pointer-events-none"
              }`}
            >
              <div className="flex items-center justify-between px-3 py-2 border-b">
                <span className="text-sm font-semibold">Captured Events</span>
                <button
                  type="button"
                  aria-label="Collapse Captured Events"
                  className="h-8 w-8 rounded-md border bg-white/60 hover:bg-white flex items-center justify-center"
                  onClick={() => setEventsOpen(false)}
                >
                  <PanelRightClose className="h-4 w-4" />
                </button>
              </div>
              <div className="p-3 max-h-[60vh]">
                <ToDoSidebar hideHeader className="space-y-3" />
              </div>
            </div>

            {/* Collapsed rail kept mounted for slide animation */}
            <div
              className={`absolute top-0 right-0 w-12 rounded-xl border bg-card shadow-xl flex flex-col items-center p-2 transition-all duration-300 ease-in-out ${
                eventsOpen
                  ? "translate-x-full opacity-0 pointer-events-none"
                  : "translate-x-0 opacity-100"
              }`}
            >
              <button
                type="button"
                aria-label="Open Captured Events"
                className="h-9 w-9 rounded-md border bg-white/60 hover:bg-white flex items-center justify-center"
                onClick={() => setEventsOpen(true)}
              >
                <PanelRightOpen className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
