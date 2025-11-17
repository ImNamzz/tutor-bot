"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { CLASS_COLORS, ClassItem, generateId } from "@/app/lib/types/class";

interface AddClassModalProps {
  onAdd: (item: ClassItem) => void;
}

export const AddClassModal: React.FC<AddClassModalProps> = ({ onAdd }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [colorIndex, setColorIndex] = useState(0);

  const cycleColor = () => setColorIndex((i) => (i + 1) % CLASS_COLORS.length);

  const handleCreate = () => {
    if (!name.trim()) return;
    const newClass: ClassItem = {
      id: generateId(),
      name: name.trim(),
      code: code.trim() || undefined,
      color: CLASS_COLORS[colorIndex],
      lectures: [],
      createdAt: new Date().toISOString(),
    };
    onAdd(newClass);
    setOpen(false);
    setName("");
    setCode("");
    setColorIndex(0);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="font-medium">
          Add Class
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a Class</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Class Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Data Structures"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Code (optional)</label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. CS102"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Color</label>
            <div className="flex items-center gap-3">
              <div
                className={`h-8 w-8 rounded-md border border-border ${CLASS_COLORS[colorIndex]}`}
              />
              <Button size="sm" variant="outline" onClick={cycleColor}>
                Change
              </Button>
            </div>
          </div>
          <Button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="w-full"
          >
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
