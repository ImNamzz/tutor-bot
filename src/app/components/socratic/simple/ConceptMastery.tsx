"use client";
import React from "react";

type Concept = {
  name: string;
  mastery: number;
  color: "blue" | "green" | "orange";
};

export const ConceptMastery: React.FC<{ concepts: Concept[] }> = ({
  concepts,
}) => {
  const colorMap = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    orange: "bg-orange-500",
  } as const;
  return (
    <div className="space-y-3">
      {concepts.map((c) => (
        <div key={c.name} className="text-xs">
          <div className="flex items-center justify-between">
            <span className="font-medium">{c.name}</span>
            <span className="text-muted-foreground">
              {Math.round(c.mastery * 100)}%
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded">
            <div
              className={`h-full rounded ${colorMap[c.color]}`}
              style={{ width: `${Math.round(c.mastery * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
