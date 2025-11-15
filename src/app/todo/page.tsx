"use client";

import KanbanBoard from "./components/KanbanBoard";
import Topbar from "../components/Topbar";

export default function TodoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
      <Topbar />
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-xl border bg-card text-card-foreground shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden p-4">
          <h1 className="text-2xl font-bold mb-4">Todo</h1>
          <KanbanBoard />
        </div>
      </main>
    </div>
  );
}
