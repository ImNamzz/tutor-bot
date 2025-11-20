"use client";
import { useEffect, useState } from "react";
import Topbar from "@/app/components/Topbar";
import { FloatingScratchpad } from "@/app/components/socratic/FloatingScratchpad";
import { SessionOverview } from "@/app/components/socratic/simple/SessionOverview";
import { LearningDashboard } from "@/app/components/socratic/simple/LearningDashboard";
import {
  SocraticChat,
  type ChatMessage,
} from "@/app/components/socratic/simple/SocraticChat";

export default function TutorPage() {
  // Must-have state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [confidence, setConfidence] = useState(0.7);
  const [sessionProgress, setSessionProgress] = useState({
    currentQuestion: 1,
    totalQuestions: 12,
  });
  const [scratchpad, setScratchpad] = useState("");

  // Seed with first AI question
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          type: "ai",
          content:
            "What evidence suggests ubiquitin targets specific proteins?",
          questionType: "evidence",
        },
      ]);
    }
  }, [messages.length]);

  const submitAnswer = () => {
    if (!input.trim()) return;
    const text = input.trim();
    setMessages((m) => [...m, { type: "user", content: text, confidence }]);
    setInput("");
    setSessionProgress((p) => ({
      ...p,
      currentQuestion: Math.min(p.currentQuestion + 1, p.totalQuestions),
    }));
    // Simulate next AI prompt
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          type: "ai",
          content:
            "How might an alternative mechanism explain the observations?",
          questionType: "perspective",
        },
      ]);
    }, 500);
  };

  const requestHint = () =>
    setMessages((m) => [
      ...m,
      {
        type: "ai",
        content: "Think about enzymatic specificity and binding domains.",
        questionType: "clarification",
      },
    ]);

  const addNote = () =>
    setScratchpad(
      (s) => s + (s ? "\n" : "") + `Note ${new Date().toLocaleTimeString()}: `
    );

  return (
    <div className="min-h-screen bg-background">
      <Topbar />
      <div className="flex h-[calc(100vh-4rem)] bg-background">
        {/* Left: Session Overview (25%) */}
        <div className="w-1/4 border-r border-border overflow-auto">
          <SessionOverview />
        </div>
        {/* Center: Learning Dashboard (35%) */}
        <div className="w-2/5 border-r border-border overflow-auto">
          <LearningDashboard />
        </div>
        {/* Right: Socratic Dialogue (40%) */}
        <div className="w-2/5 overflow-hidden">
          <SocraticChat
            messages={messages}
            confidence={confidence}
            onConfidence={setConfidence}
            input={input}
            onInput={setInput}
            onSubmit={submitAnswer}
            onHint={requestHint}
            onNote={addNote}
          />
        </div>
      </div>
      <FloatingScratchpad notes={scratchpad} onChange={setScratchpad} />
    </div>
  );
}
