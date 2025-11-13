"use client";

import { t } from "@/i18n";
import { BrandActionButton } from "@/components/ui/BrandButton";

type Props = {
  zoom: number; // 0.5 .. 1.5
  onZoom: (next: number) => void;
  gridOn: boolean;
  onToggleGrid: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  rightExtra?: React.ReactNode;
};

export default function EditorToolbar({
  zoom,
  onZoom,
  gridOn,
  onToggleGrid,
  onUndo,
  onRedo,
  rightExtra,
}: Props) {
  const clampZoom = (n: number) => Math.max(0.5, Math.min(1.5, +n.toFixed(2)));
  const setZoom = (delta: number) => onZoom(clampZoom(zoom + delta));

  const onZoomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    const pct = raw === "" ? 100 : parseInt(raw, 10);
    onZoom(clampZoom(pct / 100));
  };
  const onZoomInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
  };

  const pct = Math.round(zoom * 100);

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <BrandActionButton label={`⟲ ${t("Undo")}`} onClick={onUndo} disabled={!onUndo} size="xs" />
        <BrandActionButton label={`⟳ ${t("Redo")}`} onClick={onRedo} disabled={!onRedo} size="xs" />

        <Divider />

        <span className="text-xs text-[var(--muted)]">{t("Zoom")}</span>
        <BrandActionButton label="−" onClick={() => setZoom(-0.1)} size="xs" />

        {/* input “pill” */}
        <span className="relative inline-flex group">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full"
            style={outlineStyle("brand")}
          />
          <span className="relative inline-flex items-center rounded-full bg-[var(--card)] px-2 py-1.5">
            <input
              aria-label={t("Zoom percent")}
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-16 rounded-full bg-transparent px-2 text-center text-sm outline-none"
              value={`${pct}`}
              onChange={onZoomInput}
              onKeyDown={onZoomInputKey}
              onBlur={(e) => {
                const v = parseInt(e.currentTarget.value.replace(/[^0-9]/g, ""), 10);
                onZoom(Number.isFinite(v) ? clampZoom(v / 100) : 1);
              }}
            />
            <span className="text-sm">%</span>
          </span>
        </span>

        <BrandActionButton label="+" onClick={() => setZoom(+0.1)} size="xs" />
        <BrandActionButton label={t("Reset")} onClick={() => onZoom(1)} size="xs" />

        <Divider />

        <BrandActionButton
          label={`# ${t("Grid")}`}
          onClick={onToggleGrid}
          size="xs"
          variant={gridOn ? "brand" : "neutral"}
          title={t("Show grid")}
        />
      </div>

      <div className="flex items-center gap-2">{rightExtra}</div>
    </div>
  );
}

/* local copy outlineStyle — importujemo iz shared-a da izbegnemo circular */
function outlineStyle(variant: "brand" | "neutral" | "danger") {
  const grad =
    variant === "brand"
      ? "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))"
      : variant === "danger"
      ? "linear-gradient(90deg,#f97316,#ef4444)"
      : "linear-gradient(90deg,#e5e7eb,#d1d5db)";
  return {
    padding: 1.5,
    background: grad,
    WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
    WebkitMaskComposite: "xor" as any,
    maskComposite: "exclude",
    borderRadius: "9999px",
    transition: "opacity .15s ease",
  } as React.CSSProperties;
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-[color-mix(in_oklab,var(--border)_60%,transparent)]" />;
}