"use client";
import React from "react";

interface Props {
  value: number; // 0-1
  onChange: (v: number) => void;
}

export const ConfidenceSelfAssessment: React.FC<Props> = ({
  value,
  onChange,
}) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Confidence</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="w-full"
      />
    </div>
  );
};
