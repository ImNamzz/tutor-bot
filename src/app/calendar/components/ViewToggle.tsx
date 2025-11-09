"use client";

import { cn } from "../../components/ui/utils";

export type ViewToggleProps = {
  value: "class" | "deadline";
  onChange: (value: "class" | "deadline") => void;
};

export default function ViewToggle({ value, onChange }: ViewToggleProps) {
  const handleToggle = () => {
    onChange(value === "class" ? "deadline" : "class");
  };

  const isClassSelected = value === "class";

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-muted-foreground">Type:</span>
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "relative w-32 h-10 rounded-full transition-all duration-300 ease-in-out",
          "flex items-center justify-between px-2 gap-2",
          "shadow-lg active:scale-95",
          isClassSelected
            ? "bg-gradient-to-b from-green-500 to-green-600 dark:from-green-600 dark:to-green-700"
            : "bg-gradient-to-b from-red-500 to-red-600 dark:from-red-600 dark:to-red-700"
        )}
      >
        {/* Sliding indicator with 3D effect */}
        <div
          className={cn(
            "absolute top-1 bottom-1 w-16 rounded-full",
            "bg-gradient-to-b from-white to-gray-100",
            "shadow-2xl transition-all duration-300 ease-in-out",
            "border border-gray-200/50",
            isClassSelected ? "left-1" : "right-1"
          )}
        />
        {/* Labels */}
        <span
          className={cn(
            "relative z-10 text-xs font-bold uppercase transition-all duration-300",
            "leading-none tracking-tight px-1",
            isClassSelected
              ? "text-black dark:text-black opacity-100"
              : "text-gray-300 dark:text-gray-400 opacity-50"
          )}
        >
          Class
        </span>
        <span
          className={cn(
            "relative z-10 text-xs font-bold uppercase transition-all duration-300",
            "leading-none tracking-tight px-1",
            !isClassSelected
              ? "text-black dark:text-black opacity-100"
              : "text-gray-300 dark:text-gray-400 opacity-50"
          )}
        >
          Deadline
        </span>
      </button>
    </div>
  );
}
