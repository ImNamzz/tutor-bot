"use client";
import React from "react";
import { Objective } from "@/app/lib/types/socratic";
import { CheckCircle2, Circle } from "lucide-react";

interface Props {
  objectives: Objective[];
  onToggle: (id: string) => void;
}

export const LearningObjectivesPanel: React.FC<Props> = ({
  objectives,
  onToggle,
}) => {
  return (
    <div className="border border-border rounded-lg p-3 bg-card/50 backdrop-blur-sm space-y-3">
      <h3 className="text-sm font-semibold tracking-wide">
        Learning Objectives
      </h3>
      {objectives.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Add objectives to track progress.
        </p>
      )}
      <ul className="space-y-2">
        {objectives.map((obj) => {
          const complete = obj.completed;
          return (
            <li key={obj.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggle(obj.id)}
                className="h-5 w-5 flex items-center justify-center rounded-full border border-border hover:bg-muted"
                aria-label={complete ? "Mark incomplete" : "Mark complete"}
              >
                {complete ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              <span
                className={`text-xs ${
                  complete ? "line-through text-muted-foreground" : ""
                }`}
              >
                {obj.text}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
