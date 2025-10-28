"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { t } from "@/i18n";

export type ListController = {
  wrap: HTMLDivElement | null;
  items: HTMLDivElement[];
  heading: HTMLDivElement | null;
  addons: HTMLDivElement | null;
};

type Item = { name: string; price: string; u?: string };

type Props = {
  items: Item[];
  zIndex?: number;
};

const ListPricingLayer = forwardRef<ListController, Props>(function ListPricingLayer(
  { items, zIndex = 70 },
  ref,
) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<HTMLDivElement[]>([]);
  const headingRef = useRef<HTMLDivElement>(null);
  const addonsRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(
    ref,
    () => ({
      wrap: wrapRef.current,
      items: itemRefs.current,
      heading: headingRef.current,
      addons: addonsRef.current,
    }),
    [],
  );

  useEffect(() => {
    itemRefs.current.length = items.length; // stabilni indeksi
  }, [items.length]);

  return (
    <div
      ref={wrapRef}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 pointer-events-none"
      style={{ width: "min(880px, 94vw)", opacity: 0, zIndex }}
    >
      {/* HEADLINE iznad liste (brend gradijent) */}
      <div
        ref={headingRef}
        className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          top: "-120px",
          transform: "translate3d(-50%, -40vh, 0)",
          opacity: 0,
          willChange: "transform, opacity",
        }}
      >
        <div
          className={[
            "text-center font-semibold leading-none select-none",
            "text-transparent bg-clip-text",
            "bg-gradient-to-r from-indigo-500 via-sky-400 to-teal-400",
            "text-[clamp(22px,3.4vw,44px)]",
          ].join(" ")}
        >
          {t("Or be tierless and build a list-based price page")}
        </div>
      </div>

      {/* LISTA — centralna kolona */}
      <div className="relative">
        {items.map((it, i) => (
          <div
            key={`${it.name}-${i}`}
            ref={(el) => { if (el) itemRefs.current[i] = el; }}
            suppressHydrationWarning
            className="relative mx-auto w-full rounded-2xl bg-white mb-3 will-change-transform pointer-events-auto"
            style={{
              // Outline + border (vidljivije)
              border: "1px solid rgba(226,232,240,1)",          // neutral-200
              boxShadow: "0 12px 40px rgba(0,0,0,.08)",
              outline: "1px solid rgba(243,244,246,.9)",        // neutral-100
              transform: "translate3d(-50%, 0, 0) scale(0.98)",
              opacity: 0,
              left: "50%",
              height: "68px",
            }}
          >
            <div className="h-full flex items-center gap-4 px-5">
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-medium text-neutral-900 truncate">
                  {t(it.name)}
                </div>
                <div className="text-[12px] text-neutral-500">{t("List item")}</div>
              </div>
              <div className="text-[15px] font-semibold text-neutral-900 whitespace-nowrap">
                {it.price}
                {it.u && <span className="text-neutral-500 font-normal"> {it.u}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ADD-ONS panel (desno od liste) */}
      <div
        ref={addonsRef}
        className="absolute top-1/2 -translate-y-1/2 pointer-events-auto"
        style={{
          left: "calc(50% + 460px)",        // desno od liste
          width: "min(340px, 42vw)",
          transform: "translate3d(60vw, -50%, 0) scale(0.98)",
          opacity: 0,
          willChange: "transform, opacity",
        }}
      >
        <div className="rounded-2xl bg-white border border-neutral-200 shadow-[0_12px_40px_rgba(0,0,0,.08)] p-5">
          <div className="text-[15px] font-semibold text-neutral-900 mb-3">
            {t("Options & add-ons")}
          </div>

          <div className="space-y-3">
            {/* checkboxes samo za izgled */}
            {[
              t("Enable checkouts"),
              t("Custom branding"),
              t("Email support"),
              t("Public link"),
            ].map((label, idx) => (
              <label key={idx} className="flex items-center gap-3 select-none">
                <span className="relative inline-grid place-items-center size-5 rounded-md border border-neutral-300">
                  <span className="size-3 rounded-[2px] bg-neutral-900 opacity-90" />
                </span>
                <span className="text-[14px] text-neutral-800">{label}</span>
              </label>
            ))}

            {/* Slider mock */}
            <div className="pt-2">
              <div className="text-[13px] text-neutral-500 mb-1">{t("Quantity")}</div>
              <div className="h-9 rounded-xl border border-neutral-200 px-3 flex items-center justify-between">
                <span className="text-[13px] text-neutral-700">{t("Units")}</span>
                <span className="text-[13px] text-neutral-900 font-semibold">8</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-neutral-200 relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full w-[68%] bg-gradient-to-r from-indigo-500 via-sky-400 to-teal-400" />
              </div>
            </div>
          </div>

          <div className="mt-5 h-10 rounded-xl bg-neutral-900 text-white grid place-items-center text-sm font-medium">
            {t("Update total")}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ListPricingLayer;