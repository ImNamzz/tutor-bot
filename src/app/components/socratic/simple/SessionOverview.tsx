"use client";
import React from "react";

export const SessionInfo: React.FC<{
  title: string;
  source: string;
  estimatedTime: string;
}> = ({ title, source, estimatedTime }) => (
  <div className="border border-border rounded-lg p-3 bg-card/50 space-y-1">
    <div className="text-sm font-semibold">{title}</div>
    <div className="text-xs text-muted-foreground">{source}</div>
    <div className="text-xs text-muted-foreground">{estimatedTime}</div>
  </div>
);

export const LearningObjectives: React.FC<{ objectives: string[] }> = ({
  objectives,
}) => (
  <div className="border border-border rounded-lg p-3 bg-card/50 space-y-2">
    <div className="text-sm font-semibold">Objectives</div>
    <ul className="space-y-1">
      {objectives.map((o) => (
        <li key={o} className="text-xs flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
          <span>{o}</span>
        </li>
      ))}
    </ul>
  </div>
);

export const SessionStats: React.FC<{
  questionsCompleted: number;
  conceptsCovered: number;
  sessionDuration: string;
}> = ({ questionsCompleted, conceptsCovered, sessionDuration }) => (
  <div className="border border-border rounded-lg p-3 bg-card/50 text-xs space-y-1">
    <div className="flex items-center justify-between">
      <span>Questions</span>
      <span>{questionsCompleted}</span>
    </div>
    <div className="flex items-center justify-between">
      <span>Concepts</span>
      <span>{conceptsCovered}</span>
    </div>
    <div className="flex items-center justify-between">
      <span>Duration</span>
      <span>{sessionDuration}</span>
    </div>
  </div>
);

export const SessionOverview: React.FC = () => (
  <div className="p-3 space-y-3">
    <SessionInfo
      title="Ubiquitin-Protein Degradation"
      source="Bio 301 Lecture"
      estimatedTime="30-45 min"
    />
    <LearningObjectives
      objectives={[
        "Understand ubiquitin tagging mechanism",
        "Explain proteasome function",
        "Identify regulatory signals",
      ]}
    />
    <SessionStats
      questionsCompleted={8}
      conceptsCovered={3}
      sessionDuration="15:30"
    />
  </div>
);
