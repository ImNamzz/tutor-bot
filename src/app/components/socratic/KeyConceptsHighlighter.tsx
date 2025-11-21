"use client";
import React from "react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";

interface Concept {
  term: string;
  definition: string;
  mastered: boolean;
}
interface Props {
  concepts: Concept[];
  onToggleMastered?: (term: string) => void;
}

export const KeyConceptsHighlighter: React.FC<Props> = ({
  concepts,
  onToggleMastered,
}) => {
  return (
    <div className="border border-border rounded-lg p-3 bg-card/50 backdrop-blur-sm space-y-3">
      <h3 className="text-sm font-semibold tracking-wide">Key Concepts</h3>
      {concepts.length === 0 && (
        <p className="text-xs text-muted-foreground">No concepts added yet.</p>
      )}
      <ul className="space-y-2">
        {concepts.map((c) => (
          <li key={c.term} className="text-xs flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-purple-600 dark:text-purple-400 flex items-center gap-2">
                {c.term}
                {c.mastered && (
                  <Badge variant="secondary" className="text-[10px]">
                    Mastered
                  </Badge>
                )}
              </span>
              {onToggleMastered && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] px-2 py-0"
                  onClick={() => onToggleMastered(c.term)}
                >
                  {c.mastered ? "Unmark" : "Mark"}
                </Button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {c.definition}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};
