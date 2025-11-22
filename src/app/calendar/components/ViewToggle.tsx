"use client";

import { cn } from "../../components/ui/utils";

export type ViewToggleProps = {
  value: "class" | "deadline" | "event";
  onChange: (value: "class" | "deadline" | "event") => void;
};

export default function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium text-muted-foreground">Type:</span>
      <div className="flex gap-3">
        {["class", "deadline", "event"].map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type as "class" | "deadline" | "event")}
            className={cn(
              "px-4 py-2 rounded-md font-medium text-sm transition-all",
              value === type
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
