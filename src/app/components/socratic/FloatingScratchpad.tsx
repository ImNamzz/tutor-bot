"use client";
import React, { useState, useRef } from "react";
import { Textarea } from "@/app/components/ui/textarea";
import { Button } from "@/app/components/ui/button";
import { Move, X } from "lucide-react";

interface Props {
  notes: string;
  onChange: (v: string) => void;
}

export const FloatingScratchpad: React.FC<Props> = ({ notes, onChange }) => {
  const [open, setOpen] = useState(true);
  const [pos, setPos] = useState({ x: 40, y: 120 });
  const dragRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };
  const onMouseMove = (e: MouseEvent) => {
    if (!dragging.current) return;
    setPos({
      x: e.clientX - offset.current.x,
      y: e.clientY - offset.current.y,
    });
  };
  const onMouseUp = () => {
    dragging.current = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 px-3 py-2 rounded-md bg-purple-600 text-white text-xs shadow-lg"
      >
        Open Scratchpad
      </button>
    );

  return (
    <div
      ref={dragRef}
      style={{ left: pos.x, top: pos.y }}
      className="fixed z-50 w-72 rounded-lg border border-border bg-card/80 backdrop-blur-md shadow-xl"
    >
      <div
        onMouseDown={onMouseDown}
        className="cursor-move flex items-center justify-between px-3 py-2 border-b border-border text-xs bg-card/60 rounded-t-lg"
      >
        <span className="flex items-center gap-1">
          <Move className="h-3.5 w-3.5" /> Scratchpad
        </span>
        <button
          onClick={() => setOpen(false)}
          className="p-1 rounded hover:bg-muted"
          aria-label="Close scratchpad"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="p-3 space-y-2">
        <Textarea
          value={notes}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Free-form thoughts..."
          className="min-h-[140px] text-xs"
        />
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigator.clipboard.writeText(notes)}
            disabled={!notes.trim()}
          >
            Copy
          </Button>
          <Button
            size="sm"
            onClick={() => {
              const blob = new Blob([notes], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `scratchpad-${Date.now()}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            disabled={!notes.trim()}
          >
            Export
          </Button>
        </div>
      </div>
    </div>
  );
};
