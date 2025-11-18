"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  DUMMY_LECTURE_DERIVATIVES,
  LectureDerivatives,
  ActionItem,
} from "@/app/lib/types/class";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { Input } from "@/app/components/ui/input";

type StoredClass = {
  id: string;
  name: string;
  code?: string;
  color: string;
  lectures: {
    id: string;
    title: string;
    type: "text" | "audio";
    content: string;
    createdAt: string;
  }[];
  createdAt: string;
};

export default function LectureDetailPage() {
  const params = useParams<{ id: string; lectureId: string }>();
  const router = useRouter();
  const classId = params?.id;
  const lectureId = params?.lectureId;

  const [cls, setCls] = useState<StoredClass | null>(null);
  const [lectureTitle, setLectureTitle] = useState<string>("");
  const [data, setData] = useState<LectureDerivatives>(
    DUMMY_LECTURE_DERIVATIVES
  );
  const [transcriptDraft, setTranscriptDraft] = useState<string>(
    DUMMY_LECTURE_DERIVATIVES.transcript
  );
  const [newActionText, setNewActionText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("eduassist_classes");
    if (!raw) return;
    try {
      const arr: StoredClass[] = JSON.parse(raw);
      const found = arr.find((c) => c.id === classId);
      if (!found) return;
      setCls(found);
      const lec = found.lectures.find((l) => l.id === lectureId);
      if (lec) {
        setLectureTitle(lec.title);
        // Initialize transcript from lecture content when present
        if (lec.content?.trim()) {
          setTranscriptDraft(lec.content);
        }
      }
    } catch {}
  }, [classId, lectureId]);

  // Actions
  const regenerateSummary = () => {
    // Dummy: make a small variation to show change
    setData((prev) => ({
      ...prev,
      summary: prev.summary.endsWith(".")
        ? prev.summary + " Emphasis on intuition."
        : prev.summary + ". Emphasis on intuition.",
    }));
  };

  const extractActions = () => {
    // Dummy: add an action derived from transcript length
    const extra: ActionItem = {
      id: `${Date.now()}`,
      text: `Skim transcript (${transcriptDraft.length} chars) for key terms`,
      done: false,
    };
    setData((prev) => ({ ...prev, actions: [...prev.actions, extra] }));
  };

  const resetAll = () => {
    setData(DUMMY_LECTURE_DERIVATIVES);
    setTranscriptDraft(DUMMY_LECTURE_DERIVATIVES.transcript);
  };

  const rerunAll = () => {
    // Dummy: shuffle action completion
    setData((prev) => ({
      ...prev,
      actions: prev.actions.map((a, i) => ({
        ...a,
        done: i % 2 === 0 ? !a.done : a.done,
      })),
    }));
  };

  const toggleAction = (id: string, checked: boolean) => {
    setData((prev) => ({
      ...prev,
      actions: prev.actions.map((a) =>
        a.id === id ? { ...a, done: checked } : a
      ),
    }));
  };

  const addAction = () => {
    const text = newActionText.trim();
    if (!text) return;
    setData((prev) => ({
      ...prev,
      actions: [...prev.actions, { id: `${Date.now()}`, text, done: false }],
    }));
    setNewActionText("");
  };

  const beginEditAction = (id: string, text: string) => {
    setEditingId(id);
    setEditingText(text);
  };

  const cancelEditAction = () => {
    setEditingId(null);
    setEditingText("");
  };

  const saveEditAction = () => {
    if (!editingId) return;
    const text = editingText.trim();
    if (!text) return;
    setData((prev) => ({
      ...prev,
      actions: prev.actions.map((a) =>
        a.id === editingId ? { ...a, text } : a
      ),
    }));
    setEditingId(null);
    setEditingText("");
  };

  const deleteAction = (id: string) => {
    setData((prev) => ({
      ...prev,
      actions: prev.actions.filter((a) => a.id !== id),
    }));
  };

  const startSocraticChat = () => {
    // Navigate to the Tutor page with lecture context (non-breaking if ignored)
    router.push(`/tutor?classId=${classId}&lectureId=${lectureId}`);
  };

  const copySocraticLink = async () => {
    try {
      const link = `${window.location.origin}/tutor?classId=${classId}&lectureId=${lectureId}`;
      await navigator.clipboard.writeText(link);
    } catch (e) {
      // no-op
    }
  };

  if (!classId || !lectureId) return null;

  // --- Derived progress (placeholder): percent actions done ---
  const progressPct = useMemo(() => {
    if (!data.actions.length) return 0;
    const done = data.actions.filter((a) => a.done).length;
    return Math.round((done / data.actions.length) * 100);
  }, [data.actions]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div className="space-y-2 flex-1">
          <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-1">
            <Link href="/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <span>/</span>
            {cls ? (
              <Link
                href={`/dashboard/class/${cls.id}`}
                className="hover:underline"
              >
                {cls.name}
              </Link>
            ) : (
              <span>Class</span>
            )}
            <span>/</span>
            <span className="text-foreground">Lecture</span>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold tracking-tight">
              {lectureTitle || "Lecture"}
            </h1>
            {/* Progress Ring */}
            <ProgressRing percent={progressPct} label={`${progressPct}%`} />
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" onClick={resetAll}>
            Reset
          </Button>
          <Button onClick={rerunAll}>Re-run</Button>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left column (span 8) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Summary */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-lg">Summary</h3>
              <Button
                size="sm"
                onClick={regenerateSummary}
                className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-sm hover:brightness-110 hover:shadow transition"
              >
                Generate
              </Button>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {data.summary}
            </p>
          </Card>

          {/* Concept Map */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-lg">Concept Map</h3>
            </div>
            <ConceptMap
              keywords={[
                "Perceptron",
                "MLP",
                "Activation",
                "Backprop",
                "Regularization",
              ]}
            />
          </Card>

          {/* Action Items */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-lg">Action Items</h3>
              <Button
                size="sm"
                onClick={extractActions}
                className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-sm hover:brightness-110 hover:shadow transition"
              >
                Extract
              </Button>
            </div>
            <div className="space-y-2">
              {data.actions.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start justify-between gap-3 text-sm"
                >
                  <label className="flex items-start gap-3 flex-1">
                    <Checkbox
                      checked={!!a.done}
                      onCheckedChange={(v) => toggleAction(a.id, !!v)}
                      className="mt-0.5"
                    />
                    {editingId === a.id ? (
                      <Input
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <span
                        className={
                          a.done ? "line-through text-muted-foreground" : ""
                        }
                      >
                        {a.text}
                      </span>
                    )}
                  </label>
                  <div className="flex items-center gap-1">
                    {editingId === a.id ? (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={saveEditAction}
                          aria-label="Save"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={cancelEditAction}
                          aria-label="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => beginEditAction(a.id, a.text)}
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteAction(a.id)}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Input
                placeholder="Add action..."
                value={newActionText}
                onChange={(e) => setNewActionText(e.target.value)}
              />
              <Button onClick={addAction}>Add</Button>
            </div>
          </Card>

          {/* Socratic Chat */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-lg">Socratic Chat</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Start an interactive, guided conversation based on this lecture.
            </p>
            <div className="flex items-center gap-4 pt-1">
              <Button onClick={startSocraticChat}>Start Socratic Chat</Button>
              <button
                type="button"
                onClick={copySocraticLink}
                className="text-sm text-primary underline underline-offset-2"
              >
                Copy link
              </button>
            </div>
          </Card>
        </div>

        {/* Right column (span 4) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Audio Player Card */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-lg">Audio Player</h3>
            </div>
            <AudioPlayer transcript={transcriptDraft} />
          </Card>

          {/* Transcript */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-lg">Transcript</h3>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Expand
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Full Transcript</DialogTitle>
                  </DialogHeader>
                  <Textarea
                    autoFocus
                    className="min-h-[60vh]"
                    value={transcriptDraft}
                    onChange={(e) => setTranscriptDraft(e.target.value)}
                  />
                </DialogContent>
              </Dialog>
            </div>
            <Textarea
              className="min-h-[260px]"
              value={transcriptDraft}
              onChange={(e) => setTranscriptDraft(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setTranscriptDraft("")}
              >
                Clear
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setTranscriptDraft(DUMMY_LECTURE_DERIVATIVES.transcript)
                }
              >
                Restore Sample
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Personal Notes full-width */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-lg">Lecture Notes</h3>
          <Badge variant="secondary" className="hidden sm:inline">
            Draft
          </Badge>
        </div>
        <PersonalNotes />
      </Card>
    </div>
  );
}

// --- Placeholder Components ---
function ProgressRing({ percent, label }: { percent: number; label?: string }) {
  const clamped = Math.min(100, Math.max(0, percent));
  const radius = 22;
  const stroke = 4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  return (
    <div className="relative h-12 w-12">
      <svg className="h-12 w-12 rotate-[-90deg]" viewBox="0 0 52 52">
        <circle
          cx="26"
          cy="26"
          r={radius}
          strokeWidth={stroke}
          className="stroke-muted fill-none"
        />
        <circle
          cx="26"
          cy="26"
          r={radius}
          strokeWidth={stroke}
          className="stroke-violet-500 fill-none transition-all duration-300"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-medium">
        {label}
      </div>
    </div>
  );
}

function AudioPlayer({ transcript }: { transcript: string }) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          onClick={() => setPlaying((p) => !p)}
          className="px-4"
        >
          {playing ? "Pause" : "Play"}
        </Button>
        <select
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="text-xs rounded-md border bg-background px-2 py-1"
        >
          <option value={1}>1x</option>
          <option value={1.25}>1.25x</option>
          <option value={1.5}>1.5x</option>
          <option value={2}>2x</option>
        </select>
      </div>
      {/* Waveform placeholder */}
      <div className="h-20 w-full flex items-end gap-1">
        {Array.from({ length: 64 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-gradient-to-t from-violet-500/40 to-fuchsia-500/70 rounded-sm"
            style={{
              height: `${(Math.sin(i * 0.35) * 0.5 + 0.5) * 70 + 10}px`,
            }}
          />
        ))}
      </div>
      <div className="text-xs text-muted-foreground">
        Placeholder audio waveform • {Math.min(transcript.length, 120)} chars of
        transcript
      </div>
    </div>
  );
}

function ConceptMap({ keywords }: { keywords: string[] }) {
  // Simple radial layout placeholder
  return (
    <div className="relative w-full min-h-[200px]">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-24 w-24 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-xs font-medium">
          Core
        </div>
      </div>
      {keywords.map((k, i) => {
        const angle = (i / keywords.length) * Math.PI * 2;
        const r = 90;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        return (
          <div
            key={k}
            className="absolute px-2 py-1 rounded-md bg-white shadow-sm text-[11px] border"
            style={{
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {k}
          </div>
        );
      })}
      {/* connecting lines placeholder */}
      <svg
        className="absolute inset-0 w-full h-full"
        stroke="rgba(139,92,246,0.4)"
        fill="none"
      >
        {keywords.map((_, i) => {
          const angle = (i / keywords.length) * Math.PI * 2;
          const r = 90;
          const x = 26 + Math.cos(angle) * (r / 2.2);
          const y = 26 + Math.sin(angle) * (r / 2.2);
          return <circle key={i} cx={x} cy={y} r={2} />;
        })}
      </svg>
    </div>
  );
}

function PersonalNotes() {
  const [notes, setNotes] = useState("");
  return (
    <div className="space-y-3">
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Write your personal notes or markdown here..."
        className="min-h-[220px]"
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => setNotes("")}>
          Clear
        </Button>
        <Button size="sm" disabled>
          Save (placeholder)
        </Button>
      </div>
    </div>
  );
}
