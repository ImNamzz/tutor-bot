"use client";
import React from "react";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { ConfidenceSlider } from "./ConfidenceSlider";

export type ChatMessage =
  | { type: "ai"; content: string; questionType?: string }
  | { type: "user"; content: string; confidence?: number };

interface Props {
  messages: ChatMessage[];
  confidence: number;
  onConfidence: (v: number) => void;
  input: string;
  onInput: (v: string) => void;
  onSubmit: () => void;
  onHint: () => void;
  onNote: () => void;
}

export const SocraticChat: React.FC<Props> = ({
  messages,
  confidence,
  onConfidence,
  input,
  onInput,
  onSubmit,
  onHint,
  onNote,
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`text-sm ${
              m.type === "ai"
                ? "text-blue-800 dark:text-blue-200"
                : "text-green-800 dark:text-green-200"
            }`}
          >
            <div
              className={`inline-block max-w-[90%] px-3 py-2 rounded-md border ${
                m.type === "ai"
                  ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800"
                  : "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800"
              }`}
            >
              {m.content}
              {m.type === "ai" && m.questionType && (
                <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {m.questionType}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t p-4 space-y-3">
        <ConfidenceSlider value={confidence} onChange={onConfidence} />
        <Textarea
          placeholder="Share your thinking process..."
          value={input}
          onChange={(e) => onInput(e.target.value)}
        />
        <div className="flex gap-2">
          <Button onClick={onSubmit}>Submit Answer</Button>
          <Button variant="outline" onClick={onHint}>
            💡 Get Hint
          </Button>
          <Button variant="outline" onClick={onNote}>
            📝 Add Note
          </Button>
        </div>
      </div>
    </div>
  );
};
