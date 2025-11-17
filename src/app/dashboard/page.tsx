"use client";
import React, { useEffect, useState } from "react";
import Topbar from "../components/Topbar";
import { ToDoSidebar } from "./components/ToDoSidebar";
import { AddClassModal } from "./components/AddClassModal";
import { ClassCard } from "./components/ClassCard";
import { ClassItem } from "@/app/lib/types/class";

const STORAGE_KEY = "eduassist_classes";

export default function DashboardPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [mounted, setMounted] = useState(false);

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
        <div className="flex flex-col md:flex-row md:items-start gap-8">
          {/* Left main content */}
          <div className="md:w-[72%] space-y-6">
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
          {/* Right sidebar */}
          <div className="md:w-[28%]">
            <ToDoSidebar />
          </div>
        </div>
      </main>
    </div>
  );
}
