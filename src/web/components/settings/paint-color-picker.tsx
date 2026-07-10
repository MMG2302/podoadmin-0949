import { useCallback, useEffect, useRef, useState } from "react";
import {
  PAINT_BASIC_COLORS,
  CUSTOM_SWATCH_COUNT,
  normalizeHex,
} from "../../types/color-palette";
import {
  clamp,
  hexToHsl,
  hexToRgb,
  hslToHex,
  rgbToHex,
  type Hsl,
} from "../../lib/color-utils";
import {
  addToCustomSwatches,
  getCustomSwatches,
} from "../../lib/palette-preferences";

interface PaintColorPickerProps {
  value: string;
  onAccept: (hex: string) => void;
  onCancel: () => void;
}

export function PaintColorPicker({ value, onAccept, onCancel }: PaintColorPickerProps) {
  const initial = normalizeHex(value) ?? "#1a1a1a";
  const [hsl, setHsl] = useState<Hsl>(() => hexToHsl(initial) ?? { h: 0, s: 0, l: 10 });
  const [hex, setHex] = useState(initial);
  const [advanced, setAdvanced] = useState(false);
  const [customSwatches, setCustomSwatches] = useState<string[]>(() => getCustomSwatches());
  const [selectedCustomSlot, setSelectedCustomSlot] = useState(0);
  const slRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const draggingSl = useRef(false);
  const draggingHue = useRef(false);

  const syncFromHex = useCallback((h: string) => {
    const norm = normalizeHex(h);
    if (!norm) return;
    const parsed = hexToHsl(norm);
    if (parsed) {
      setHsl(parsed);
      setHex(norm);
    }
  }, []);

  const updateHsl = useCallback((next: Hsl) => {
    const h = clamp(next.h, 0, 360);
    const s = clamp(next.s, 0, 100);
    const l = clamp(next.l, 0, 100);
    const newHsl = { h, s, l };
    setHsl(newHsl);
    setHex(hslToHex(newHsl));
  }, []);

  const pickFromSl = useCallback(
    (clientX: number, clientY: number) => {
      const el = slRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = clamp((clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((clientY - rect.top) / rect.height, 0, 1);
      updateHsl({ h: hsl.h, s: Math.round(x * 100), l: Math.round((1 - y) * 100) });
    },
    [hsl.h, updateHsl],
  );

  const pickFromHue = useCallback(
    (clientY: number) => {
      const el = hueRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const y = clamp((clientY - rect.top) / rect.height, 0, 1);
      updateHsl({ ...hsl, h: Math.round((1 - y) * 360) });
    },
    [hsl, updateHsl],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (draggingSl.current) pickFromSl(e.clientX, e.clientY);
      if (draggingHue.current) pickFromHue(e.clientY);
    };
    const onUp = () => {
      draggingSl.current = false;
      draggingHue.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [pickFromSl, pickFromHue]);

  const rgb = hexToRgb(hex) ?? { r: 0, g: 0, b: 0 };

  const handleRgbChange = (key: "r" | "g" | "b", val: number) => {
    const next = { ...rgb, [key]: clamp(val, 0, 255) };
    syncFromHex(rgbToHex(next));
  };

  const handleHslInput = (key: keyof Hsl, val: number) => {
    updateHsl({ ...hsl, [key]: val });
  };

  const slX = hsl.s / 100;
  const slY = 1 - hsl.l / 100;
  const hueY = 1 - hsl.h / 360;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Selector de color"
      onClick={onCancel}
    >
      <div
        className="bg-brand-surface border border-brand-border rounded-lg shadow-xl p-4 max-w-lg w-full text-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-xs font-medium text-brand-muted mb-1">Colores básicos:</p>
              <div className="grid grid-cols-8 gap-0.5">
                {PAINT_BASIC_COLORS.map((c, i) => (
                  <button
                    key={`${c}-${i}`}
                    type="button"
                    className="w-6 h-6 border border-brand-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                    title={c}
                    onClick={() => syncFromHex(c)}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-brand-muted mb-1">Colores personalizados:</p>
              <div className="grid grid-cols-8 gap-0.5">
                {customSwatches.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`w-6 h-6 border hover:scale-110 transition-transform ${
                      selectedCustomSlot === i ? "ring-2 ring-brand-ink" : "border-brand-border"
                    }`}
                    style={{ backgroundColor: c }}
                    title={c}
                    onClick={() => {
                      setSelectedCustomSlot(i);
                      syncFromHex(c);
                    }}
                  />
                ))}
              </div>
            </div>
            <button
              type="button"
              className="text-xs text-brand-ink underline hover:no-underline"
              onClick={() => setAdvanced((v) => !v)}
            >
              {advanced ? "« Ocultar colores personalizados" : "Definir colores personalizados »"}
            </button>
          </div>

          {advanced && (
            <div className="flex gap-2 shrink-0">
              <div className="relative">
                <div
                  ref={slRef}
                  className="w-40 h-40 cursor-crosshair border border-brand-border relative"
                  style={{
                    background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsl.h}, 100%, 50%))`,
                  }}
                  onMouseDown={(e) => {
                    draggingSl.current = true;
                    pickFromSl(e.clientX, e.clientY);
                  }}
                >
                  <div
                    className="absolute w-3 h-3 border-2 border-white rounded-full shadow -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ left: `${slX * 100}%`, top: `${slY * 100}%`, backgroundColor: hex }}
                  />
                </div>
              </div>
              <div
                ref={hueRef}
                className="w-4 h-40 cursor-pointer border border-brand-border relative"
                style={{
                  background:
                    "linear-gradient(to top, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
                }}
                onMouseDown={(e) => {
                  draggingHue.current = true;
                  pickFromHue(e.clientY);
                }}
              >
                <div
                  className="absolute left-0 right-0 h-1 border border-white shadow -translate-y-1/2 pointer-events-none"
                  style={{ top: `${hueY * 100}%`, backgroundColor: `hsl(${hsl.h}, 100%, 50%)` }}
                />
              </div>
              <div className="space-y-2 w-28">
                <div
                  className="w-full h-10 border border-brand-border rounded"
                  style={{ backgroundColor: hex }}
                  title="Color | Sólido"
                />
                <label className="block text-[10px] text-brand-muted">
                  Matiz
                  <input
                    type="number"
                    min={0}
                    max={360}
                    value={hsl.h}
                    onChange={(e) => handleHslInput("h", Number(e.target.value))}
                    className="w-full px-1 py-0.5 border border-brand-border rounded text-xs bg-brand-surface text-brand-ink"
                  />
                </label>
                <label className="block text-[10px] text-brand-muted">
                  Sat.
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={hsl.s}
                    onChange={(e) => handleHslInput("s", Number(e.target.value))}
                    className="w-full px-1 py-0.5 border border-brand-border rounded text-xs bg-brand-surface text-brand-ink"
                  />
                </label>
                <label className="block text-[10px] text-brand-muted">
                  Lum.
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={hsl.l}
                    onChange={(e) => handleHslInput("l", Number(e.target.value))}
                    className="w-full px-1 py-0.5 border border-brand-border rounded text-xs bg-brand-surface text-brand-ink"
                  />
                </label>
                <label className="block text-[10px] text-brand-muted">
                  R
                  <input
                    type="number"
                    min={0}
                    max={255}
                    value={rgb.r}
                    onChange={(e) => handleRgbChange("r", Number(e.target.value))}
                    className="w-full px-1 py-0.5 border border-brand-border rounded text-xs bg-brand-surface text-brand-ink"
                  />
                </label>
                <label className="block text-[10px] text-brand-muted">
                  G
                  <input
                    type="number"
                    min={0}
                    max={255}
                    value={rgb.g}
                    onChange={(e) => handleRgbChange("g", Number(e.target.value))}
                    className="w-full px-1 py-0.5 border border-brand-border rounded text-xs bg-brand-surface text-brand-ink"
                  />
                </label>
                <label className="block text-[10px] text-brand-muted">
                  B
                  <input
                    type="number"
                    min={0}
                    max={255}
                    value={rgb.b}
                    onChange={(e) => handleRgbChange("b", Number(e.target.value))}
                    className="w-full px-1 py-0.5 border border-brand-border rounded text-xs bg-brand-surface text-brand-ink"
                  />
                </label>
                <button
                  type="button"
                  className="w-full text-[10px] py-1 border border-brand-border rounded hover:bg-brand-canvas"
                  onClick={() => {
                    const updated = addToCustomSwatches(hex, selectedCustomSlot);
                    setCustomSwatches(updated);
                  }}
                >
                  Agregar a personalizados
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-brand-border">
          <div
            className="w-8 h-8 rounded border border-brand-border shrink-0"
            style={{ backgroundColor: hex }}
          />
          <input
            type="text"
            value={hex}
            onChange={(e) => syncFromHex(e.target.value)}
            className="flex-1 px-2 py-1 border border-brand-border rounded text-xs font-mono bg-brand-surface text-brand-ink"
            maxLength={7}
          />
          <button
            type="button"
            className="px-3 py-1.5 text-xs border border-brand-border rounded hover:bg-brand-canvas"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-xs bg-brand-ink text-brand-ink-fg rounded hover:bg-brand-ink-hover"
            onClick={() => onAccept(hex)}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}

export { CUSTOM_SWATCH_COUNT };
