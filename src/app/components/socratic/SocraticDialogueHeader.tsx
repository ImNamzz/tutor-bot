"use client";
import React from "react";

export const SocraticDialogueHeader: React.FC<{
  currentTopic: string;
  questionType: string;
  difficulty: string;
  timeInTopic: string;
}> = ({ currentTopic, questionType, difficulty, timeInTopic }) => {
  return (
    <div className="border-b border-border p-3 bg-card/40">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{currentTopic}</div>
        <div className="text-[11px] text-muted-foreground">{timeInTopic}</div>
      </div>
      <div className="text-[11px] text-muted-foreground mt-1">
        {questionType} • {difficulty}
      </div>
    </div>
  );
};
