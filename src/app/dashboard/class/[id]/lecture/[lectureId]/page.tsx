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
import { API_ENDPOINTS } from "@/app/lib/config";
import { getAccessToken, handleAuthError } from "@/app/lib/auth";
import { toast } from "sonner";

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
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  useEffect(() => {
    fetchLecture();
  }, [classId, lectureId]);

  const fetchLecture = async () => {
    if (!lectureId) return;
    
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.getLecture(lectureId), {
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError(401);
          return;
        }
        throw new Error('Failed to fetch lecture');
      }

      const lecture = await response.json();
      
      setLectureTitle(lecture.title);
      
      // Set transcript
      if (lecture.transcript?.trim()) {
        setTranscriptDraft(lecture.transcript);
      }
      
      // Set summary if available
      if (lecture.summary) {
        setData(prev => ({
          ...prev,
          summary: lecture.summary
        }));
      }
      
      // Fetch associated action items
      await fetchActionItems();
      
    } catch (error) {
      console.error('Error fetching lecture:', error);
      toast.error('Failed to load lecture details');
    } finally {
      setLoading(false);
    }
  };

  const fetchActionItems = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.actionItems}?lecture_id=${lectureId}`, {
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`
        }
      });

      if (response.ok) {
        const items = await response.json();
        const actionItems: ActionItem[] = items.map((item: any) => ({
          id: item.id,
          text: item.content,
          done: item.completed || false
        }));
        setData(prev => ({
          ...prev,
          actions: actionItems
        }));
      }
    } catch (error) {
      console.error('Error fetching action items:', error);
    }
  };

  // Actions
  const regenerateSummary = async () => {
    if (!lectureId) return;
    
    try {
      setIsGenerating(true);
      const response = await fetch(API_ENDPOINTS.analyzeLecture(lectureId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError(401);
          return;
        }
        if (response.status === 400) {
          toast.error('Transcript not ready or empty');
          return;
        }
        throw new Error('Failed to generate summary');
      }

      const result = await response.json();
      
      // Update summary
      if (result.lecture?.summary) {
        setData(prev => ({
          ...prev,
          summary: result.lecture.summary
        }));
      }
      
      // Update action items
      if (result.action_items) {
        const actionItems: ActionItem[] = result.action_items.map((item: any) => ({
          id: item.id,
          text: item.content,
          done: item.completed || false
        }));
        setData(prev => ({
          ...prev,
          actions: actionItems
        }));
      }
      
      toast.success('Summary and action items generated successfully');
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Failed to generate summary');
    } finally {
      setIsGenerating(false);
    }
  };

  const extractActions = async () => {
    if (!lectureId) return;
    
    try {
      setIsExtracting(true);
      const response = await fetch(API_ENDPOINTS.analyzeLecture(lectureId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError(401);
          return;
        }
        if (response.status === 400) {
          toast.error('Transcript not ready or empty');
          return;
        }
        throw new Error('Failed to extract action items');
      }

      const result = await response.json();
      
      // Update summary
      if (result.lecture?.summary) {
        setData(prev => ({
          ...prev,
          summary: result.lecture.summary
        }));
      }
      
      // Update action items
      if (result.action_items) {
        const actionItems: ActionItem[] = result.action_items.map((item: any) => ({
          id: item.id,
          text: item.content,
          done: item.completed || false
        }));
        setData(prev => ({
          ...prev,
          actions: actionItems
        }));
      }
      
      toast.success('Action items extracted successfully');
    } catch (error) {
      console.error('Error extracting action items:', error);
      toast.error('Failed to extract action items');
    } finally {
      setIsExtracting(false);
    }
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

  const completedCount = useMemo(
    () => data.actions.filter((a) => a.done).length,
    [data.actions]
  );

  return (
    <div className="relative min-h-screen bg-background dark:bg-background">
      <div className="backdrop-blur-md bg-card/70 dark:bg-card/70 border-b border-border dark:border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="space-y-2 flex-1">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1">
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
                <span className="text-slate-700 dark:text-slate-200">
                  Lecture
                </span>
              </div>
              <div className="flex items-center gap-5 flex-wrap">
                <div className="relative py-1">
                  <div className="pointer-events-none absolute -inset-x-8 -inset-y-4 -z-10 rounded-full bg-violet-400/10 blur-3xl" />
                  <h1 className="text-3xl font-bold tracking-tight leading-tight relative text-slate-800 dark:text-slate-100">
                    {lectureTitle || "Lecture"}
                  </h1>
                </div>
                <ProgressRing percent={progressPct} label={`${progressPct}%`} />
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                onClick={resetAll}
                className="border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700 transition-transform hover:scale-[1.03]"
              >
                Reset
              </Button>
              <Button
                onClick={rerunAll}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-sm transition-transform hover:scale-[1.04]"
              >
                Re-run
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-6 space-y-8">
        {/* Main grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left column (span 8) */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Summary */}
            <Card className="p-6 space-y-4 bg-violet-50/30 dark:bg-violet-950/30 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-violet-200/60 dark:border-violet-800/60 border-l-4 border-violet-400 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span aria-hidden className="text-lg">
                    📝
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                    Summary
                  </h3>
                </div>
                <Button
                  size="sm"
                  onClick={regenerateSummary}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-sm hover:brightness-110 hover:shadow transition"
                >
                  {isGenerating ? 'Generating...' : 'Generate'}
                </Button>
              </div>
              <p className="text-sm text-foreground dark:text-white leading-relaxed break-words">
                {data.summary}
              </p>
            </Card>

            {/* Action Items */}
            <Card className="p-6 space-y-4 bg-blue-50/30 dark:bg-blue-950/30 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-blue-200/60 dark:border-blue-800/60 border-l-4 border-blue-400 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span aria-hidden className="text-lg">
                    ✅
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                    Action Items
                  </h3>
                </div>
                <Button
                  size="sm"
                  onClick={extractActions}
                  disabled={isExtracting}
                  className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-sm hover:brightness-110 hover:shadow transition"
                >
                  {isExtracting ? 'Extracting...' : 'Extract'}
                </Button>
              </div>
              {/* Statistics */}
              <div
                className="text-xs text-slate-600 dark:text-slate-300 flex justify-between items-center px-1 mb-2"
                aria-live="polite"
              >
                <span>
                  Total: {data.actions.length} item
                  {data.actions.length !== 1 && "s"}
                </span>
                <span>
                  Completed: {completedCount}/{data.actions.length || 0}
                </span>
              </div>
              {/* Scrollable Action Items List */}
              <ScrollArea className="h-64 max-h-96 overflow-y-auto pr-2">
                <div className="space-y-2">
                  {data.actions.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-start justify-between gap-3 text-sm group rounded-lg px-3 py-2 hover:bg-slate-100/60 dark:hover:bg-slate-700/50 transition-all duration-200"
                    >
                      <label className="flex items-start gap-3 flex-1">
                        <Checkbox
                          checked={!!a.done}
                          onCheckedChange={(v) => toggleAction(a.id, !!v)}
                          className="mt-0.5 h-5 w-5 border-2 border-gray-400 dark:border-slate-500 data-[state=checked]:bg-violet-500 data-[state=checked]:border-violet-600 data-[state=checked]:text-white transition-colors duration-200 focus:ring-2 focus:ring-violet-300 focus:ring-offset-1"
                        />
                        {editingId === a.id ? (
                          <Input
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            autoFocus
                            className="text-sm"
                          />
                        ) : (
                          <span
                            className={`leading-relaxed break-words ${
                              a.done
                                ? "line-through text-slate-600 dark:text-slate-400"
                                : ""
                            }`}
                          >
                            {a.text}
                          </span>
                        )}
                      </label>
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
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
              </ScrollArea>
              <div className="flex gap-2 pt-1">
                <Input
                  placeholder="Add action..."
                  value={newActionText}
                  onChange={(e) => setNewActionText(e.target.value)}
                  className="text-sm"
                />
                <Button onClick={addAction}>Add</Button>
              </div>
            </Card>

            {/* Socratic Chat */}
            <Card className="p-6 space-y-4 bg-emerald-50/30 dark:bg-emerald-950/30 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-emerald-200/60 dark:border-emerald-800/60 border-l-4 border-emerald-400 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span aria-hidden className="text-lg">
                    💬
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                    Socratic Chat
                  </h3>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Start an interactive, guided conversation based on this lecture.
              </p>
              <div className="flex items-center gap-3 pt-1 flex-wrap">
                <Button onClick={startSocraticChat}>Start Chat</Button>
                <Button
                  variant="outline"
                  onClick={copySocraticLink}
                  className="text-sm"
                >
                  Copy Link
                </Button>
              </div>
            </Card>
          </div>

          {/* Right column (span 4) */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Audio Player Card */}
            <Card className="p-6 space-y-4 bg-amber-50/30 dark:bg-amber-950/30 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-amber-200/60 dark:border-amber-800/60 border-l-4 border-amber-400 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span aria-hidden className="text-lg">
                    🎧
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                    Audio Player
                  </h3>
                </div>
              </div>
              <AudioPlayer transcript={transcriptDraft} />
            </Card>

            {/* Transcript */}
            <Card className="p-6 space-y-4 bg-background/30 dark:bg-background/30 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.05)] border-l-4 border-muted hover:shadow-md transition-all duration-200 min-h-[548px] md:min-h-[648px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span aria-hidden className="text-lg">
                    📰
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                    Transcript
                  </h3>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Expand
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Full Transcript</DialogTitle>
                    </DialogHeader>
                    <Textarea
                      autoFocus
                      className="min-h-[40vh] max-h-[80vh] overflow-y-auto resize-y bg-muted/30"
                      value={transcriptDraft}
                      onChange={(e) => setTranscriptDraft(e.target.value)}
                    />
                    <div className="text-[11px] text-muted-foreground mt-1">
                      {transcriptDraft.length} chars
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <Textarea
                className="h-72 max-h-[420px] overflow-y-auto resize-y bg-background/50 dark:bg-card/40 border border-border rounded-md px-3 py-2 scrollbar-thin"
                value={transcriptDraft}
                onChange={(e) => setTranscriptDraft(e.target.value)}
              />
              <div className="text-[11px] text-muted-foreground -mt-1">
                {transcriptDraft.length} chars
              </div>
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
        <Card className="p-6 space-y-4 bg-rose-50/30 dark:bg-rose-950/30 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-rose-200/60 dark:border-rose-800/60 border-l-4 border-rose-400 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span aria-hidden className="text-lg">
                📓
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Lecture Notes
              </h3>
            </div>
            <Badge variant="secondary" className="hidden sm:inline">
              Draft
            </Badge>
          </div>
          <PersonalNotes />
        </Card>
      </div>
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

function PersonalNotes() {
  const [notes, setNotes] = useState("");
  const [links, setLinks] = useState<
    { id: string; url: string; title: string; source: string }[]
  >([]);
  const [isOpen, setIsOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock backend for link metadata
  async function mockFetchMetadata(url: string): Promise<{
    title: string;
    source: string;
  }> {
    // simulate network delay
    await new Promise((r) => setTimeout(r, 1500));
    const lower = url.toLowerCase();
    if (lower.includes("notion.so")) {
      return { title: "My Notion Study Notes", source: "Notion" };
    }
    if (lower.includes("docs.google.com")) {
      return { title: "Project Requirements Doc", source: "Google Docs" };
    }
    return { title: "External Resource", source: "Website" };
  }

  const onAddResource = async () => {
    setError(null);
    const url = inputUrl.trim();
    if (!url) {
      setError("Please paste a URL");
      return;
    }
    try {
      setLoading(true);
      const meta = await mockFetchMetadata(url);
      setLinks((prev) => [
        ...prev,
        { id: `${Date.now()}`, url, title: meta.title, source: meta.source },
      ]);
      setInputUrl("");
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const removeLink = (id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  const iconForSource = (source: string) => {
    if (source === "Notion") return "🅝"; // placeholder
    if (source === "Google Docs") return "📄";
    return "🔗";
  };

  return (
    <div className="space-y-3">
      {/* Link cards */}
      {links.length > 0 && (
        <div className="space-y-2">
          {links.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between border rounded-md px-3 py-2 bg-background"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg" aria-hidden>
                  {iconForSource(l.source)}
                </span>
                <div className="min-w-0">
                  <div className="font-medium truncate">{l.title}</div>
                  <a
                    className="text-xs text-muted-foreground truncate block hover:underline"
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {l.url}
                  </a>
                </div>
                <span className="text-[10px] text-muted-foreground border rounded px-1 py-0.5 ml-2 whitespace-nowrap">
                  {l.source}
                </span>
              </div>
              <button
                aria-label="Remove resource"
                onClick={() => removeLink(l.id)}
                className="text-xs text-muted-foreground hover:text-foreground px-2"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Write your personal notes or markdown here..."
        className="min-h-[220px]"
      />

      {/* Footer toolbar */}
      <div className="flex justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setIsOpen(true)}
          >
            <span className="mr-2" aria-hidden>
              🖇️
            </span>
            Add Resource
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setNotes("")}>
            Clear
          </Button>
          <Button size="sm" disabled>
            Save (placeholder)
          </Button>
        </div>
      </div>

      {/* Modal for URL input */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Paste Link URL</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="https://..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              autoFocus
            />
            {error && (
              <p className="text-xs text-red-500" role="alert">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={onAddResource} disabled={loading}>
                {loading ? "Adding..." : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
