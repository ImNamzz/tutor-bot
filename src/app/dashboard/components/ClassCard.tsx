"use client";
import React, { useState } from "react";
import { MoreVertical } from "lucide-react";
import { ClassItem } from "@/app/lib/types/class";
import Link from "next/link";

interface ClassCardProps {
  item: ClassItem;
  onRename?: (id: string, newName: string) => void;
  onDelete?: (id: string) => void;
}

export const ClassCard: React.FC<ClassCardProps> = ({
  item,
  onRename,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <Link href={`/dashboard/class/${item.id}`} className="group">
      <div className="group relative rounded-xl shadow-sm border border-border/50 overflow-hidden bg-card hover:ring-2 ring-indigo-400 transition">
        <div className={`${item.color} h-24 w-full`} />
        <button
          className="absolute top-2 right-2 p-1 rounded-md bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition"
          aria-label="Class actions"
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setMenuOpen((v) => !v);
          }}
        >
          <MoreVertical className="h-5 w-5 text-white drop-shadow" />
        </button>
        {menuOpen && (
          <div
            className="absolute top-10 right-2 z-10 w-36 rounded-md border bg-card shadow-md"
            onClick={(e) => e.preventDefault()}
          >
            <button
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
              onClick={() => {
                const name = window.prompt("Rename class", item.name) ?? "";
                if (name.trim() && onRename) onRename(item.id, name.trim());
                setMenuOpen(false);
              }}
            >
              Rename
            </button>
            <button
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted text-red-600"
              onClick={() => {
                if (
                  onDelete &&
                  window.confirm("Delete this class and all its lectures?")
                ) {
                  onDelete(item.id);
                }
                setMenuOpen(false);
              }}
            >
              Delete
            </button>
          </div>
        )}
        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-sm line-clamp-2 leading-snug">
            {item.name}
          </h3>
          {item.code && (
            <p className="text-xs text-muted-foreground font-medium">
              {item.code}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground">
            {item.lectures.length} lecture(s)
          </p>
        </div>
      </div>
    </Link>
  );
};
