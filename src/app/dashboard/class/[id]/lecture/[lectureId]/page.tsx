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

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">
            <Link href="/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <span className="mx-1">/</span>
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
            <span className="mx-1">/</span>
            <span className="text-foreground">Lecture</span>
          </div>
          <h1 className="text-2xl font-semibold">
            {lectureTitle || "Lecture"}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetAll}>
            Reset
          </Button>
          <Button onClick={rerunAll}>Re-run</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Summary (wide) + Action Items under it */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Summary</h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={regenerateSummary}
                  className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-sm hover:brightness-110 hover:shadow transition"
                >
                  Generate
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {data.summary}
            </p>
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Action Items</h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={extractActions}
                  className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-sm hover:brightness-110 hover:shadow transition"
                >
                  Extract
                </Button>
              </div>
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
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Socratic Chat</h3>
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

        {/* Right: Transcript editor (narrow) */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Transcript</h2>
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
            className="min-h-[240px]"
            value={transcriptDraft}
            onChange={(e) => setTranscriptDraft(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setTranscriptDraft("")}>
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
  );
}
