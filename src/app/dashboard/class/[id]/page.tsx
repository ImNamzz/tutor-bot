"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Topbar from "@/app/components/Topbar";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { API_ENDPOINTS } from "@/app/lib/config";
import { getAccessToken, handleAuthError } from "@/app/lib/auth";
import { toast } from "sonner";
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
import {
  Upload,
  MoreVertical,
  FileText,
  Headphones,
  Sparkles,
  CheckCircle,
  Star,
  X,
} from "lucide-react";
import ConfirmModal from "@/app/dashboard/components/ConfirmModal";
import RenameModal from "@/app/dashboard/components/RenameModal";

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params?.id as string;
  const [cls, setCls] = useState<ClassItem | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Lecture modal state
  const [openLectureModal, setOpenLectureModal] = useState(false);
  const [lectureTitle, setLectureTitle] = useState("");
  const [lectureMessage, setLectureMessage] = useState("");
  const [lectureType, setLectureType] = useState<"text" | "audio">("text");
  const [lectureContentText, setLectureContentText] = useState("");
  const [fileError, setFileError] = useState("");
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    type: string;
  } | null>(null);
  const [uploadedText, setUploadedText] = useState<string>("");
  const [actualFile, setActualFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [audioLanguage, setAudioLanguage] = useState<string>("en-US");
  // Confirm delete modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState<{
    action: () => void;
    message: string;
    title?: string;
    confirmLabel?: string;
  } | null>(null);
  // Rename modal state for lectures
  const [lectureRenameTarget, setLectureRenameTarget] = useState<{
    id: string;
    current: string;
  } | null>(null);
  const [lectureRenameOpen, setLectureRenameOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchClass();
  }, [classId]);

  const fetchClass = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.classes, {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError(401);
          return;
        }
        throw new Error("Failed to fetch class");
      }

      const data = await response.json();

      // Find the specific class
      const found = data.find((c: any) => c.id === classId);

      if (found) {
        // Transform to match ClassItem interface
        const transformedClass: ClassItem = {
          id: found.id,
          name: found.title,
          code: found.code || "",
          color: found.color || "#6366f1",
          lectures:
            found.lectures?.map((lec: any) => ({
              id: lec.id,
              title: lec.title,
              type: lec.type || "text",
              content: lec.transcript || lec.content || "",
              createdAt: lec.created_at,
              status: lec.status,
            })) || [],
          createdAt: found.created_at,
        };
        setCls(transformedClass);
      } else {
        setCls(null);
      }
    } catch (error) {
      console.error("Error fetching class:", error);
      toast.error("Failed to load class details");
      setCls(null);
    } finally {
      setLoading(false);
    }
  };

  const persist = async (updated: ClassItem) => {
    // No longer need to persist all classes, just update this one
    setCls(updated);
  };

  const handleAddLecture = async () => {
    if (!cls) return;
    if (!lectureTitle.trim()) {
      toast.error("Please enter a lecture title");
      return;
    }

    if (lectureType === "text") {
      // Text lecture - either from file or textarea
      const content = lectureContentText.trim() || uploadedText || "";

      if (!content && !actualFile) {
        toast.error("Please provide text content or upload a file");
        return;
      }

      try {
        setIsUploading(true);

        if (actualFile) {
          // Upload file to backend
          const formData = new FormData();
          formData.append("file", actualFile);
          formData.append("class_id", classId);
          formData.append("title", lectureTitle.trim());

          const response = await fetch(API_ENDPOINTS.uploadText, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${getAccessToken()}`,
            },
            body: formData,
          });

          if (!response.ok) {
            if (response.status === 401) {
              handleAuthError(401);
              return;
            }
            throw new Error("Failed to upload text file");
          }

          const newLecture = await response.json();
          toast.success("Text lecture uploaded successfully");

          // Refresh the class to get updated lectures
          await fetchClass();
        } else {
          // Create text file from textarea content and upload
          const blob = new Blob([content], { type: "text/plain" });
          const file = new File([blob], `${lectureTitle.trim()}.txt`, {
            type: "text/plain",
          });

          const formData = new FormData();
          formData.append("file", file);
          formData.append("class_id", classId);
          formData.append("title", lectureTitle.trim());

          const response = await fetch(API_ENDPOINTS.uploadText, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${getAccessToken()}`,
            },
            body: formData,
          });

          if (!response.ok) {
            if (response.status === 401) {
              handleAuthError(401);
              return;
            }
            throw new Error("Failed to upload text lecture");
          }

          const newLecture = await response.json();
          toast.success("Text lecture created successfully");

          // Refresh the class to get updated lectures
          await fetchClass();
        }

        // Reset form
        setLectureTitle("");
        setLectureMessage("");
        setLectureContentText("");
        setLectureType("text");
        setOpenLectureModal(false);
        setUploadedFile(null);
        setUploadedText("");
        setActualFile(null);
        setAudioLanguage("en-US");
      } catch (error) {
        console.error("Error uploading text lecture:", error);
        toast.error("Failed to upload text lecture");
      } finally {
        setIsUploading(false);
      }
    } else if (lectureType === "audio") {
      // Audio lecture - upload audio file
      if (!actualFile) {
        toast.error("Please upload an audio file");
        return;
      }

      try {
        setIsUploading(true);

        // Upload audio file to backend
        const formData = new FormData();
        formData.append("media", actualFile);
        formData.append("class_id", classId);
        formData.append("title", lectureTitle.trim());
        formData.append("language", audioLanguage);

        const response = await fetch(API_ENDPOINTS.uploadAudio, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
          },
          body: formData,
        });

        if (!response.ok) {
          if (response.status === 401) {
            handleAuthError(401);
            return;
          }
          const errorData = await response
            .json()
            .catch(() => ({ detail: "Failed to upload audio" }));
          throw new Error(errorData.detail || "Failed to upload audio");
        }

        const newLecture = await response.json();
        toast.success(
          "Audio lecture uploaded successfully! Transcription is being processed."
        );

        // Refresh the class to get updated lectures
        await fetchClass();

        // Reset form
        setLectureTitle("");
        setLectureMessage("");
        setLectureContentText("");
        setLectureType("text");
        setOpenLectureModal(false);
        setUploadedFile(null);
        setUploadedText("");
        setActualFile(null);
        setAudioLanguage("en-US");
      } catch (error: any) {
        console.error("Error uploading audio lecture:", error);
        toast.error(error.message || "Failed to upload audio lecture");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError("");
    if (lectureType === "audio") {
      // Validate audio file type
      const validAudioTypes = [
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/x-wav",
        "audio/m4a",
        "audio/mp4",
        "audio/ogg",
        "audio/webm",
      ];
      const isValidAudio =
        validAudioTypes.includes(file.type) ||
        /\.(mp3|wav|m4a|ogg|webm)$/i.test(file.name);

      if (!isValidAudio) {
        setFileError(
          "Please upload a valid audio file (MP3, WAV, M4A, OGG, or WebM)"
        );
        return;
      }

      // Store file meta for display and actual file for upload
      setUploadedFile({
        name: file.name,
        size: file.size,
        type: file.type || "audio",
      });
      setActualFile(file);
      // keep textarea untouched
    } else {
      if (!file.name.toLowerCase().endsWith(".txt")) {
        setFileError("Please upload a .txt file for text lectures");
        return;
      }
      setUploadedFile({
        name: file.name,
        size: file.size,
        type: file.type || "text/plain",
      });
      setActualFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        // keep content internally but do not populate textarea
        setUploadedText(String(ev.target?.result || ""));
      };
      reader.readAsText(file);
    }
  };

  const handleRenameLecture = (lectureId: string, newTitle: string) => {
    if (!cls) return;
    const title = newTitle.trim();
    if (!title) return;
    const updated: ClassItem = {
      ...cls,
      lectures: cls.lectures.map((l) =>
        l.id === lectureId ? { ...l, title } : l
      ),
    };
    persist(updated);
  };

  const handleDeleteLecture = (lectureId: string) => {
    if (!cls) return;
    setConfirmData({
      action: () => {
        const updated: ClassItem = {
          ...cls,
          lectures: cls.lectures.filter((l) => l.id !== lectureId),
        };
        persist(updated);
        toast.success("Lecture deleted successfully");
      },
      message: "Delete this lecture? This cannot be undone.",
      title: "Delete Lecture",
      confirmLabel: "Delete",
    });
    setConfirmOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading class...</p>
      </div>
    );
  }

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

  // --- Derived stats & helpers ---
  const totalLectures = cls?.lectures.length || 0;
  const recentLectures =
    cls?.lectures.filter(
      (l) =>
        (Date.now() - new Date(l.createdAt).getTime()) /
          (1000 * 60 * 60 * 24) <=
        7
    ).length || 0;
  const storageUsedKB = cls
    ? Math.round(
        cls.lectures.reduce((acc, l) => acc + (l.content?.length || 0), 0) /
          1024
      )
    : 0;

  const getLectureStatus = (l: Lecture): "new" | "important" | "reviewed" => {
    const ageDays =
      (Date.now() - new Date(l.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays <= 3) return "new";
    if (/exam|final|important|review/i.test(l.title)) return "important";
    return "reviewed";
  };

  const handleDialogOpen = (open: boolean) => {
    setOpenLectureModal(open);
    if (!open) {
      // Reset form when dialog closes
      setLectureTitle("");
      setLectureMessage("");
      setLectureContentText("");
      setLectureType("text");
      setUploadedFile(null);
      setUploadedText("");
      setActualFile(null);
      setAudioLanguage("en-US");
      setFileError("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-[#000000] dark:to-[#000000]">
      {/* Fixed Topbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 dark:bg-[#000000]/80 backdrop-blur-sm border-b border-border dark:border-border">
        <Topbar />
      </nav>
      {/* Main content offset by topbar height */}
      <main className="pt-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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
              {/* Quick Stats Pills */}
              <div className="mt-3 flex flex-wrap gap-2">
                <div className="px-3 py-1 rounded-full bg-card/70 backdrop-blur border border-border text-[11px] flex items-center gap-1 shadow-sm dark:bg-[#1a1a1a]/70">
                  <FileText className="h-3.5 w-3.5 text-indigo-600" />
                  <span>{totalLectures} total</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-card/70 backdrop-blur border border-border text-[11px] flex items-center gap-1 shadow-sm dark:bg-[#1a1a1a]/70">
                  <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                  <span>{recentLectures} recent</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-card/70 backdrop-blur border border-border text-[11px] flex items-center gap-1 shadow-sm dark:bg-[#1a1a1a]/70">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{storageUsedKB} KB</span>
                </div>
              </div>
            </div>
            <Dialog open={openLectureModal} onOpenChange={handleDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" className="gap-2">
                  <Upload className="h-4 w-4" /> Upload Lecture
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
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
                    <label className="text-sm font-medium">Message (Optional)</label>
                    <Textarea
                      value={lectureMessage}
                      onChange={(e) => setLectureMessage(e.target.value)}
                      placeholder="Add any notes or context about this lecture..."
                      className="h-20 max-h-32 overflow-y-auto resize-y"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={lectureType === "text" ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setLectureType("text");
                          setUploadedFile(null);
                          setUploadedText("");
                        }}
                      >
                        Text
                      </Button>
                      <Button
                        type="button"
                        variant={
                          lectureType === "audio" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => {
                          setLectureType("audio");
                          setUploadedFile(null);
                          setUploadedText("");
                          setLectureContentText("");
                        }}
                      >
                        Audio
                      </Button>
                    </div>
                  </div>
                  {lectureType === "audio" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Audio Language
                      </label>
                      <select
                        value={audioLanguage}
                        onChange={(e) => setAudioLanguage(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="en-US">English (US)</option>
                        <option value="en-GB">English (UK)</option>
                        <option value="ko-KR">Korean</option>
                        <option value="ja-JP">Japanese</option>
                        <option value="zh-CN">Chinese (Simplified)</option>
                        <option value="es-ES">Spanish</option>
                        <option value="fr-FR">French</option>
                        <option value="de-DE">German</option>
                      </select>
                      <p className="text-xs text-muted-foreground">
                        Select the language spoken in the audio for accurate
                        transcription
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {lectureType === "audio"
                        ? "Audio File"
                        : "Paste Text or Upload .txt"}
                    </label>
                    {lectureType === "text" && (
                      <>
                        <Textarea
                          rows={6}
                          value={lectureContentText}
                          onChange={(e) =>
                            setLectureContentText(e.target.value)
                          }
                          placeholder="Paste transcript here..."
                          className="h-32 max-h-48 overflow-y-auto resize-y"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>{lectureContentText.length} chars</span>
                          {uploadedFile &&
                            uploadedFile.type.startsWith("text") && (
                              <span>Attached file kept internally</span>
                            )}
                        </div>
                      </>
                    )}
                    {/* File preview */}
                    {uploadedFile && (
                      <FilePreview
                        file={uploadedFile}
                        kind={lectureType}
                        onRemove={() => {
                          setUploadedFile(null);
                          setUploadedText("");
                        }}
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
                      isUploading ||
                      !lectureTitle.trim() ||
                      (lectureType === "text" &&
                        !lectureContentText.trim() &&
                        !uploadedText) ||
                      (lectureType === "audio" && !uploadedFile)
                    }
                    className="w-full"
                    onClick={handleAddLecture}
                  >
                    {isUploading ? (
                      lectureType === "audio" ? (
                        <span className="inline-flex items-center gap-2">
                          <svg
                            className="h-4 w-4 animate-spin text-blue-600"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            />
                          </svg>
                          Uploading & Processing...
                        </span>
                      ) : (
                        "Uploading..."
                      )
                    ) : (
                      "Save Lecture"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        <Card className="p-4 dark:bg-[#1a1a1a]">
          <h2 className="text-lg font-semibold mb-4">Lectures</h2>
          {cls && cls.lectures.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-3xl select-none">
                📄
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">No lectures yet</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Start by uploading your first lecture. Text lectures hold
                  transcripts; audio lectures can later generate transcripts &
                  summaries.
                </p>
              </div>
              <ul className="text-[11px] text-muted-foreground space-y-1">
                <li>• Text: Paste a transcript or import a .txt file</li>
                <li>• Audio: Upload recordings for future processing</li>
                <li>
                  • Use clear titles (e.g. "Week 2 - Optimization Basics")
                </li>
              </ul>
              <Button
                variant="outline"
                onClick={() => setOpenLectureModal(true)}
              >
                Upload Lecture
              </Button>
            </div>
          )}
          {cls && cls.lectures.length > 0 && (
            <ScrollArea className="h-[400px] pr-2">
              <ul className="space-y-3">
                {cls.lectures.map((lec) => {
                  const status = getLectureStatus(lec);
                  return (
                    <li key={lec.id}>
                      <Link
                        href={`/dashboard/class/${cls.id}/lecture/${lec.id}`}
                        className="group block w-full"
                      >
                        <div className="w-full rounded-xl border border-border bg-card p-4 transition-all duration-200 ease-in-out hover:border-primary/50 hover:bg-background/70 hover:shadow-sm dark:bg-[#1a1a1a] dark:hover:bg-[#262626]">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-2 min-w-0">
                                {lec.type === "text" ? (
                                  <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
                                ) : (
                                  <Headphones className="h-4 w-4 text-purple-500 shrink-0" />
                                )}
                                <div className="font-medium text-sm text-foreground group-hover:underline underline-offset-2 truncate">
                                  {lec.title}
                                </div>
                              </div>
                              {lec.type === "text" ? (
                                <p className="text-xs line-clamp-3 whitespace-pre-wrap text-muted-foreground leading-relaxed">
                                  {lec.content}
                                </p>
                              ) : (
                                <p className="text-xs italic text-muted-foreground truncate leading-relaxed">
                                  {lec.content}
                                </p>
                              )}
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-[10px] text-muted-foreground">
                                  Added{" "}
                                  {new Date(lec.createdAt).toLocaleDateString()}{" "}
                                  • {lec.type === "audio" ? "Audio" : "Text"}
                                </p>
                                {/* Status badge */}
                                {status === "new" && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-[10px] text-indigo-600">
                                    <Sparkles className="h-3 w-3" /> New
                                  </span>
                                )}
                                {status === "important" && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-[10px] text-rose-600">
                                    <Star className="h-3 w-3" /> Important
                                  </span>
                                )}
                                {status === "reviewed" && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] text-emerald-600">
                                    <CheckCircle className="h-3 w-3" /> Reviewed
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground uppercase">
                                {lec.type}
                              </span>
                              <LectureActions
                                onRename={() => {
                                  setLectureRenameTarget({
                                    id: lec.id,
                                    current: lec.title,
                                  });
                                  setLectureRenameOpen(true);
                                }}
                                onDelete={() => handleDeleteLecture(lec.id)}
                              />
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          )}
        </Card>
      </main>
      <ConfirmModal
        open={confirmOpen && !!confirmData}
        title={confirmData?.title}
        message={confirmData?.message || ""}
        confirmLabel={confirmData?.confirmLabel}
        cancelLabel="Cancel"
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmData(null);
        }}
        onConfirm={() => {
          if (confirmData?.action) confirmData.action();
          setConfirmOpen(false);
          setConfirmData(null);
        }}
      />
      <RenameModal
        open={lectureRenameOpen && !!lectureRenameTarget}
        title="Rename Lecture"
        initialValue={lectureRenameTarget?.current || ""}
        confirmLabel="Save"
        onCancel={() => {
          setLectureRenameOpen(false);
          setLectureRenameTarget(null);
        }}
        onSubmit={(value) => {
          if (lectureRenameTarget) {
            handleRenameLecture(lectureRenameTarget.id, value);
          }
          setLectureRenameOpen(false);
          setLectureRenameTarget(null);
        }}
      />
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
    <div
      className="relative"
      onClick={(e) => {
        // prevent anchor navigation
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <button
        className="p-1 rounded-md hover:bg-muted"
        aria-label="Lecture actions"
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div
          className="absolute right-0 z-10 mt-2 w-32 rounded-md border bg-card shadow-md dark:bg-[#1a1a1a]"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <button
            className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRename("");
              setOpen(false);
            }}
          >
            Rename
          </button>
          <button
            className="w-full text-left px-3 py-2 text-sm hover:bg-muted text-red-600"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
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

type FilePreviewProps = {
  file: { name: string; size: number; type: string };
  kind: "text" | "audio";
  onRemove: () => void;
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function FilePreview({ file, kind, onRemove }: FilePreviewProps) {
  return (
    <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
      <div className="flex items-center gap-2 min-w-0">
        {kind === "text" ? (
          <FileText className="h-4 w-4 text-indigo-600 shrink-0" />
        ) : (
          <Headphones className="h-4 w-4 text-purple-600 shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">
            {formatSize(file.size)} •{" "}
            {file.type || (kind === "audio" ? "audio" : "text/plain")}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted"
        aria-label="Remove file"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
