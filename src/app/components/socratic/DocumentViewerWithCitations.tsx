"use client";
import React from "react";
import { DocumentRef, Citation } from "@/app/lib/types/socratic";
import { FileText, Video, Landmark } from "lucide-react";

interface Props {
  documents: DocumentRef[];
  active: DocumentRef | null;
  onSelect: (id: string) => void;
  citations: Citation[];
}

export const DocumentViewerWithCitations: React.FC<Props> = ({
  documents,
  active,
  onSelect,
  citations,
}) => {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border bg-card/50 backdrop-blur-sm p-2 flex gap-2 overflow-x-auto">
        {documents.map((doc) => (
          <button
            key={doc.id}
            onClick={() => onSelect(doc.id)}
            className={`px-3 py-1 rounded-md text-xs border border-border flex items-center gap-1 hover:bg-muted transition-colors ${
              active?.id === doc.id ? "bg-muted" : ""
            }`}
          >
            {iconFor(doc.kind)} {doc.title}
          </button>
        ))}
        {documents.length === 0 && (
          <div className="text-xs text-muted-foreground px-2 py-1">
            Upload lecture materials to enable contextual Socratic dialogue.
          </div>
        )}
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {!active && documents.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-10">
            Upload documents or videos to start context-aware questioning.
          </div>
        )}
        {active && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              {iconFor(active.kind)} {active.title}
            </h2>
            <div className="text-xs text-muted-foreground">
              (Placeholder viewer) Add PDF/video rendering and transcript sync
              here.
            </div>
            <div className="rounded-md border border-dashed border-border p-4 text-xs text-muted-foreground">
              Interactive content area. Implement page/timestamp navigation,
              highlights, annotations.
            </div>
            {citations.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xs font-semibold mb-2">
                  Referenced Sections
                </h3>
                <ul className="space-y-1">
                  {citations.map((c) => (
                    <li key={c.id} className="text-[11px] flex gap-2">
                      <span className="text-purple-600">{c.ref}</span>
                      <span className="text-muted-foreground truncate">
                        {c.preview}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function iconFor(kind: DocumentRef["kind"]) {
  switch (kind) {
    case "video":
      return <Video className="h-3.5 w-3.5" />;
    case "pdf":
    case "word":
    case "ppt":
    case "text":
    default:
      return <FileText className="h-3.5 w-3.5" />;
  }
}
