"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/app/components/ui/input";
import { Pipette } from "lucide-react";

type Props = {
  value?: string; // hex like #RRGGBB
  onColorSelect?: (hex: string) => void;
  className?: string;
};

// --- color utils ---
function clamp(n: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, n));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const v = hex.trim();
  const re3 = /^#([0-9a-fA-F]{3})$/;
  const re6 = /^#([0-9a-fA-F]{6})$/;
  if (re6.test(v)) {
    const m = v.match(re6)!;
    const int = parseInt(m[1], 16);
    return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
  }
  if (re3.test(v)) {
    const m = v.match(re3)!;
    const r = parseInt(m[1][0] + m[1][0], 16);
    const g = parseInt(m[1][1] + m[1][1], 16);
    const b = parseInt(m[1][2] + m[1][2], 16);
    return { r, g, b };
  }
  return null;
}

function rgbToHex(r: number, g: number, b: number) {
  const to2 = (n: number) => n.toString(16).padStart(2, "0");
  return `#${to2(r)}${to2(g)}${to2(b)}`.toUpperCase();
}

// HSV helpers (s,v in 0..1, h in 0..360)
function hsvToRgb(h: number, s: number, v: number) {
  h = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let rp = 0,
    gp = 0,
    bp = 0;
  if (0 <= h && h < 60) {
    rp = c;
    gp = x;
    bp = 0;
  } else if (60 <= h && h < 120) {
    rp = x;
    gp = c;
    bp = 0;
  } else if (120 <= h && h < 180) {
    rp = 0;
    gp = c;
    bp = x;
  } else if (180 <= h && h < 240) {
    rp = 0;
    gp = x;
    bp = c;
  } else if (240 <= h && h < 300) {
    rp = x;
    gp = 0;
    bp = c;
  } else {
    rp = c;
    gp = 0;
    bp = x;
  }
  const r = Math.round((rp + m) * 255);
  const g = Math.round((gp + m) * 255);
  const b = Math.round((bp + m) * 255);
  return { r, g, b };
}

function rgbToHsv(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d === 0) h = 0;
  else if (max === r) h = 60 * (((g - b) / d) % 6);
  else if (max === g) h = 60 * ((b - r) / d + 2);
  else h = 60 * ((r - g) / d + 4);
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (h < 0) h += 360;
  return { h, s, v };
}

export default function ColorPicker({
  value,
  onColorSelect,
  className,
}: Props) {
  // Default color
  const initialHex = useMemo(() => {
    if (value && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)) return value;
    return "#FF0000";
  }, [value]);

  const initRgb = hexToRgb(initialHex)!;
  const initHsv = rgbToHsv(initRgb.r, initRgb.g, initRgb.b);
  const [h, setH] = useState(initHsv.h); // 0..360
  const [s, setS] = useState(initHsv.s); // 0..1
  const [v, setV] = useState(initHsv.v); // 0..1
  const currentHex = useMemo(() => {
    const { r, g, b } = hsvToRgb(h, s, v);
    return rgbToHex(r, g, b);
  }, [h, s, v]);

  // Editable hex field (allows temporary invalid values until commit)
  const [hexDraft, setHexDraft] = useState(initialHex.toUpperCase());

  // Notify parent only when color actually changes (ignore callback identity)
  const internalChangeRef = useRef(false);
  useEffect(() => {
    if (internalChangeRef.current) {
      onColorSelect?.(currentHex);
      internalChangeRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentHex]);

  // Update internal when external value changes
  useEffect(() => {
    if (value && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)) {
      // Avoid redundant state updates if external value already matches current color
      if (value.toUpperCase() === currentHex.toUpperCase()) return;
      const rgb = hexToRgb(value)!;
      const nhsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      setH(nhsv.h);
      setS(nhsv.s);
      setV(nhsv.v);
      setHexDraft(value.toUpperCase());
    }
  }, [value, currentHex]);

  // Panel interactions
  const panelRef = useRef<HTMLDivElement>(null);
  const draggingPanel = useRef(false);
  const onPanelPointer = (clientX: number, clientY: number) => {
    const el = panelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = clamp((clientX - rect.left) / rect.width);
    const ny = clamp((clientY - rect.top) / rect.height);
    // s increases to right; v decreases to down (so 1 - ny)
    setS(nx);
    setV(1 - ny);
    internalChangeRef.current = true;
  };

  // Hue slider interactions
  const sliderRef = useRef<HTMLDivElement>(null);
  const draggingHue = useRef(false);
  const onHuePointer = (clientX: number) => {
    const el = sliderRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = clamp((clientX - rect.left) / rect.width);
    setH(nx * 360);
    internalChangeRef.current = true;
  };

  // Global listeners
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (draggingPanel.current) onPanelPointer(e.clientX, e.clientY);
      if (draggingHue.current) onHuePointer(e.clientX);
    };
    const onTouchMove = (te: TouchEvent) => {
      if (draggingPanel.current || draggingHue.current) {
        const t = te.touches[0];
        if (!t) return;
        if (draggingPanel.current) onPanelPointer(t.clientX, t.clientY);
        if (draggingHue.current) onHuePointer(t.clientX);
      }
    };
    const onUp = () => {
      draggingPanel.current = false;
      draggingHue.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
    };
  }, []);

  const baseHueHex = useMemo(() => {
    const { r, g, b } = hsvToRgb(h, 1, 1);
    return rgbToHex(r, g, b);
  }, [h]);

  const handleHexChange = (v: string) => {
    const val = v.startsWith("#") ? v : `#${v}`;
    if (/^#([0-9a-fA-F]{6})$/.test(val)) {
      const rgb = hexToRgb(val)!;
      const nhsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      setH(nhsv.h);
      setS(nhsv.s);
      setV(nhsv.v);
      internalChangeRef.current = true;
    }
  };

  const commitHexDraft = () => {
    const raw = hexDraft.trim();
    const val = raw.startsWith("#") ? raw : `#${raw}`;
    if (/^#([0-9a-fA-F]{6})$/.test(val)) {
      handleHexChange(val);
    } else {
      // revert draft to current color if invalid
      setHexDraft(currentHex);
    }
  };

  // Keep draft synced when internal color changes (e.g., dragging panel)
  useEffect(() => {
    setHexDraft(currentHex);
  }, [currentHex]);

  // UI dimensions similar to reference: panel 260x190-ish, slider 14px
  return (
    <div className={"w-full max-w-[420px] " + (className || "")}>
      {/* Panel */}
      <div
        ref={panelRef}
        className="relative w-full aspect-[4/3] rounded-md overflow-hidden cursor-crosshair"
        style={{ backgroundColor: baseHueHex }}
        onMouseDown={(e) => {
          draggingPanel.current = true;
          onPanelPointer(e.clientX, e.clientY);
        }}
        onTouchStart={(e) => {
          draggingPanel.current = true;
          const t = e.touches[0];
          if (t) onPanelPointer(t.clientX, t.clientY);
        }}
      >
        {/* White overlay for saturation */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to right, #fff, rgba(255,255,255,0))",
          }}
        />
        {/* Black overlay for value */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, #000, rgba(0,0,0,0))" }}
        />
        {/* Thumb */}
        <div
          className="absolute h-4 w-4 -mt-2 -ml-2 rounded-full border-2 border-white shadow"
          style={{ left: `${s * 100}%`, top: `${(1 - v) * 100}%` }}
        />
      </div>

      {/* Hue slider */}
      <div
        ref={sliderRef}
        className="mt-3 h-3 w-full rounded-md cursor-pointer"
        style={{
          background:
            "linear-gradient(to right, #FF0000, #FFFF00, #00FF00, #00FFFF, #0000FF, #FF00FF, #FF0000)",
        }}
        onMouseDown={(e) => {
          draggingHue.current = true;
          onHuePointer(e.clientX);
        }}
        onTouchStart={(e) => {
          draggingHue.current = true;
          const t = e.touches[0];
          if (t) onHuePointer(t.clientX);
        }}
      >
        {/* Hue thumb */}
        <div className="relative h-full">
          <div
            className="absolute top-1/2 -translate-y-1/2 h-5 w-5 -ml-2 rounded-full border-2 border-white shadow"
            style={{ left: `${(h / 360) * 100}%` }}
          />
        </div>
      </div>

      {/* Hex input + eyedropper */}
      <div className="mt-3 flex items-center gap-2">
        <Input
          value={hexDraft}
          onChange={(e) => setHexDraft(e.target.value.toUpperCase())}
          onBlur={commitHexDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commitHexDraft();
            }
          }}
          placeholder="#RRGGBB"
          className="w-36"
        />
        <button
          type="button"
          className="p-2 rounded-md border bg-muted text-muted-foreground"
          title="Eyedropper (UI only)"
        >
          <Pipette className="h-4 w-4" />
        </button>
        <div
          className="ml-auto h-6 w-10 rounded border"
          style={{ backgroundColor: currentHex }}
        />
      </div>
    </div>
  );
}
