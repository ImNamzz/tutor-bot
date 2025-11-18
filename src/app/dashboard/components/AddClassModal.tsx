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
import { ScrollArea } from "@/app/components/ui/scroll-area";

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

  // Recent colors persistence
  const RECENTS_KEY = "eduassist_recent_colors";
  const loadRecents = () => {
    try {
      const raw = localStorage.getItem(RECENTS_KEY);
      if (!raw) return [] as string[];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? (arr as string[]) : [];
    } catch {
      return [] as string[];
    }
  };
  const saveRecents = (list: string[]) => {
    try {
      localStorage.setItem(RECENTS_KEY, JSON.stringify(list));
    } catch {}
  };
  const addRecent = (hex: string) => {
    if (!isValidHex(hex)) return;
    setRecentColors((prev) => {
      const next = [
        hex,
        ...prev.filter((c) => c.toLowerCase() !== hex.toLowerCase()),
      ].slice(0, 10);
      saveRecents(next);
      return next;
    });
  };

  useEffect(() => {
    if (colorDialog) {
      setRecentColors(loadRecents());
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
            <label className="text-sm font-medium">Background</label>
            {/* Preview + actions */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-20 rounded-md border border-border overflow-hidden">
                {bgImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={bgImage}
                    alt="preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="h-full w-full"
                    style={
                      colorValue.startsWith("#")
                        ? { backgroundColor: colorValue }
                        : undefined
                    }
                  >
                    {!colorValue.startsWith("#") && (
                      <div className={`${colorValue} h-full w-full`} />
                    )}
                  </div>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setColorDialog(true)}
              >
                Change
              </Button>
              {bgImage ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setBgImage(undefined)}
                >
                  Remove Image
                </Button>
              ) : null}
            </div>
            <div className="flex items-center gap-3 pt-2">
              <label className="text-sm">Or upload an image</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onPickImage(f);
                }}
              />
            </div>
          </div>

          {/* Color picker dialog */}
          <Dialog open={colorDialog} onOpenChange={setColorDialog}>
            <DialogContent className="w-[80vw] sm:w-[80vw] max-w-[80vw] sm:max-w-[80vw] lg:max-w-[80vw]">
              <DialogHeader>
                <DialogTitle>Select a color</DialogTitle>
              </DialogHeader>
              {recentColors.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs text-muted-foreground mb-2">
                    Recent
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {recentColors.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        className="flex items-center gap-2"
                        onClick={() => {
                          setColorValue(hex);
                          setColorDialog(false);
                        }}
                        title={hex}
                      >
                        <span
                          className="h-8 w-8 rounded-full border"
                          style={{ backgroundColor: hex }}
                        />
                        <span className="text-[11px] text-muted-foreground">
                          {hex}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <ScrollArea className="h-[60vh] pr-2">
                <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-14 xl:grid-cols-16 gap-4">
                  {EXTENDED_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      className="flex flex-col items-center gap-2"
                      onClick={() => {
                        setColorValue(c.hex);
                        addRecent(c.hex);
                        setColorDialog(false);
                      }}
                    >
                      <span
                        className="block h-10 w-10 rounded-full border"
                        style={{ backgroundColor: c.hex }}
                        aria-label={c.name}
                        title={`${c.name} (${c.hex})`}
                      />
                      <span className="text-[10px] text-muted-foreground text-center leading-tight">
                        {c.name}
                      </span>
                    </button>
                  ))}
                  {/* Custom Color tile */}
                  <div className="flex flex-col items-center gap-2">
                    <span
                      className="block h-10 w-10 rounded-full border"
                      style={{
                        backgroundColor: isValidHex(customHex)
                          ? customHex
                          : "transparent",
                      }}
                      title={isValidHex(customHex) ? customHex : "Custom"}
                    />
                    <span className="text-[10px] text-muted-foreground leading-tight">
                      Custom
                    </span>
                    <Input
                      value={customHex}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCustomHex(v);
                        if (isValidHex(v)) {
                          setColorValue(v);
                          addRecent(v);
                        }
                      }}
                      placeholder="#RRGGBB"
                      className="h-8 w-24 text-xs"
                    />
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={async () => {
                          const v = isValidHex(customHex)
                            ? customHex
                            : colorValue;
                          try {
                            await navigator.clipboard.writeText(v);
                          } catch {}
                        }}
                      >
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={async () => {
                          try {
                            const v = await navigator.clipboard.readText();
                            if (isValidHex(v)) {
                              setCustomHex(v);
                              setColorValue(v);
                              addRecent(v);
                            }
                          } catch {}
                        }}
                      >
                        Paste
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
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
