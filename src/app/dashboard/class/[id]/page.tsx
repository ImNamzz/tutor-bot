"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Topbar from "@/app/components/Topbar";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import {
  CLASS_COLORS,
  ClassItem,
  Lecture,
  generateId,
} from "@/app/lib/types/class";
import { Upload, MoreVertical } from "lucide-react";

const STORAGE_KEY = "eduassist_classes";

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params?.id as string;
  const [cls, setCls] = useState<ClassItem | null>(null);
  const [allClasses, setAllClasses] = useState<ClassItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Lecture modal state
  const [openLectureModal, setOpenLectureModal] = useState(false);
  const [lectureTitle, setLectureTitle] = useState("");
  const [lectureType, setLectureType] = useState<"text" | "audio">("text");
  const [lectureContentText, setLectureContentText] = useState("");
  const [fileError, setFileError] = useState("");

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: ClassItem[] = JSON.parse(raw);
        setAllClasses(parsed);
        const found = parsed.find((c) => c.id === classId);
        setCls(found || null);
      }
    } catch (e) {
      console.error("Failed to load class", e);
    }
  }, [classId]);

  const persist = (next: ClassItem[]) => {
    setAllClasses(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const handleAddLecture = () => {
    if (!cls) return;
    if (!lectureTitle.trim()) return;

    let content = lectureContentText.trim();
    // For audio type currently placeholder; future: process audio file
    const newLecture: Lecture = {
      id: generateId(),
      title: lectureTitle.trim(),
      type: lectureType,
      content,
      createdAt: new Date().toISOString(),
    };
    const updated = allClasses.map((c) =>
      c.id === cls.id ? { ...c, lectures: [newLecture, ...c.lectures] } : c
    );
    persist(updated);
    setCls(updated.find((c) => c.id === cls.id) || null);
    setLectureTitle("");
    setLectureContentText("");
    setLectureType("text");
    setOpenLectureModal(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError("");
    if (lectureType === "audio") {
      // Placeholder: just store filename
      setLectureContentText(`Audio file: ${file.name}`);
    } else {
      if (!file.name.toLowerCase().endsWith(".txt")) {
        setFileError("Please upload a .txt file for text lectures");
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setLectureContentText(String(ev.target?.result || ""));
      };
      reader.readAsText(file);
    }
  };

  const handleRenameLecture = (lectureId: string, newTitle: string) => {
    if (!cls) return;
    const title = newTitle.trim();
    if (!title) return;
    const updated = allClasses.map((c) =>
      c.id === cls.id
        ? {
            ...c,
            lectures: c.lectures.map((l) =>
              l.id === lectureId ? { ...l, title } : l
            ),
          }
        : c
    );
    persist(updated);
    setCls(updated.find((c) => c.id === cls.id) || null);
  };

  const handleDeleteLecture = (lectureId: string) => {
    if (!cls) return;
    if (!window.confirm("Delete this lecture? This cannot be undone.")) return;
    const updated = allClasses.map((c) =>
      c.id === cls.id
        ? {
            ...c,
            lectures: c.lectures.filter((l) => l.id !== lectureId),
          }
        : c
    );
    persist(updated);
    setCls(updated.find((c) => c.id === cls.id) || null);
  };

  if (mounted && !cls) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        \n{" "}
        <div className="text-center space-y-4">
          \n <p className="text-sm text-muted-foreground">Class not found.</p>\n{" "}
          <Button onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
          \n{" "}
        </div>
        \n{" "}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Topbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {cls && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                {cls.color.startsWith("#") ? (
                  <span
                    className="inline-block h-6 w-6 rounded-md"
                    style={{ backgroundColor: cls.color }}
                  />
                ) : (
                  <span
                    className={`inline-block h-6 w-6 rounded-md ${cls.color}`}
                  />
                )}
                {cls.name}
              </h1>
              {cls.code && (
                <p className="text-xs text-muted-foreground">{cls.code}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {cls.lectures.length} lecture(s)
              </p>
              <p className="text-[10px] text-muted-foreground">
                Created {new Date(cls.createdAt).toLocaleString()}
              </p>
            </div>
            <Dialog open={openLectureModal} onOpenChange={setOpenLectureModal}>
              <DialogTrigger asChild>
                <Button variant="default" className="gap-2">
                  <Upload className="h-4 w-4" /> Upload Lecture
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Lecture</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Lecture Title</label>
                    <Input
                      value={lectureTitle}
                      onChange={(e) => setLectureTitle(e.target.value)}
                      placeholder="e.g. Week 1 Overview"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={lectureType === "text" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setLectureType("text")}
                      >
                        Text
                      </Button>
                      <Button
                        type="button"
                        variant={
                          lectureType === "audio" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setLectureType("audio")}
                      >
                        Audio
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {lectureType === "audio"
                        ? "Audio File"
                        : "Paste Text or Upload .txt"}
                    </label>
                    {lectureType === "text" && (
                      <Textarea
                        rows={6}
                        value={lectureContentText}
                        onChange={(e) => setLectureContentText(e.target.value)}
                        placeholder="Paste transcript here..."
                      />
                    )}
                    <Input
                      type="file"
                      accept={lectureType === "audio" ? "audio/*" : ".txt"}
                      onChange={handleFileUpload}
                    />
                    {fileError && (
                      <p className="text-xs text-red-600">{fileError}</p>
                    )}
                  </div>
                  <Button
                    disabled={
                      !lectureTitle.trim() ||
                      (!lectureContentText.trim() && lectureType === "text")
                    }
                    className="w-full"
                    onClick={handleAddLecture}
                  >
                    Save Lecture
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Lectures</h2>
          {cls && cls.lectures.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No lectures yet. Use "Upload Lecture" to add one.
            </p>
          )}
          {cls && cls.lectures.length > 0 && (
            <ScrollArea className="h-[400px] pr-2">
              <ul className="space-y-3">
                {cls.lectures.map((lec) => (
                  <li key={lec.id}>
                    <Link
                      href={`/dashboard/class/${cls.id}/lecture/${lec.id}`}
                      className="group block w-full"
                    >
                      <div className="w-full rounded-xl border border-gray-200 bg-white p-4 transition-all duration-200 ease-in-out hover:border-purple-400 hover:bg-gray-50 hover:shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-foreground group-hover:underline underline-offset-2 truncate">
                              {lec.title}
                            </div>
                            {lec.type === "text" ? (
                              <p className="mt-1 text-xs line-clamp-2 whitespace-pre-wrap text-muted-foreground">
                                {lec.content}
                              </p>
                            ) : (
                              <p className="mt-1 text-xs italic text-muted-foreground truncate">
                                {lec.content}
                              </p>
                            )}
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              Added {new Date(lec.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground uppercase">
                              {lec.type}
                            </span>
                            <LectureActions
                              onRename={(newTitle: string) =>
                                handleRenameLecture(lec.id, newTitle)
                              }
                              onDelete={() => handleDeleteLecture(lec.id)}
                            />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </Card>
      </main>
    </div>
  );
}

type LectureActionsProps = {
  onRename: (newTitle: string) => void;
  onDelete: () => void;
};

function LectureActions({ onRename, onDelete }: LectureActionsProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        className="p-1 rounded-md hover:bg-muted"
        aria-label="Lecture actions"
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div
          className="absolute right-0 z-10 mt-2 w-32 rounded-md border bg-card shadow-md"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
            onClick={() => {
              const name = window.prompt("Rename lecture", "");
              if (name !== null) onRename(name);
              setOpen(false);
            }}
          >
            Rename
          </button>
          <button
            className="w-full text-left px-3 py-2 text-sm hover:bg-muted text-red-600"
            onClick={() => {
              onDelete();
              setOpen(false);
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
