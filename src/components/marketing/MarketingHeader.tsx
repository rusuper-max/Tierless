// src/components/marketing/MarketingHeader.tsx
"use client";

import Link from "next/link";
import { useState, useCallback, useMemo, useRef, useLayoutEffect, useEffect, CSSProperties } from "react";
import { useRouter } from "next/navigation";
import CTAButton from "@/components/marketing/CTAButton";
import { t } from "@/i18n/t";

export default function MarketingHeader() {
  const router = useRouter();

  // --- Auth (CSR) ---
  const [authed, setAuthed] = useState(false);
  const refreshAuth = useCallback(async (reason: string) => {
    try {
      const res = await fetch(`${location.origin}/api/auth/status?ts=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
        headers: { "x-no-cache": String(performance.now()) },
      });
      const data = await res.json();
      setAuthed(!!data?.authenticated);
    } catch {}
  }, []);
  useEffect(() => {
    refreshAuth("mount");
    const onChanged = () => refreshAuth("TL_AUTH_CHANGED");
    window.addEventListener("TL_AUTH_CHANGED", onChanged as any);
    return () => window.removeEventListener("TL_AUTH_CHANGED", onChanged as any);
  }, [refreshAuth]);

  // --- Side rail signal (ostaje kao ranije) ---
  const [railVisible, setRailVisible] = useState(false);
  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) {
      const onScroll = () => {
        const vis = window.scrollY > 24;
        setRailVisible(vis);
        window.dispatchEvent(new CustomEvent("TL_RAIL_VISIBLE", { detail: { visible: vis } }));
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        const vis = !e.isIntersecting;
        setRailVisible(vis);
        window.dispatchEvent(new CustomEvent("TL_RAIL_VISIBLE", { detail: { visible: vis } }));
      },
      { rootMargin: "-10% 0px -75% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  // --- NEW: sakrij header čim krene scroll ---
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // --- Brand animacija ---
  const [hovered, setHovered] = useState(false);
  const onEnter = useCallback(() => setHovered(true), []);
  const onLeave = useCallback(() => setHovered(false), []);
  const brandSolid = "var(--brand-1, #4F46E5)";
  const GRAD_HOLD_PCT = 40;
  const grad = `linear-gradient(90deg,
    var(--brand-1, #4F46E5) 0%,
    var(--brand-1, #4F46E5) ${GRAD_HOLD_PCT}%,
    var(--brand-2, #22D3EE) 100%)`;
  const fontSize = "clamp(36px, 10vw, 60px)";
  const wrapWidth = "18.5ch";
  const DURATION = 800;
  const STAGGER = 260;
  const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
  const letters = useMemo(() => "ierless".split(""), []);
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const letterRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [totalW, setTotalW] = useState<number>(0);
  const [offsets, setOffsets] = useState<number[]>([]);
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const offs = letterRefs.current.map((el) => (el ? el.offsetLeft : 0));
    const last = letterRefs.current[letters.length - 1];
    const total = last ? last.offsetLeft + last.offsetWidth : 0;
    if (total > 0) {
      setOffsets(offs);
      setTotalW(total);
    }
  }, [letters.length]);

  const [accOpen, setAccOpen] = useState(false);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest?.("#hdr-acc-dd")) setAccOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const userInitial = useMemo(() => "A", []);

  // Ako je scrolled, krijemo header odmah (nezavisno od railVisible)
  const hiddenNow = scrolled;

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-40 transition-all duration-200",
        hiddenNow ? "opacity-0 -translate-y-2 pointer-events-none" : "opacity-100 translate-y-0",
      ].join(" ")}
      aria-label={t("Main header")}
    >
      <div
        className="mx-auto w-full max-w-7xl px-4 py-5 flex items-center justify-between"
        style={{
          paddingInlineStart: "calc(env(safe-area-inset-left, 0px) + 8px)",
          paddingInlineEnd: "calc(env(safe-area-inset-right, 0px) + 8px)",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          aria-label={`${t("brand.name")} — home`}
          className="inline-flex select-none ml-0"
          style={{ lineHeight: 1, alignItems: "baseline" }}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          onFocus={onEnter}
          onBlur={onLeave}
        >
          <span
            style={{
              display: "inline-block",
              fontWeight: 700,
              letterSpacing: "-0.01em",
              lineHeight: 1,
              fontSize,
              color: brandSolid,
            }}
          >
            T
          </span>
          <span
            ref={wrapRef}
            aria-hidden
            style={{
              display: "inline-block",
              verticalAlign: "baseline",
              width: wrapWidth,
              overflow: "hidden",
              paddingLeft: "0.15ch",
              whiteSpace: "nowrap",
            }}
          >
            {letters.map((ch, i) => {
              const style: CSSProperties = {
                display: "inline-block",
                fontWeight: 700,
                letterSpacing: "-0.01em",
                lineHeight: 1,
                fontSize,
                backgroundImage: grad,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                WebkitTextFillColor: "transparent",
                backgroundSize: totalW ? `${totalW}px 100%` : "100% 100%",
                backgroundPosition: totalW ? `-${offsets[i] || 0}px 0` : "0 0",
                transform: hovered ? "translateX(0) translateY(0)" : "translateX(-0.6ch) translateY(0.15em)",
                opacity: hovered ? 1 : 0,
                transitionProperty: "transform, opacity",
                transitionDuration: `${DURATION}ms`,
                transitionTimingFunction: EASE,
                transitionDelay: hovered ? `${i * STAGGER}ms` : "0ms",
                willChange: "transform, opacity",
              };
              return (
                <span
                  key={i}
                  ref={(el: HTMLSpanElement | null) => {
                    letterRefs.current[i] = el;
                  }}
                  style={style}
                >
                  {ch}
                </span>
              );
            })}
          </span>
        </Link>

        {/* Right: auth actions */}
        <nav className="flex items-center gap-3">
          {!authed ? (
            <>
              <CTAButton
                fx="swap-up"
                variant="outline"
                size="md"
                pill
                hairlineOutline
                href="/signin"
                label={t("nav.signin")}
              />
              <CTAButton
                fx="swap-up"
                variant="brand"
                size="md"
                pill
                textGradientUnified
                href="/signup"
                label={t("nav.signup")}
              />
            </>
          ) : (
            <>
              <CTAButton
                fx="swap-up"
                variant="outline"
                size="md"
                pill
                hairlineOutline
                href="/dashboard"
                label={t("Dashboard")}
              />
              <CTAButton
                fx="swap-up"
                variant="brand"
                size="md"
                pill
                textGradientUnified
                href="/dashboard/new"
                label={t("New page")}
              />
              <div id="hdr-acc-dd" className="relative">
                <button
                  onClick={() => setAccOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={accOpen}
                  className="flex size-10 items-center justify-center rounded-full ring-1 ring-inset ring-white/12 bg-black/30 text-white/90 hover:ring-cyan-300/60 transition"
                >
                  <span className="inline-flex items-center justify-center size-8 rounded-full bg-cyan-500/25 text-cyan-100 font-semibold">
                    {userInitial}
                  </span>
                </button>
                {accOpen && (
                  <div className="absolute right-0 mt-2 min-w-56 rounded-2xl border border-cyan-400/30 bg-[rgba(10,20,28,0.95)] p-2 shadow-2xl backdrop-blur">
                    <ul className="flex flex-col gap-1">
                      <li>
                        <MenuBtn label={t("Profile")} onClick={() => { setAccOpen(false); router.push("/account"); }} />
                      </li>
                      <li>
                        <MenuBtn label={t("Subscription")} onClick={() => { setAccOpen(false); router.push("/billing"); }} />
                      </li>
                      <li>
                        <MenuBtn label={t("Log out")} onClick={() => { setAccOpen(false); router.push("/logout"); }} />
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function MenuBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-white/95 transition hover:bg-white/10"
    >
      <span className="text-base">{label}</span>
      <svg
        className="size-4 opacity-70"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        aria-hidden
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  );
}