"use client";
import React from "react";
import { ProgressBar } from "./ProgressBar";
import { ConceptMastery } from "./ConceptMastery";

export const LearningDashboard: React.FC = () => {
  return (
    <div className="p-3 space-y-4">
      <ProgressBar current={3} total={12} label="Question Progress" />
      <div className="border border-border rounded-lg p-3 bg-card/30">
        <div className="text-sm font-semibold mb-2">Key Concepts</div>
        <ConceptMastery
          concepts={[
            { name: "Ubiquitin", mastery: 0.8, color: "blue" },
            { name: "Proteasome", mastery: 0.6, color: "green" },
            { name: "E3 Ligase", mastery: 0.3, color: "orange" },
          ]}
        />
      </div>
      <div className="border border-border rounded-lg p-3 bg-card/30">
        <div className="text-sm font-semibold">Current Focus</div>
        <div className="text-xs text-muted-foreground mt-1">
          Ubiquitin-protein binding specificity • Evidence Seeking
        </div>
      </div>
    </div>
  );
};
