"use client";
import React, { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import EventWidget from "./components/EventWidget";
import { AddClassModal } from "./components/AddClassModal";
import { ClassCard } from "./components/ClassCard";
import { ClassItem } from "@/app/lib/types/class";
import {
  CalendarDays,
  Activity,
  AlarmClock,
  Search,
  Filter,
} from "lucide-react";

const STORAGE_KEY = "eduassist_classes";

export default function DashboardPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "upcoming" | "ended"
  >("all");

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

  // Derived helpers
  const getClassStatus = (c: ClassItem): "active" | "upcoming" | "ended" => {
    if (!c.lectures || c.lectures.length === 0) return "upcoming";
    const newest = c.lectures
      .map((l) => new Date(l.createdAt).getTime())
      .reduce((a, b) => Math.max(a, b), 0);
    const days = (Date.now() - newest) / (1000 * 60 * 60 * 24);
    return days <= 14 ? "active" : "ended";
  };

  const filteredClasses = useMemo(() => {
    const q = query.trim().toLowerCase();
    return classes.filter((c) => {
      const matchQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.code?.toLowerCase().includes(q) ?? false);
      const status = getClassStatus(c);
      const matchStatus = statusFilter === "all" || status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [classes, query, statusFilter]);

  const stats = useMemo(() => {
    const total = classes.length;
    const upcoming = classes.filter(
      (c) => getClassStatus(c) === "upcoming"
    ).length;
    const recentActivity = classes.reduce((acc, c) => {
      return (
        acc +
        c.lectures.filter(
          (l) =>
            (Date.now() - new Date(l.createdAt).getTime()) /
              (1000 * 60 * 60 * 24) <=
            7
        ).length
      );
    }, 0);
    return { total, upcoming, recentActivity };
  }, [classes]);

  return (
    <div className="min-h-screen bg-background dark:bg-background transition-colors">
      {/* Fixed Topbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 dark:bg-card/80 backdrop-blur-sm border-b border-border dark:border-border">
        <Topbar />
      </nav>
      {/* Main content offset by topbar height */}
      <main className="pt-24 max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <AddClassModal onAdd={handleAddClass} />
            </div>
            {/* Quick Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-secondary text-primary flex items-center justify-center dark:bg-indigo-950/40">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Total Classes
                    </div>
                    <div className="text-lg font-semibold">{stats.total}</div>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
                    <AlarmClock className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Upcoming Classes
                    </div>
                    <div className="text-lg font-semibold">
                      {stats.upcoming}
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-green-100 dark:bg-green-950/40 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Recent Activity
                    </div>
                    <div className="text-lg font-semibold">
                      {stats.recentActivity}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="mt-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search classes..."
                  className="w-full rounded-lg border border-border bg-background dark:bg-card pl-9 pr-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  className="rounded-lg border border-border bg-background dark:bg-card px-2 py-2 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="ended">Ended</option>
                </select>
              </div>
            </div>

            {mounted && filteredClasses.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No classes match your filters.
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredClasses.map((c) => (
                <ClassCard
                  key={c.id}
                  item={c}
                  onRename={handleRenameClass}
                  onDelete={handleDeleteClass}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* EventWidget mounted at the root level to allow free dragging */}
      <EventWidget />
    </div>
  );
}
