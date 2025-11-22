"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MoreVertical, Image, Trash2 } from "lucide-react";
import { ClassCardProps } from "@/app/lib/types/class";

export const ClassCard: React.FC<ClassCardProps> = ({
  item,
  onRename,
  onDelete,
  onUploadBackground,
  onDeleteBackground,
  isMenuOpen,
  onToggleMenu,
}) => {
  const [imageError, setImageError] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (!cardRef.current) return;
      const menuEl = cardRef.current.querySelector(".class-card-menu");
      const toggleEl = cardRef.current.querySelector(".class-card-toggle");
      const target = e.target as Node;
      if (menuEl && menuEl.contains(target)) return;
      if (toggleEl && toggleEl.contains(target)) return;
      if (onToggleMenu) onToggleMenu("");
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isMenuOpen, onToggleMenu]);

  return (
    <Link href={`/dashboard/class/${item.id}`} className="group">
      <div
        ref={cardRef}
        className="group relative rounded-xl shadow-sm border border-border/50 overflow-hidden bg-card hover:ring-2 ring-indigo-400 transition"
      >
        {item.bgImage && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.bgImage}
            alt={`${item.name} background`}
            className="h-24 w-full object-cover"
            onError={() => {
              console.warn(
                "[ClassCard] Image failed to load, falling back to color",
                item.id
              );
              setImageError(true);
            }}
          />
        ) : item.color.startsWith("#") ? (
          <div
            className="h-24 w-full"
            style={{ backgroundColor: item.color }}
          />
        ) : (
          <div className={`${item.color} h-24 w-full`} />
        )}

        <button
          className="class-card-toggle absolute top-2 right-2 p-1 rounded-md bg-muted/30 hover:bg-muted/50 transition"
          aria-label="Class actions"
          type="button"
          onClick={(e) => {
            e.preventDefault();
            if (onToggleMenu) onToggleMenu(item.id);
          }}
        >
          <MoreVertical className="h-5 w-5 text-white drop-shadow" />
        </button>

        {isMenuOpen && (
          <div
            className="class-card-menu absolute top-10 right-2 z-10 w-56 rounded-xl bg-white dark:bg-neutral-900 shadow-xl p-2 flex flex-col gap-2"
            onClick={(e) => e.preventDefault()}
          >
            <button
              className="w-full text-left px-3 py-2 text-sm whitespace-nowrap rounded-md border border-border/50 shadow-sm hover:bg-muted/60 dark:hover:bg-neutral-800 transition"
              onClick={() => {
                if (onRename) onRename(item.id, item.name);
                if (onToggleMenu) onToggleMenu("");
              }}
            >
              Rename
            </button>
            <button
              className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 whitespace-nowrap rounded-md border border-border/50 shadow-sm hover:bg-muted/60 dark:hover:bg-neutral-800 transition"
              onClick={() => {
                if (onUploadBackground) onUploadBackground(item);
                if (onToggleMenu) onToggleMenu("");
              }}
            >
              <Image className="h-4 w-4" />
              {item.bgImage ? "Change Background" : "Upload Background"}
            </button>
            {item.bgImage && (
              <button
                className="w-full text-left px-3 py-2 text-sm text-red-600 flex items-center gap-2 whitespace-nowrap rounded-md border border-red-300/50 dark:border-red-700/40 shadow-sm hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                onClick={() => {
                  if (onDeleteBackground) onDeleteBackground(item.id);
                  if (onToggleMenu) onToggleMenu("");
                }}
              >
                <Trash2 className="h-4 w-4" />
                Remove Background
              </button>
            )}
            <button
              className="w-full text-left px-3 py-2 text-sm text-red-600 whitespace-nowrap rounded-md border border-red-300/50 dark:border-red-700/40 shadow-sm hover:bg-red-50 dark:hover:bg-red-950/30 transition"
              onClick={() => {
                if (onDelete) onDelete(item.id);
                if (onToggleMenu) onToggleMenu("");
              }}
            >
              Delete
            </button>
          </div>
        )}

        <div className="p-5 flex flex-col">
          <h3 className="font-semibold text-base leading-tight mb-2 line-clamp-2 min-h-[38px]">
            {item.name}
          </h3>
          <div className="min-h-[20px] mb-2">
            {item.code ? (
              <p className="text-sm text-muted-foreground font-medium leading-none">
                {item.code}
              </p>
            ) : null}
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
            <span>Created {new Date(item.createdAt).toLocaleDateString()}</span>
            <span>{item.lectures.length} lecture(s)</span>
          </div>
          <div className="mt-auto h-1 rounded bg-muted/40" />
        </div>
      </div>
    </Link>
  );
};
