"use client";
import React from "react";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";

interface Props {
  value: string;
  isAnsweringMode: boolean;
  onChange: (v: string) => void;
  onSend: () => void;
  setMode: (answering: boolean) => void;
  disabled?: boolean;
  requestHint: () => void;
  insertMathEquation: () => void;
  openWhiteboard: () => void;
  uploadDiagram: () => void;
  recordAudioResponse: () => void;
}

export const EnhancedChatInput: React.FC<Props> = ({
  value,
  isAnsweringMode,
  onChange,
  onSend,
  setMode,
  disabled,
  requestHint,
  insertMathEquation,
  openWhiteboard,
  uploadDiagram,
  recordAudioResponse,
}) => {
  return (
    <div className="border-t border-border p-4 space-y-3 bg-card/30 backdrop-blur-sm">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMode(true)}
          className={
            isAnsweringMode ? "bg-blue-600 text-white hover:bg-blue-600" : ""
          }
        >
          💬 Answering Mode
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMode(false)}
          className={
            !isAnsweringMode ? "bg-green-600 text-white hover:bg-green-600" : ""
          }
        >
          📝 Reflection Mode
        </Button>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={requestHint}>
          💡 Get Socratic Hint
        </Button>
        <Button variant="outline" size="sm" onClick={insertMathEquation}>
          ∑ Math Equation
        </Button>
        <Button variant="outline" size="sm" onClick={openWhiteboard}>
          🎨 Whiteboard
        </Button>
        <Button variant="outline" size="sm" onClick={uploadDiagram}>
          📊 Upload Diagram
        </Button>
        <Button variant="outline" size="sm" onClick={recordAudioResponse}>
          🎤 Voice Response
        </Button>
      </div>
      <div className="space-y-2">
        <Textarea
          placeholder="Share your thinking process... (Shift+Enter for new line)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[120px] resize-y"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          disabled={disabled}
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={onSend}
            disabled={disabled || !value.trim()}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};
