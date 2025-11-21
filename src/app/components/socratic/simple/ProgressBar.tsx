"use client";
import React from "react";

export const ProgressBar: React.FC<{
  current: number;
  total: number;
  label?: string;
}> = ({ current, total, label }) => {
  const pct =
    total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  return (
    <div className="space-y-1">
      {label && <div className="text-xs text-muted-foreground">{label}</div>}
      <div className="h-2 w-full bg-muted rounded">
        <div
          className="h-full bg-blue-600 rounded transition-all"
          style={{ width: pct + "%" }}
        />
      </div>
      <div className="text-[11px] text-muted-foreground">
        {current}/{total} ({pct}%)
      </div>
    </div>
  );
};
