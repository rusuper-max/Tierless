// src/components/scrolly/HeroPrism.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { t } from "@/i18n";

export type Faces = Array<string | null | undefined>; // [front, back, right, left, top, bottom]
export type RenderFaces = Array<React.ReactNode | null | undefined>;
type FacesVariant = "solid" | "glass" | "mix";

export default function HeroPrism({
  trackRef,
  faces,
  renderFaces,
  suppressFallback = true,
  offsetX = "0%",
  offsetY = "0%",
  facesVariant = "mix",
}: {
  trackRef: React.RefObject<HTMLElement | HTMLDivElement | null>;
  faces?: Faces;
  renderFaces?: RenderFaces;
  suppressFallback?: boolean;
  offsetX?: string;
  offsetY?: string;
  facesVariant?: FacesVariant;
}) {
  const prismRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = trackRef.current as HTMLElement | null;
    const prism = prismRef.current;
    if (!wrap || !prism) return;

    let raf = 0;
    const clamp = (n: number, min = 0, max = 1) => Math.min(Math.max(n, min), max);

    const update = () => {
      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const travel = Math.max(1, rect.height - vh);
      const raw = clamp((vh - rect.top) / travel, 0, 1);
      const ry = raw * 360; // puni krug kroz Phase 1
      prism.style.setProperty("--prism-ry", `${ry}deg`);
    };

    const onScrollOrResize = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };

    update();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });

    const id = setInterval(update, 250);
    setTimeout(() => clearInterval(id), 1500);

    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      if (raf) cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, [trackRef]);

  // helper za varijantu pozadine
  const bgClassContent = useMemo(() => {
    if (facesVariant === "solid") return "bg-white";
    if (facesVariant === "glass") return "bg-white/90 backdrop-blur";
    // mix = sadržajne face solid, top/bottom glass (rešavam dole po-faci)
    return "bg-white";
  }, [facesVariant]);

  // Ugrađene scene
  const BuiltinFaces = useMemo<RenderFaces>(() => {
    return [
      <FaceBusinessTier key="f1" />,                                           // front
      <FaceListPage key="f2" bgClass={facesVariant === "glass" ? "bg-white/90 backdrop-blur" : bgClassContent} />,
      <FaceOptionsAddons key="f3" bgClass={bgClassContent} />,                 // right
      <FaceMiniCalculator key="f4" bgClass={bgClassContent} />,               // left
      <FaceTopBrand key="f5" bgClass={facesVariant === "solid" ? "bg-white" : "bg-white/90 backdrop-blur"} />,
      <FaceBottomBrand key="f6" bgClass={facesVariant === "solid" ? "bg-white" : "bg-white/90 backdrop-blur"} />,
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgClassContent, facesVariant]);

  const getNode = (idx: number, fallbackLabel: string) => {
    const node = renderFaces?.[idx] ?? BuiltinFaces[idx];
    const imgSrc = faces?.[idx];

    if (node !== undefined && node !== null) {
      return <div className="face-content">{node}</div>;
    }

    if (imgSrc) {
      return (
        <div className="face-content">
          <img
            src={imgSrc}
            alt=""
            decoding="async"
            loading="lazy"
            className="hero-prism-face-img"
          />
        </div>
      );
    }

    if (suppressFallback) return <div className="face-content" aria-hidden />;

    return (
      <div className="face-content">
        <div className="label">{fallbackLabel}</div>
      </div>
    );
  };

  return (
    <div className="hero-prism3d" aria-hidden>
      <div
        ref={prismRef}
        className="prism"
        style={{
          ["--prism-tx" as any]: offsetX,
          ["--prism-ty" as any]: offsetY,
        }}
      >
        <div className="face f-front">{getNode(0, "Front")}</div>
        <div className="face f-back">{getNode(1, "Back")}</div>
        <div className="face f-right">{getNode(2, "Right")}</div>
        <div className="face f-left">{getNode(3, "Left")}</div>
        <div className="face f-top">{getNode(4, "Top")}</div>
        <div className="face f-bottom">{getNode(5, "Bottom")}</div>
      </div>
    </div>
  );
}

/* =========================================================
   FACE 1 — Business tier (brand gradient + included add-ons)
========================================================= */
function FaceBusinessTier() {
  const included = [t("Addon 1"), t("Addon 2"), t("Addon 3")];

  return (
    <div className="w-[min(92%,360px)]">
      <div className="rounded-3xl p-[1px] bg-gradient-to-br from-indigo-500 via-sky-400 to-teal-400 shadow-[0_8px_40px_rgba(0,0,0,.18)]">
        <div className="rounded-[calc(theme(borderRadius.3xl)-1px)] bg-white">
          <div className="p-5">
            <div className="flex items-baseline justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-neutral-900">{t("Business")}</h3>
              <span className="text-base sm:text-lg font-semibold text-neutral-900">{t("Custom")}</span>
            </div>

            <ul className="mt-3 space-y-2 text-[13px] text-neutral-700">
              {[t("Fair use traffic"), t("Advanced formulas"), t("White-label")].map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full translate-y-[1px]"
                    style={{ background: "linear-gradient(90deg,#6366f1,#38bdf8,#14b8a6)" }}
                  />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex flex-wrap gap-2">
              {included.map((label, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-2 rounded-2xl px-3 py-1.5 text-[11px] font-semibold"
                  style={{
                    background:
                      "linear-gradient(#fff,#fff) padding-box, var(--brand-gradient) border-box",
                    border: "1px solid transparent",
                    color: "#0f172a",
                  }}
                >
                  {label}
                  <span
                    className="rounded-xl px-2 py-[2px] text-[10px] font-semibold"
                    style={{
                      background:
                        "linear-gradient(#fff,#fff) padding-box, var(--brand-gradient) border-box",
                      border: "1px solid transparent",
                    }}
                  >
                    {t("Included")}
                  </span>
                </span>
              ))}
            </div>

            <button
              className="mt-4 w-full rounded-xl py-2.5 text-sm font-medium border border-neutral-200 text-neutral-900 hover:shadow hover:-translate-y-[1px] transition hover:border-transparent hover:[background:linear-gradient(#fff,#fff)_padding-box,linear-gradient(90deg,_#6366f1,_#38bdf8,_#14b8a6)_border-box]"
              aria-label={t("Select Business")}
            >
              {t("Select")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   FACE 2 — "List page" — lepši nazivi
========================================================= */
function FaceListPage({ bgClass = "bg-white" }: { bgClass?: string }) {
  const rows = [
    { name: t("Your Price Page 1"), slug: "your-price-page-1", badge: t("Public") },
    { name: t("Your Price Page 2"), slug: "your-price-page-2", badge: t("Public") },
    { name: t("Your Price Page 3"), slug: "your-price-page-3", badge: t("Public") },
  ];
  return (
    <div className="w-[min(96%,520px)]">
      <div className={`rounded-3xl border ${bgClass} shadow-[0_12px_50px_rgba(0,0,0,.12)] p-3`}>
        <div className="px-2 py-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full" style={{ background: "var(--brand-gradient)" }} />
            <h4 className="text-sm font-semibold text-neutral-900">{t("Your pages")}</h4>
          </div>
        </div>
        <div className="divide-y" style={{ borderColor: "rgba(229,231,235,.9)" }}>
          {rows.map((r, i) => (
            <div key={i} className="flex items-center justify-between py-3 px-2">
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-neutral-900 truncate">{r.name}</div>
                <div className="text-[12px] text-neutral-500 truncate">{r.slug}</div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center rounded-xl px-2.5 py-1 text-[11px] font-semibold"
                  style={{
                    background:
                      "linear-gradient(#fff,#fff) padding-box, var(--brand-gradient) border-box",
                    border: "1px solid transparent",
                    color: "#111827",
                  }}
                >
                  {r.badge}
                </span>
                <button className="text-[12px] px-2 py-1 rounded border hover:bg-neutral-50">
                  {t("Edit")}
                </button>
                <button className="text-[12px] px-2 py-1 rounded border hover:bg-neutral-50">
                  {t("Duplicate")}
                </button>
                <button className="text-[12px] px-2 py-1 rounded border text-red-600 hover:bg-red-50">
                  {t("Delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   FACE 3 — Options & Addons (ostaje isto)
========================================================= */
function FaceOptionsAddons({ bgClass = "bg-white" }: { bgClass?: string }) {
  const opts = [t("Option 1"), t("Option 2"), t("Option 3")];
  const [checked, setChecked] = useState([true, false, true]);
  return (
    <div className="w-[min(92%,420px)]">
      <div className={`rounded-3xl border ${bgClass} shadow-[0_12px_50px_rgba(0,0,0,.12)] p-5`}>
        <h4 className="text-base font-semibold text-neutral-900">{t("Options & add-ons")}</h4>

        <div className="mt-3 space-y-2">
          {opts.map((label, i) => (
            <button
              key={i}
              onClick={() =>
                setChecked((p) => p.map((v, idx) => (idx === i ? !v : v)))
              }
              className="w-full flex items-center justify-between rounded-xl border px-3 py-2 text-left hover:bg-neutral-50 transition"
              style={{ borderColor: "rgba(229,231,235,.9)" }}
            >
              <span className="text-sm text-neutral-800">{label}</span>
              <span
                className="inline-flex items-center justify-center rounded-md"
                style={{
                  width: 22,
                  height: 22,
                  border: "1px solid rgba(0,0,0,.2)",
                  background: "linear-gradient(#fff,#fff)",
                }}
              >
                <CheckSVG checked={checked[i]} />
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {["Priority support", "CSV export", "Custom domain"].map((chip, i) => (
            <span
              key={i}
              className="inline-flex items-center rounded-xl px-2.5 py-1 text-[11px] font-semibold"
              style={{
                background:
                  "linear-gradient(#fff,#fff) padding-box, var(--brand-gradient) border-box",
                border: "1px solid transparent",
                color: "#0f172a",
              }}
            >
              {t(chip)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   FACE 4 — Mini kalkulator: slider samo sa “kružićem”
========================================================= */
function FaceMiniCalculator({ bgClass = "bg-white" }: { bgClass?: string }) {
  const BASE = 299;
  const [users, setUsers] = useState(5);
  const [automation, setAutomation] = useState(30);

  const price = useMemo(() => {
    const u = Math.round(users);
    const a = Math.round(automation);
    return Math.round(BASE + u * 12 + a * 3.2);
  }, [users, automation]);

  return (
    <div className="w-[min(92%,460px)]">
      <div className={`rounded-3xl border ${bgClass} shadow-[0_12px_50px_rgba(0,0,0,.12)] p-5`}>
        <div className="flex items-center justify-between">
          <h4 className="text-base font-semibold text-neutral-900">{t("Quick estimator")}</h4>
          <span
            className="inline-flex items-center rounded-xl px-3 py-1.5 text-sm font-semibold"
            style={{
              background:
                "linear-gradient(#fff,#fff) padding-box, var(--brand-gradient) border-box",
              border: "1px solid transparent",
              color: "#111827",
            }}
          >
            {t("Est. total")}: €{price}
          </span>
        </div>

        <div className="mt-4 space-y-4">
          <SliderRowKnobOnly
            label={t("Users")}
            value={users}
            onChange={setUsers}
            min={1}
            max={50}
          />
          <SliderRowKnobOnly
            label={t("Automation depth")}
            value={automation}
            onChange={setAutomation}
            min={0}
            max={100}
          />
        </div>

        <button
          className="mt-5 w-full rounded-xl py-2.5 text-sm font-medium border border-neutral-200 text-neutral-900 hover:shadow hover:-translate-y-[1px] transition hover:border-transparent hover:[background:linear-gradient(#fff,#fff)_padding-box,linear-gradient(90deg,_#6366f1,_#38bdf8,_#14b8a6)_border-box]"
          aria-label={t("Open full calculator")}
        >
          {t("Open full calculator")}
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   FACE 5 / 6 — Top/Bottom brendirani filler
========================================================= */
function FaceTopBrand({ bgClass = "bg-white/90 backdrop-blur" }: { bgClass?: string }) {
  return (
    <div className="w-[min(92%,380px)]">
      <div className={`rounded-3xl border ${bgClass} p-6 shadow-[0_10px_40px_rgba(0,0,0,.10)] grid place-items-center`}>
        <div className="text-center">
          <div
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: "var(--brand-gradient)" }}
          />
          <div className="mt-2 text-sm font-semibold text-neutral-900">
            {t("Tierless components")}
          </div>
          <div className="text-[12px] text-neutral-600">{t("Designed for scrollytelling")}</div>
        </div>
      </div>
    </div>
  );
}

function FaceBottomBrand({ bgClass = "bg-white/90 backdrop-blur" }: { bgClass?: string }) {
  return (
    <div className="w-[min(92%,380px)]">
      <div className={`rounded-3xl border ${bgClass} p-6 shadow-[0_10px_40px_rgba(0,0,0,.10)] grid place-items-center`}>
        <div className="text-center">
          <div className="text-sm font-semibold text-neutral-900">{t("Build your price page")}</div>
          <div
            className="mx-auto mt-2 h-[4px] w-24 rounded-full"
            style={{ background: "var(--brand-gradient)" }}
          />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   UI pomoćne sitnice
========================================================= */
function SliderRowKnobOnly({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm text-neutral-700">{label}</label>
        <span className="text-sm font-semibold text-neutral-900">
          {Math.round(value)}
        </span>
      </div>

      <div className="mt-2 h-3 rounded-full bg-neutral-200 relative overflow-hidden">
        {/* PROGRESS do kružića */}
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${pct}%`,
            background: "var(--brand-gradient)",
            transition: "width .08s linear",
          }}
        />

        {/* KRUŽIĆ */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
          style={{
            left: `${pct}%`,
            width: 18,
            height: 18,
            borderRadius: 999,
            background: "#fff",
            boxShadow: "0 2px 8px rgba(0,0,0,.18)",
            border: "1px solid rgba(0,0,0,.18)",
            transition: "left .08s linear, transform .06s ease",
          }}
        />

        {/* Range hvata drag/keyboard */}
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          aria-label={label}
          onChange={(e) => onChange(parseFloat((e.target as HTMLInputElement).value))}
          className="absolute inset-0 w-full h-3 opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}

function CheckSVG({ checked }: { checked: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <defs>
        <linearGradient id="gb2" x1="0" y1="0" x2="20" y2="20">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <path
        d="M5 10.5l3.2 3.2L15 7"
        stroke="url(#gb2)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 26,
          strokeDashoffset: checked ? 0 : 26,
          transition: "stroke-dashoffset .22s ease",
        }}
      />
    </svg>
  );
}