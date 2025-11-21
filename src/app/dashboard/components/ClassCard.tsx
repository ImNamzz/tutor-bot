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
        {item.bgImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.bgImage}
            alt="class cover"
            className="h-24 w-full object-cover"
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
          className="absolute top-2 right-2 p-1 rounded-md bg-muted/30 hover:bg-muted/50 transition"
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
          {/* Footer bar for subtle separation */}
          <div className="mt-auto h-1 rounded bg-muted/40" />
        </div>
      </div>
    </Link>
  );
};
