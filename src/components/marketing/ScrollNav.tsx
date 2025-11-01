// src/components/marketing/ScrollNav.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  LayoutGrid,
  HelpCircle,
  LogIn,
  UserPlus,
  Home,
  ChevronRight,
  User,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { t } from "@/i18n";

type Side = "right" | "left";
type Sections = { faq?: string };
type PageLink = { id: string; label: string };

type ScrollNavProps = {
  side?: Side;
  sections?: Sections;
  pages?: PageLink[];
  showLogin?: boolean;
  showSignup?: boolean;
  /** hint za prvi render; CSR uvek proverava /api/auth/status */
  isAuthenticated?: boolean;
};

const LS_SIDE = "tl_nav_side";
const LS_COLLAPSED = "tl_nav_collapsed";

// UX konstante
const EASE = "cubic-bezier(0.22,1,0.36,1)";
const DUR_BTN = 260;
const DUR_PANEL = 220;

export default function ScrollNav({
  side = "right",
  sections,
  pages,
  showLogin = true,
  showSignup = true,
  isAuthenticated,
}: ScrollNavProps) {
  const router = useRouter();

  // persist side/collapsed
  const [currSide, setCurrSide] = useState<Side>(() =>
    typeof window === "undefined" ? side : ((localStorage.getItem(LS_SIDE) as Side) || side)
  );
  const [collapsed, setCollapsed] = useState<boolean>(() =>
    typeof window === "undefined" ? false : localStorage.getItem(LS_COLLAPSED) === "1"
  );
  useEffect(() => localStorage.setItem(LS_SIDE, currSide), [currSide]);
  useEffect(() => localStorage.setItem(LS_COLLAPSED, collapsed ? "1" : "0"), [collapsed]);

  // auth
  const [authed, setAuthed] = useState<boolean>(!!isAuthenticated);
  useEffect(() => { if (typeof isAuthenticated === "boolean") setAuthed(!!isAuthenticated); }, [isAuthenticated]);

  const refreshAuth = async (reason: string) => {
    try {
      const res = await fetch("/api/auth/status", {
        credentials: "include",
        cache: "no-store",
        headers: { "x-no-cache": String(Date.now()) },
      });
      const data = await res.json().catch(() => ({}));
      if (typeof data?.authenticated === "boolean") {
        setAuthed(!!data.authenticated);
        // console.debug("[ScrollNav]", reason, data.authenticated);
        return;
      }
    } catch {
      if (typeof document !== "undefined" && document.cookie?.includes("x-dev-email=")) {
        setAuthed(true);
      }
    }
  };

  useEffect(() => {
    let alive = true;
    refreshAuth("mount");
    const t1 = setTimeout(() => alive && refreshAuth("retry-300"), 300);
    const t2 = setTimeout(() => alive && refreshAuth("retry-1500"), 1500);

    const onChanged = () => refreshAuth("TL_AUTH_CHANGED");
    const onFocus = () => refreshAuth("window-focus");
    const onVis = () => document.visibilityState === "visible" && refreshAuth("visibility");

    window.addEventListener("TL_AUTH_CHANGED", onChanged as any);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      alive = false;
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("TL_AUTH_CHANGED", onChanged as any);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // ui state
  const [dim, setDim] = useState(false);
  const [activeFaq, setActiveFaq] = useState<string>("");
  const [pagesOpen, setPagesOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const isRight = currSide === "right";
  const navRef = useRef<HTMLDivElement | null>(null);
  const flyoutPagesRef = useRef<HTMLDivElement | null>(null);
  const flyoutAccountRef = useRef<HTMLDivElement | null>(null);

  // lista stranica: 2,3,4
  const pageList: PageLink[] = pages?.length
    ? pages
    : [
        { id: "page-2", label: t("Page 2") },
        { id: "page-3", label: t("Page 3") },
        { id: "page-4", label: t("Page 4") },
      ];

  // FAQ spy
  useEffect(() => {
    const id = sections?.faq;
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActiveFaq(e.target.id)),
      { rootMargin: "-30% 0px -60% 0px", threshold: [0, 0.25, 0.6, 1] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [sections?.faq]);

  // global close menija
  const closeAll = () => { setPagesOpen(false); setAccountOpen(false); };
  useEffect(() => {
    const close = () => closeAll();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (navRef.current?.contains(t) || flyoutPagesRef.current?.contains(t) || flyoutAccountRef.current?.contains(t)) return;
      close();
    };
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("resize", close);
    window.addEventListener("orientationchange", close);
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDocClick);
    return () => {
      window.removeEventListener("scroll", close);
      window.removeEventListener("resize", close);
      window.removeEventListener("orientationchange", close);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDocClick);
    };
  }, []);

  // akcije
  const goTop = () => { closeAll(); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const smartScroll = (id: string) => {
    closeAll();

    const anchor = document.getElementById(id);
    if (anchor) return anchor.scrollIntoView({ behavior: "smooth", block: "start" });

    const stop = document.querySelector(`[data-stop="${id}"]`) as HTMLElement | null;
    if (stop) {
      const top = stop.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.12;
      return window.scrollTo({ top, behavior: "smooth" });
    }

    const p2 = document.querySelector(".phase2-bridge") as HTMLElement | null;
    const p3 = document.querySelector(".phase3-bridge") as HTMLElement | null;

    const goEl = (el: HTMLElement, extra = 0) =>
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + extra, behavior: "smooth" });

    switch (id) {
      case "page-2": if (p2) return goEl(p2, 0); break;
      case "page-3": if (p3) return goEl(p3, 0); break;
      case "page-4":
        if (p3) {
          const extra = Math.max(p3.getBoundingClientRect().height - window.innerHeight * 0.75, 0);
          return goEl(p3, extra);
        }
        break;
    }

    window.dispatchEvent(new CustomEvent("TL_JUMP", { detail: { page: id } }));
  };

  const goHome = () => { closeAll(); router.push(authed ? "/dashboard" : "/signin"); };
  const goLogin = () => { closeAll(); router.push("/signin"); };
  const goSignup = () => { closeAll(); router.push("/signin?create=1"); };
  const accountNavigate = (path: string) => { closeAll(); router.push(path); };

  // items
  const items = useMemo(
    () =>
      [
        { key: "top",    label: t("Back to top"), icon: ArrowUp,     onClick: goTop,    active: false, variant: "ghost" },
        { key: "home",   label: authed ? t("Dashboard") : t("Home"), icon: Home,       onClick: goHome, active: false, variant: "ghost" },
        { key: "pick",   label: t("Pick a page"),  icon: LayoutGrid, onClick: () => { setAccountOpen(false); setPagesOpen(v => !v); }, active: pagesOpen, variant: "ghost" },
        sections?.faq && { key: "faq", label: t("FAQ"), icon: HelpCircle, onClick: () => smartScroll(sections.faq!), active: activeFaq === sections?.faq, variant: "ghost" },
        !authed && showLogin  && { key: "login",  label: t("Log in"),  icon: LogIn,   onClick: goLogin,  active: false, variant: "ghost" },
        !authed && showSignup && { key: "signup", label: t("Sign up"), icon: UserPlus, onClick: goSignup, active: false, variant: "primary" },
        authed && { key: "account", label: t("Account"), icon: User, onClick: () => { setPagesOpen(false); setAccountOpen(v => !v); }, active: accountOpen, variant: "primary" },
      ].filter(Boolean) as NavItem[],
    [activeFaq, authed, pagesOpen, accountOpen, sections?.faq]
  );

  const tipSideClass    = (right: boolean) => (right ? "right-[calc(100%+10px)]" : "left-[calc(100%+10px)]");
  const markerSideClass = (right: boolean) => (right ? "left-1.5" : "right-1.5");

  return (
    <>
      {/* Cyan hairline */}
      <div
        className={[
          "pointer-events-none fixed top-0 hidden h-screen w-[2px] lg:block",
          isRight ? "right-3" : "left-3",
          "bg-gradient-to-b from-cyan-400 via-cyan-300 to-cyan-200 opacity-95",
        ].join(" ")}
        aria-hidden
      />

      {/* Dim + blur */}
      <div
        className={[
          "fixed inset-0 z-[60] transition-opacity",
          dim ? "opacity-100" : "opacity-0",
          "backdrop-blur-[2px]",
        ].join(" ")}
        style={{ transitionDuration: `${DUR_PANEL}ms`, transitionTimingFunction: EASE, background: "rgba(0,0,0,0.15)", pointerEvents: "none" }}
        aria-hidden
      />

      {/* Ručka (uvećana + veći hit-area) */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className={[
          "fixed z-[9999] hidden lg:flex items-center justify-center",
          "h-14 w-8 rounded-full bg-black/40 border border-white/12 backdrop-blur text-white/80",
          "hover:text-white hover:bg-black/45",
          isRight ? "right-2" : "left-2",
          "top-1/2 -translate-y-1/2",
        ].join(" ")}
        style={{ transition: `transform ${DUR_BTN}ms ${EASE}, background-color ${DUR_BTN}ms ${EASE}` }}
        aria-label={collapsed ? t("Show nav") : t("Hide nav")}
      >
        {/* Veća klik zona */}
        <span className="absolute -inset-2" aria-hidden />
        {isRight
          ? (collapsed ? <ChevronLeft className="size-5" /> : <ChevronRightIcon className="size-5" />)
          : (collapsed ? <ChevronRightIcon className="size-5" /> : <ChevronLeft className="size-5" />)}
      </button>

      {/* DESKTOP rail */}
      <nav
        ref={navRef}
        onMouseEnter={() => setDim(true)}
        onMouseLeave={() => setDim(false)}
        aria-label={t("Main quick nav")}
        className={[
          "fixed z-[990] hidden lg:flex",
          isRight ? "right-6" : "left-6",
          "top-1/2 -translate-y-1/2",
          "transition-transform",
          collapsed ? (isRight ? "translate-x-[200%]" : "-translate-x-[200%]") : "translate-x-0",
        ].join(" ")}
        style={{ transitionDuration: `${DUR_PANEL}ms`, transitionTimingFunction: EASE }}
      >
        {/* Glow halo */}
        <div
          className={["absolute inset-0 -z-10", isRight ? "translate-x-3" : "-translate-x-3", "blur-2xl"].join(" ")}
          style={{
            width: 180, height: 360, borderRadius: 9999,
            background: "radial-gradient(60% 60% at 50% 50%, rgba(34,211,238,0.35) 0%, rgba(34,211,238,0.08) 55%, rgba(0,0,0,0) 100%)",
          }}
          aria-hidden
        />

        <div className="relative flex w-[84px] flex-col items-center gap-2 rounded-[42px] border border-cyan-400/45 bg-[rgba(10,20,28,0.72)] p-2 shadow-2xl backdrop-blur-md">
          <ul className="flex flex-col items-center gap-2">
            {items.map((item) => (
              <li key={item.key} className="w-full">
                <button
                  onClick={() => {
                    if (item.key !== "pick") setPagesOpen(false);
                    if (item.key !== "account") setAccountOpen(false);
                    if (item.key === "pick") return setPagesOpen(v => !v);
                    if (item.key === "account") return setAccountOpen(v => !v);
                    item.onClick();
                  }}
                  onMouseEnter={() => {
                    if (item.key !== "pick") setPagesOpen(false);
                    if (item.key !== "account") setAccountOpen(false);
                  }}
                  className={[
                    "group relative flex w-full items-center justify-center rounded-full p-3 outline-none text-white/95",
                    item.variant === "primary" ? "ring-1 ring-inset ring-cyan-400/80" : "ring-1 ring-inset ring-white/12",
                    item.active ? "bg-cyan-500/18" : "bg-black/25",
                  ].join(" ")}
                  style={{ transition: `transform ${DUR_BTN}ms ${EASE}, box-shadow ${DUR_BTN}ms ${EASE}, background-color ${DUR_BTN}ms ${EASE}` }}
                  aria-label={item.label}
                >
                  <item.icon className="size-[22px] transition-transform" style={{ transitionDuration: `${DUR_BTN}ms`, transitionTimingFunction: EASE }} aria-hidden />
                  {/* Tip */}
                  {item.key !== "pick" && item.key !== "account" && (
                    <span
                      className={[
                        "pointer-events-none absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-white/10 bg-black/75 px-3 py-1 text-[12px] opacity-0 backdrop-blur shadow-lg",
                        tipSideClass(isRight),
                        "group-hover:opacity-100",
                      ].join(" ")}
                      style={{ transition: `opacity ${DUR_BTN}ms ${EASE}` }}
                      role="tooltip"
                    >
                      {item.label}
                    </span>
                  )}
                  {/* Marker */}
                  <span
                    className={[
                      "absolute h-5 w-[3px] rounded-full bg-cyan-400/90",
                      "top-1/2 -translate-y-1/2",
                      markerSideClass(isRight),
                      item.active ? "opacity-100" : "opacity-0",
                    ].join(" ")}
                    style={{ transition: `opacity ${DUR_BTN}ms ${EASE}` }}
                  />
                </button>
              </li>
            ))}
          </ul>

          {/* Move side */}
          <div className="mt-1 flex w-full items-center justify-center">
            <button
              onClick={() => setCurrSide((s) => (s === "right" ? "left" : "right"))}
              className="flex items-center justify-center rounded-full p-2 ring-1 ring-inset ring-white/12 bg-black/25 text-white/90 hover:ring-cyan-300/60"
              style={{ transition: `all ${DUR_BTN}ms ${EASE}` }}
              aria-label={t("Move bar to the other side")}
            >
              <ArrowLeftRight className="size-[18px]" aria-hidden />
            </button>
          </div>

          {/* Flyout: Pick a page */}
          {pagesOpen && (
            <div
              ref={flyoutPagesRef}
              onMouseLeave={() => setPagesOpen(false)}
              className={["absolute top-1/2 z-[995] -translate-y-1/2", isRight ? "right-[calc(100%-2px)]" : "left-[calc(100%-2px)]"].join(" ")}
              style={{ transition: `opacity ${DUR_PANEL}ms ${EASE}` }}
            >
              <div className="rounded-2xl border border-cyan-400/30 bg-[rgba(10,20,28,0.95)] p-2 shadow-2xl backdrop-blur">
                <ul className="flex min-w-[220px] flex-col gap-1">
                  {pageList.map((p) => (
                    <li key={p.id}>
                      <button
                        onClick={() => smartScroll(p.id)}
                        className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-white/95 transition hover:bg-white/10"
                        style={{ transitionTimingFunction: EASE, transitionDuration: `${DUR_BTN}ms` }}
                      >
                        <span className="text-base">{p.label}</span>
                        <ChevronRight className="size-4 opacity-70" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Flyout: Account */}
          {authed && accountOpen && (
            <div
              ref={flyoutAccountRef}
              onMouseLeave={() => setAccountOpen(false)}
              className={["absolute top-1/2 z-[995] -translate-y-1/2", isRight ? "right-[calc(100%-2px)]" : "left-[calc(100%-2px)]"].join(" ")}
              style={{ transition: `opacity ${DUR_PANEL}ms ${EASE}` }}
            >
              <div className="rounded-2xl border border-cyan-400/30 bg-[rgba(10,20,28,0.95)] p-2 shadow-2xl backdrop-blur">
                <ul className="flex min-w-[220px] flex-col gap-1">
                  <li><FlyoutBtn label={t("Profile")} onClick={() => accountNavigate("/account")} /></li>
                  <li><FlyoutBtn label={t("Subscription")} onClick={() => accountNavigate("/billing")} /></li>
                  <li><FlyoutBtn label={t("Log out")} onClick={() => accountNavigate("/logout")} /></li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* MOBILE dock */}
      <nav
        onMouseEnter={() => setDim(true)}
        onMouseLeave={() => setDim(false)}
        aria-label={t("Main quick nav")}
        className="fixed inset-x-0 bottom-0 z-[980] flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 lg:hidden"
      >
        <div className="pointer-events-none absolute inset-x-4 -top-[1px] h-[2px] bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-200 opacity-95" />
        <div className="relative flex w-full max-w-[620px] items-center justify-between gap-1 rounded-2xl border border-cyan-400/45 bg-[rgba(10,20,28,0.72)] px-2 py-1 shadow-2xl backdrop-blur-md">
          {items.map((item) => (
            <button
              key={`m-${item.key}`}
              onClick={() => {
                if (item.key === "pick") return setPagesOpen(v => !v);
                if (item.key === "account") return setAccountOpen(v => !v);
                closeAll();
                item.onClick();
              }}
              className={[
                "group relative flex h-12 flex-1 flex-col items-center justify-center rounded-xl",
                item.variant === "primary" ? "ring-1 ring-inset ring-cyan-400/80" : "ring-1 ring-inset ring-white/12",
                "transition",
              ].join(" ")}
              style={{ transition: `all ${DUR_BTN}ms ${EASE}` }}
              aria-label={item.label}
            >
              <item.icon className="size-[20px]" aria-hidden />
              <span className="mt-0.5 text-[11px] leading-none opacity-90">{item.label}</span>
            </button>
          ))}

          {pagesOpen && (
            <div className="absolute left-2 right-2 -top-2 translate-y-[-100%]">
              <div className="rounded-xl border border-cyan-400/30 bg-[rgba(10,20,28,0.95)] p-2 shadow-2xl backdrop-blur">
                <ul className="flex min-w-[220px] flex-col gap-1">
                  {pageList.map((p) => (
                    <li key={p.id}>
                      <FlyoutBtn label={p.label} onClick={() => smartScroll(p.id)} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {authed && accountOpen && (
            <div className="absolute left-2 right-2 -top-2 translate-y-[-100%]">
              <div className="rounded-xl border border-cyan-400/30 bg-[rgba(10,20,28,0.95)] p-2 shadow-2xl backdrop-blur">
                <ul className="flex min-w-[220px] flex-col gap-1">
                  <li><FlyoutBtn label={t("Profile")} onClick={() => accountNavigate("/account")} /></li>
                  <li><FlyoutBtn label={t("Subscription")} onClick={() => accountNavigate("/billing")} /></li>
                  <li><FlyoutBtn label={t("Log out")} onClick={() => accountNavigate("/logout")} /></li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}

/* Helpers */
type NavItem = {
  key: string;
  label: string;
  icon: any;
  onClick: () => void;
  active: boolean;
  variant: "ghost" | "primary";
};

function FlyoutBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-white/95 hover:bg-white/10"
      style={{ transition: `background-color ${DUR_BTN}ms ${EASE}` }}
    >
      <span className="text-base">{label}</span>
      <ChevronRight className="size-4 opacity-70" />
    </button>
  );
}