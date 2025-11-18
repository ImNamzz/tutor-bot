"use client";
import { useEffect, useMemo, useState } from "react";
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
import ColorPicker from "@/app/components/ColorPicker";

interface AddClassModalProps {
  onAdd: (item: ClassItem) => void;
}

// Extended palette (name + hex)
const EXTENDED_COLORS: { name: string; hex: string }[] = [
  { name: "red", hex: "#FF0000" },
  { name: "green", hex: "#00FF00" },
  { name: "blue", hex: "#0000FF" },
  { name: "yellow", hex: "#FFFF00" },
  { name: "orange", hex: "#FFA500" },
  { name: "purple", hex: "#800080" },
  { name: "pink", hex: "#FFC0CB" },
  { name: "brown", hex: "#8B4513" },
  { name: "black", hex: "#000000" },
  { name: "white", hex: "#FFFFFF" },
  { name: "gray", hex: "#808080" },
  { name: "lightgray", hex: "#D3D3D3" },
  { name: "darkgray", hex: "#A9A9A9" },
  { name: "cyan", hex: "#00FFFF" },
  { name: "magenta", hex: "#FF00FF" },
  { name: "teal", hex: "#008080" },
  { name: "turquoise", hex: "#40E0D0" },
  { name: "aqua", hex: "#00FFFF" },
  { name: "lavender", hex: "#E6E6FA" },
  { name: "violet", hex: "#EE82EE" },
  { name: "indigo", hex: "#4B0082" },
  { name: "beige", hex: "#F5F5DC" },
  { name: "tan", hex: "#D2B48C" },
  { name: "khaki", hex: "#F0E68C" },
  { name: "ivory", hex: "#FFFFF0" },
  { name: "cream", hex: "#FFFDD0" },
  { name: "navy", hex: "#000080" },
  { name: "royalblue", hex: "#4169E1" },
  { name: "skyblue", hex: "#87CEEB" },
  { name: "dodgerblue", hex: "#1E90FF" },
  { name: "steelblue", hex: "#4682B4" },
  { name: "salmon", hex: "#FA8072" },
  { name: "coral", hex: "#FF7F50" },
  { name: "tomato", hex: "#FF6347" },
  { name: "crimson", hex: "#DC143C" },
  { name: "gold", hex: "#FFD700" },
  { name: "goldenrod", hex: "#DAA520" },
  { name: "lime", hex: "#00FF00" },
  { name: "chartreuse", hex: "#7FFF00" },
  { name: "olive", hex: "#808000" },
  { name: "mint", hex: "#98FF98" },
  { name: "seafoam", hex: "#2E8B57" },
  { name: "forestgreen", hex: "#228B22" },
  { name: "springgreen", hex: "#00FF7F" },
  { name: "maroon", hex: "#800000" },
  { name: "burgundy", hex: "#800020" },
  { name: "plum", hex: "#DDA0DD" },
  { name: "orchid", hex: "#DA70D6" },
  { name: "fuchsia", hex: "#FF00FF" },
  { name: "slateblue", hex: "#6A5ACD" },
  { name: "slategray", hex: "#708090" },
  { name: "midnightblue", hex: "#191970" },
  { name: "sand", hex: "#C2B280" },
  { name: "wheat", hex: "#F5DEB3" },
  { name: "linen", hex: "#FAF0E6" },
  { name: "peach", hex: "#FFE5B4" },
  { name: "apricot", hex: "#FBCEB1" },
  { name: "mintcream", hex: "#F5FFFA" },
  { name: "honeydew", hex: "#F0FFF0" },
  { name: "snow", hex: "#FFFAFA" },
  { name: "chocolate", hex: "#D2691E" },
  { name: "sienna", hex: "#A0522D" },
  { name: "firebrick", hex: "#B22222" },
  { name: "orangered", hex: "#FF4500" },
  { name: "cyanblueazure", hex: "#4E82D9" },
  { name: "rose", hex: "#FF007F" },
  { name: "azure", hex: "#F0FFFF" },
  { name: "amethyst", hex: "#9966CC" },
  { name: "periwinkle", hex: "#CCCCFF" },
];

export const AddClassModal: React.FC<AddClassModalProps> = ({ onAdd }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [colorValue, setColorValue] = useState<string>(CLASS_COLORS[0]);
  const [bgImage, setBgImage] = useState<string | undefined>(undefined);
  const [colorDialog, setColorDialog] = useState(false);
  const [customHex, setCustomHex] = useState("");
  const [recentColors, setRecentColors] = useState<string[]>([]);

  const onPickImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setBgImage(String(e.target?.result || ""));
    reader.readAsDataURL(file);
  };

  const isValidHex = (v: string) =>
    /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(v);

  // Recent colors are derived from existing classes in storage (max 5)
  const CLASSES_KEY = "eduassist_classes";
  const loadRecentFromClasses = (): string[] => {
    try {
      const raw = localStorage.getItem(CLASSES_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw) as ClassItem[];
      const seen = new Set<string>();
      const list: string[] = [];
      for (const c of arr) {
        const col = c.color;
        if (!col) continue;
        const key = col.startsWith("#") ? col.toLowerCase() : col;
        if (!seen.has(key)) {
          seen.add(key);
          list.push(col);
        }
        if (list.length >= 5) break;
      }
      return list;
    } catch {
      return [];
    }
  };

  useEffect(() => {
    if (colorDialog) {
      setRecentColors(loadRecentFromClasses());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorDialog]);

  const handleCreate = () => {
    if (!name.trim()) return;
    const newClass: ClassItem = {
      id: generateId(),
      name: name.trim(),
      code: code.trim() || undefined,
      color: colorValue,
      bgImage,
      lectures: [],
      createdAt: new Date().toISOString(),
    };
    onAdd(newClass);
    setOpen(false);
    setName("");
    setCode("");
    setColorValue(CLASS_COLORS[0]);
    setBgImage(undefined);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="default">Add Class</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Linear Algebra"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Code (optional)</label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. MATH-201"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Background</label>
              <div className="flex items-center gap-4">
                {/* Preview */}
                {bgImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={bgImage}
                    alt="preview"
                    className="h-12 w-20 rounded-md object-cover border"
                  />
                ) : (
                  <div
                    className={`h-12 w-20 rounded-md border ${
                      colorValue.startsWith("#") ? "" : colorValue
                    }`}
                    style={
                      colorValue.startsWith("#")
                        ? { backgroundColor: colorValue }
                        : undefined
                    }
                  />
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setColorDialog(true)}
                  >
                    Change Color
                  </Button>
                  <input
                    id="class-image-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onPickImage(file);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("class-image-input")?.click()
                    }
                  >
                    Upload Image
                  </Button>
                  {bgImage && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-red-600"
                      onClick={() => setBgImage(undefined)}
                    >
                      Remove Image
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleCreate} disabled={!name.trim()}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Color picker dialog */}
      <Dialog open={colorDialog} onOpenChange={setColorDialog}>
        <DialogContent className="w-[90vw] max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Select a color</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <ColorPicker
              value={colorValue.startsWith("#") ? colorValue : "#ffffff"}
              onColorSelect={(hex) => {
                setColorValue(hex);
              }}
            />
            {recentColors.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-2">Recent</div>
                <div className="flex flex-wrap gap-2">
                  {recentColors.map((col) => (
                    <button
                      key={col}
                      type="button"
                      className={`${
                        col.startsWith("#") ? "" : col
                      } h-6 w-6 rounded-full border`}
                      style={
                        col.startsWith("#")
                          ? { backgroundColor: col }
                          : undefined
                      }
                      title={col}
                      onClick={() => setColorValue(col)}
                    />
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={() => setColorDialog(false)}>Done</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
