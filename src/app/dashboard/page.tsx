import React from "react";
import { LectureCard } from "./components/LectureCard";
import { UploadLectureModal } from "./components/UploadLectureModal";
import { ToDoSidebar } from "./components/ToDoSidebar";
import Topbar from "../components/Topbar";

// Placeholder lecture data
const lectures = [
  {
    title: "Introduction to Algorithms",
    code: "CS101",
    description: "Complexity & Big-O",
    color: "bg-indigo-500",
  },
  {
    title: "Data Structures",
    code: "CS102",
    description: "Trees & Graphs overview",
    color: "bg-emerald-500",
  },
  {
    title: "Discrete Math",
    code: "MATH210",
    description: "Logic, sets, and proofs",
    color: "bg-rose-500",
  },
  {
    title: "Operating Systems",
    code: "CS220",
    description: "Processes & Scheduling",
    color: "bg-amber-500",
  },
  {
    title: "Database Systems",
    code: "CS330",
    description: "SQL & normalization",
    color: "bg-sky-500",
  },
  {
    title: "Computer Networks",
    code: "CS340",
    description: "OSI model layers",
    color: "bg-fuchsia-500",
  },
  {
    title: "Machine Learning",
    code: "CS450",
    description: "Intro to supervised models",
    color: "bg-teal-500",
  },
  {
    title: "Software Engineering",
    code: "CS460",
    description: "Design patterns basics",
    color: "bg-purple-500",
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
      <Topbar />
      <main className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-start gap-8">
          {/* Left main content */}
          <div className="md:w-[72%] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <UploadLectureModal />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
              {lectures.map((l) => (
                <LectureCard key={l.title} {...l} />
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
