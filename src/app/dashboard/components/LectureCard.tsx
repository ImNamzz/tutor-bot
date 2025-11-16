import React from "react";
import { MoreVertical } from "lucide-react";

export interface LectureCardProps {
  title: string;
  code?: string;
  description?: string;
  color?: string; // tailwind bg color class e.g. 'bg-indigo-500'
}

export const LectureCard: React.FC<LectureCardProps> = ({
  title,
  code,
  description,
  color = "bg-indigo-500",
}) => {
  return (
    <div className="group relative rounded-xl shadow-sm border border-border/50 overflow-hidden bg-card">
      <div className={`${color} h-24 w-full`} />
      <button
        className="absolute top-2 right-2 p-1 rounded-md bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition"
        aria-label="Card actions"
      >
        <MoreVertical className="h-5 w-5 text-white drop-shadow" />
      </button>
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-sm line-clamp-2 leading-snug">
          {title}
        </h3>
        {(code || description) && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {code && <span className="font-medium mr-1">{code}</span>}
            {description}
          </p>
        )}
        <div className="flex items-center gap-2 pt-1 opacity-70">
          {/* Placeholder action icons */}
          <div className="h-6 w-6 rounded-md bg-muted" />
          <div className="h-6 w-6 rounded-md bg-muted" />
          <div className="h-6 w-6 rounded-md bg-muted" />
        </div>
      </div>
    </div>
  );
};
