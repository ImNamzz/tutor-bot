"use client";
import React from "react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";

export const CurrentSessionCard: React.FC<{
  title: string;
  source: string;
  duration: string;
  concepts: string[];
}> = ({ title, source, duration, concepts }) => {
  return (
    <div className="border border-border rounded-lg p-3 bg-card/50 space-y-2">
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground">{source}</div>
      <div className="text-xs text-muted-foreground">{duration}</div>
      <div className="flex gap-1.5 flex-wrap mt-1">
        {concepts.map((c) => (
          <Badge key={c} variant="secondary" className="text-[10px]">
            {c}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export const LearningObjectives: React.FC<{
  objectives: { id: number; text: string; progress: number }[];
}> = ({ objectives }) => {
  return (
    <div className="border border-border rounded-lg p-3 bg-card/50 space-y-3">
      <div className="text-sm font-semibold">Learning Objectives</div>
      <ul className="space-y-2">
        {objectives.map((o) => (
          <li key={o.id} className="text-xs">
            <div className="flex items-center justify-between">
              <span>{o.text}</span>
              <span className="text-muted-foreground">{o.progress}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded">
              <div
                className="h-full bg-green-600 rounded"
                style={{ width: `${o.progress}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const SessionContextPanel: React.FC = () => {
  return (
    <div className="space-y-3">
      <CurrentSessionCard
        title="Ubiquitin-Protein Degradation"
        source="Lecture Transcript - Bio 301"
        duration="45 min estimated"
        concepts={["Ubiquitin", "Proteasome", "Protein Regulation"]}
      />
      <LearningObjectives
        objectives={[
          { id: 1, text: "Explain ubiquitin tagging process", progress: 75 },
          { id: 2, text: "Describe proteasome function", progress: 40 },
          { id: 3, text: "Identify regulatory signals", progress: 20 },
        ]}
      />
      <div className="border border-border rounded-lg p-3 bg-card/50 space-y-2">
        <div className="text-sm font-semibold">Quick Tools</div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline">
            Switch Material
          </Button>
          <Button size="sm" variant="outline">
            Session Settings
          </Button>
          <Button size="sm">Export Notes</Button>
        </div>
      </div>
    </div>
  );
};
