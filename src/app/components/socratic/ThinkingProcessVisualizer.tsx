"use client";
import React from "react";

export const ThinkingProcessVisualizer: React.FC<{
  stages: string[];
  currentStage: number;
}> = ({ stages, currentStage }) => {
  return (
    <div className="border border-border rounded-lg p-3 bg-card/50 space-y-3">
      <div className="text-sm font-semibold">Thinking Process</div>
      <ol className="space-y-2">
        {stages.map((s, i) => {
          const active = i === currentStage;
          return (
            <li
              key={s}
              className={`text-xs flex items-center gap-2 ${
                active
                  ? "text-blue-700 dark:text-blue-300"
                  : "text-muted-foreground"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  active ? "bg-blue-600" : "bg-muted-foreground/40"
                }`}
              />{" "}
              {s}
            </li>
          );
        })}
      </ol>
    </div>
  );
};
