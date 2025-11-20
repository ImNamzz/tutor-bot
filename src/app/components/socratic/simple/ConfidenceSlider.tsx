"use client";
import React from "react";

export const ConfidenceSlider: React.FC<{
  value: number;
  onChange: (v: number) => void;
}> = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">Confidence:</span>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="flex-1"
      />
      <span className="text-sm w-12 text-right">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
};
