"use client";
import React from "react";
import { Button } from "@/app/components/ui/button";

export const ResponseScaffoldingTools: React.FC<{
  options: { value: string; label: string; icon: string }[];
  onSelect: (v: string) => void;
  templates: string[];
  onTemplate: (t: string) => void;
}> = ({ options, onSelect, templates, onTemplate }) => {
  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        {options.map((o) => (
          <Button
            key={o.value}
            variant="outline"
            size="sm"
            onClick={() => onSelect(o.value)}
          >
            <span className="mr-1">{o.icon}</span>
            {o.label}
          </Button>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap">
        {templates.map((t) => (
          <Button
            key={t}
            variant="secondary"
            size="sm"
            onClick={() => onTemplate(t)}
            className="text-[11px]"
          >
            {t}
          </Button>
        ))}
      </div>
    </div>
  );
};
