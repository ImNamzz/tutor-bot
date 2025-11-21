"use client";
import React from "react";

export const LearningProgressDashboard: React.FC<{
  knowledgeGaps: string[];
  strengths: string[];
  nextFocusAreas: string[];
}> = ({ knowledgeGaps, strengths, nextFocusAreas }) => {
  return (
    <div className="border border-border rounded-lg p-3 bg-card/50 space-y-3">
      <div className="text-sm font-semibold">Learning Progress</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div>
          <div className="font-medium text-amber-600">Knowledge Gaps</div>
          <ul className="mt-1 list-disc list-inside text-muted-foreground space-y-0.5">
            {knowledgeGaps.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-medium text-green-600">Strengths</div>
          <ul className="mt-1 list-disc list-inside text-muted-foreground space-y-0.5">
            {strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-medium text-purple-600">Next Focus</div>
          <ul className="mt-1 list-disc list-inside text-muted-foreground space-y-0.5">
            {nextFocusAreas.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
