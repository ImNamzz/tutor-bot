"use client";
import React from "react";

export const ConceptMasteryTracker: React.FC<{
  concepts: { term: string; mastery: number; questions: number }[];
}> = ({ concepts }) => {
  return (
    <div className="border border-border rounded-lg p-3 bg-card/50 space-y-3">
      <div className="text-sm font-semibold">Concept Mastery</div>
      <ul className="space-y-2">
        {concepts.map((c) => (
          <li key={c.term} className="text-xs">
            <div className="flex items-center justify-between">
              <span className="font-medium">{c.term}</span>
              <span className="text-muted-foreground">
                {Math.round(c.mastery * 100)}%
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded">
              <div
                className="h-full bg-green-600 rounded"
                style={{ width: `${Math.round(c.mastery * 100)}%` }}
              />
            </div>
            <div className="text-[11px] text-muted-foreground">
              Questions: {c.questions}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
