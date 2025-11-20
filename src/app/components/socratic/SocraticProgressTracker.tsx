"use client";
import React from "react";
import { SocraticProgressState } from "@/app/lib/types/socratic";

interface Props {
  progress: SocraticProgressState;
}

export const SocraticProgressTracker: React.FC<Props> = ({ progress }) => {
  const pct =
    progress.totalSteps > 0
      ? (progress.currentStep / progress.totalSteps) * 100
      : 0;
  return (
    <div className="border border-border rounded-lg p-3 bg-card/50 backdrop-blur-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide">
          Socratic Progress
        </h3>
        <span className="text-xs text-muted-foreground">
          {progress.currentStep}/{progress.totalSteps}
        </span>
      </div>
      <div className="h-2 w-full rounded bg-muted overflow-hidden">
        <div
          className="h-full bg-blue-600 dark:bg-blue-500 transition-all"
          style={{ width: pct + "%" }}
        />
      </div>
      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <div className="flex flex-col">
          <span className="text-muted-foreground">Confidence</span>
          <span className="font-medium text-green-600 dark:text-green-400">
            {progress.confidenceLevel}%
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-muted-foreground">Time</span>
          <span className="font-medium">{formatTime(progress.timeSpent)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-muted-foreground">Mastery</span>
          <span className="font-medium text-purple-600 dark:text-purple-400">
            {Math.round(pct)}%
          </span>
        </div>
      </div>
    </div>
  );
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
