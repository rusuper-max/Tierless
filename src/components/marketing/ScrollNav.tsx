// src/components/marketing/ScrollNav.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  ArrowDown,
  HelpCircle,
  LogIn,
  UserPlus,
  Home,
  ChevronRight,
  User,
  ArrowLeftRight,
  Sun,
  Moon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { t } from "@/i18n";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { useTheme } from "@/hooks/useTheme";

type Side = "right" | "left";
type Sections = { faq?: string };

type ScrollNavProps = {
  side?: Side;
  sections?: Sections;
  showLogin?: boolean;
  showSignup?: boolean;
};

const LS_SIDE = "tl_nav_side";
const LS_COLLAPSED = "tl_nav_collapsed";

const EASE = "cubic-bezier(0.22,1,0.36,1)";
const DUR_BTN = 260;
const DUR_PANEL = 220;

// brand fallback boje
const BRAND1 = "var(--brand-1, #4F46E5)"; // indigo
const BRAND2 = "var(--brand-2, #22D3EE)"; // cyan

export default function ScrollNav({
  side = "right",
  sections,
  showLogin = true,
  showSignup = true,
}: ScrollNavProps) {
  const router = useRouter();
  const { authenticated: authed } = useAuthStatus();
  const { theme, toggle: toggleTheme, mounted } = useTheme();

  // persist side/collapsed
  const [currSide, setCurrSide] = useState<Side>(() =>
    typeof window === "undefined" ? side : ((localStorage.getItem(LS_SIDE) as Side) || side)
  );
  const [collapsed, setCollapsed] = useState<boolean>(() =>
    typeof window === "undefined" ? false : localStorage.getItem(LS_COLLAPSED) === "1"
  );
  useEffect(() => localStorage.setItem(LS_SIDE, currSide), [currSide]);
  useEffect(() => localStorage.setItem(LS_COLLAPSED, collapsed ? "1" : "0"), [collapsed]);

  // ui refs
  const [activeFaq, setActiveFaq] = useState<string>("");
  const [accountOpen, setAccountOpen] = useState(false);

  const isRight = currSide === "right";
  const navRef = useRef<HTMLDivElement | null>(null);
  const flyoutAccountRef = useRef<HTMLDivElement | null>(null);

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
  const closeAll = () => { setAccountOpen(false); };
  useEffect(() => {
    const close = () => closeAll();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (navRef.current?.contains(t) || flyoutAccountRef.current?.contains(t)) return;
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
  const goBottom = () => {
    closeAll();
    const h = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.body.clientHeight,
      document.documentElement.clientHeight
    );
    window.scrollTo({ top: h, behavior: "smooth" });
  };

  const smartScroll = (id: string) => {
    closeAll();

    const anchor = document.getElementById(id);
    if (anchor) return anchor.scrollIntoView({ behavior: "smooth", block: "start" });

    const stop = document.querySelector(`[data-stop="${id}"]`) as HTMLElement | null;
    if (stop) {
      const top = stop.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.12;
      return window.scrollTo({ top, behavior: "smooth" });
    }

    window.dispatchEvent(new CustomEvent("TL_JUMP", { detail: { page: id } }));
  };

  const goHome = () => { closeAll(); router.push(authed ? "/dashboard" : "/signin"); };
  const goLogin = () => { closeAll(); router.push("/signin"); };
  const goSignup = () => { closeAll(); router.push("/signin?create=1"); };
  const accountNavigate = (path: string) => { closeAll(); router.push(path); };

  type NavItem = {
    key: string;
    label: string;
    icon: any;
    onClick: () => void;
    active: boolean;
    variant: "ghost" | "primary";
  };

  // items
  const items = useMemo(
    () =>
      ([
        { key: "top",    label: t("Back to top"),   icon: ArrowUp,   onClick: goTop,    active: false, variant: "ghost" },
        { key: "bottom", label: t("Go to bottom"),  icon: ArrowDown, onClick: goBottom, active: false, variant: "ghost" },
        { key: "home",   label: authed ? t("Dashboard") : t("Home"), icon: Home, onClick: goHome, active: false, variant: "ghost" },
        sections?.faq && { key: "faq", label: t("FAQ"), icon: HelpCircle, onClick: () => smartScroll(sections.faq!), active: activeFaq === sections?.faq, variant: "ghost" },
        !authed && showLogin  && { key: "login",  label: t("Log in"),  icon: LogIn,   onClick: goLogin,  active: false, variant: "ghost" },
        !authed && showSignup && { key: "signup", label: t("Sign up"), icon: UserPlus, onClick: goSignup, active: false, variant: "primary" },
        authed && { key: "account", label: t("Account"), icon: User, onClick: () => setAccountOpen(v => !v), active: accountOpen, variant: "primary" },
        {
          key: "theme",
          label: mounted ? (theme === "dark" ? t("Light mode") : t("Dark mode")) : t("Theme"),
          icon: mounted ? (theme === "dark" ? Sun : Moon) : Sun,
          onClick: toggleTheme,
          active: false,
          variant: "ghost",
        },
      ].filter(Boolean) as NavItem[]),
    [activeFaq, authed, sections?.faq, accountOpen, showLogin, showSignup, theme, mounted]
  );

  const pillSidePos     = (right: boolean) => (right ? "right-[calc(100%-2px)]" : "left-[calc(100%-2px)]");
  const pillOriginClass = (right: boolean) => (right ? "origin-right" : "origin-left");
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

      {/* DESKTOP rail */}
      <nav
        ref={navRef}
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

        <div className="relative flex w-[84px] flex-col items-center gap-2 rounded-[42px] border border-cyan-400/45 bg-[rgba(10,20,28,0.72)] dark:bg-[rgba(12,14,18,0.85)] p-2 shadow-2xl backdrop-blur-md">
          <ul className="flex flex-col items-center gap-2">
            {items.map((item) => (
              <li key={item.key} className="w-full group">
                <button
                  onClick={() => {
                    if (item.key !== "account") setAccountOpen(false);
                    if (item.key === "account") return setAccountOpen(v => !v);
                    item.onClick();
                  }}
                  onMouseEnter={() => {
                    if (item.key !== "account") setAccountOpen(false);
                  }}
                  className={[
                    "relative flex w-full items-center justify-center rounded-full p-3 outline-none text-white/95 overflow-visible",
                    item.variant === "primary" ? "ring-1 ring-inset ring-cyan-400/80" : "ring-1 ring-inset ring-white/12",
                    item.active ? "bg-cyan-500/18" : "bg-black/25",
                  ].join(" ")}
                  style={{ transition: `transform ${DUR_BTN}ms ${EASE}, box-shadow ${DUR_BTN}ms ${EASE}, background-color ${DUR_BTN}ms ${EASE}` }}
                  aria-label={item.label}
                >
                  {/* Hover gradient outline */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    style={{
                      padding: 1.5,
                      background: `linear-gradient(90deg, ${BRAND1}, ${BRAND2})`,
                      WebkitMask:
                        "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                      WebkitMaskComposite: "xor",
                      maskComposite: "exclude",
                    }}
                  />

                  {/* Ikonica ostaje */}
                  <span suppressHydrationWarning>
                    <item.icon
                      className="size-[22px] transition-transform"
                      style={{ transitionDuration: `${DUR_BTN}ms`, transitionTimingFunction: EASE }}
                      aria-hidden
                    />
                  </span>

                  {/* Ekspanziona pilula (scaleX) */}
                  <span
                    aria-hidden
                    className={[
                      "pointer-events-none absolute top-1/2 -translate-y-1/2 transform-gpu will-change-transform",
                      pillSidePos(isRight),
                      pillOriginClass(isRight),
                      mounted ? "" : "invisible",
                      // start state
                      "scale-x-0 opacity-0",
                      // target state
                      "group-hover:scale-x-100 group-hover:opacity-100",
                      // vizuelni stil
                      "flex items-center gap-2 h-9 w-[180px] rounded-full border border-white/10 bg-black/75 dark:bg-white/10 dark:border-white/15 px-3 shadow-lg backdrop-blur",
                      "transition-transform duration-300 ease-out",
                    ].join(" ")}
                  >
                    <span className="text-[12px] uppercase tracking-wide">{item.label}</span>
                    <ChevronRight className="size-4 opacity-70" />
                  </span>

                  {/* Marker (active) */}
                  <span
                    className={[
                      "absolute h-5 w-[3px] rounded-full bg-cyan-400/90",
                      "top-1/2 -translate-y-1/2",
                      markerSideClass(isRight),
                      item.active ? "opacity-100" : "opacity-0",
                    ].join(" ")}
                    style={{ transition: `opacity ${DUR_BTN}ms ${EASE}` }}
                    aria-hidden
                  />
                </button>
              </li>
            ))}
          </ul>

          {/* Move side */}
          <div className="mt-1 flex w-full items-center justify-center">
            <button
              onClick={() => setCurrSide((s) => (s === "right" ? "left" : "right"))}
              className="group relative flex items-center justify-center rounded-full p-2 ring-1 ring-inset ring-white/12 bg-black/25 text-white/90 hover:ring-cyan-300/60 overflow-hidden"
              style={{ transition: `all ${DUR_BTN}ms ${EASE}` }}
              aria-label={t("Move bar to the other side")}
            >
              {/* Hover gradient outline */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                style={{
                  padding: 1.5,
                  background: `linear-gradient(90deg, ${BRAND1}, ${BRAND2})`,
                  WebkitMask:
                    "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                }}
              />
              <ArrowLeftRight className="size-[18px]" aria-hidden />
            </button>
          </div>

          {/* Flyout: Account */}
          {authed && accountOpen && (
            <div
              ref={flyoutAccountRef}
              onMouseLeave={() => setAccountOpen(false)}
              className={["absolute top-1/2 z-[995] -translate-y-1/2", isRight ? "right-[calc(100%-2px)]" : "left-[calc(100%-2px)]"].join(" ")}
              style={{ transition: `opacity ${DUR_PANEL}ms ${EASE}` }}
            >
              <div className="rounded-2xl border border-cyan-400/30 bg-[rgba(10,20,28,0.95)] dark:bg-[rgba(12,14,18,0.95)] p-2 shadow-2xl backdrop-blur">
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
        aria-label={t("Main quick nav")}
        className="fixed inset-x-0 bottom-0 z-[980] flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 lg:hidden"
      >
        <div className="pointer-events-none absolute inset-x-4 -top-[1px] h-[2px] bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-200 opacity-95" />
        <div className="relative flex w-full max-w-[620px] items-center justify-between gap-1 rounded-2xl border border-cyan-400/45 bg-[rgba(10,20,28,0.72)] dark:bg-[rgba(12,14,18,0.85)] px-2 py-1 shadow-2xl backdrop-blur-md">
          {items.map((item) => (
            <button
              key={`m-${item.key}`}
              onClick={() => {
                if (item.key === "account") return setAccountOpen(v => !v);
                closeAll();
                item.onClick();
              }}
              className={[
                "group relative flex h-12 flex-1 flex-col items-center justify-center rounded-xl overflow-hidden",
                item.variant === "primary" ? "ring-1 ring-inset ring-cyan-400/80" : "ring-1 ring-inset ring-white/12",
                "transition",
              ].join(" ")}
              style={{ transition: `all ${DUR_BTN}ms ${EASE}` }}
              aria-label={item.label}
            >
              {/* Hover gradient outline */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                style={{
                  padding: 1.5,
                  background: `linear-gradient(90deg, ${BRAND1}, ${BRAND2})`,
                  WebkitMask:
                    "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                }}
              />
              <span suppressHydrationWarning>
                <item.icon className="size-[20px]" aria-hidden />
              </span>
              <span className="mt-0.5 text-[11px] leading-none opacity-90">{item.label}</span>
            </button>
          ))}

          {authed && accountOpen && (
            <div className="absolute left-2 right-2 -top-2 translate-y-[-100%]">
              <div className="rounded-xl border border-cyan-400/30 bg-[rgba(10,20,28,0.95)] dark:bg-[rgba(12,14,18,0.95)] p-2 shadow-2xl backdrop-blur">
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

function FlyoutBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-white/95 hover:bg-white/10 overflow-hidden"
      style={{ transition: `background-color ${DUR_BTN}ms ${EASE}` }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          padding: 1.5,
          background: `linear-gradient(90deg, ${BRAND1}, ${BRAND2})`,
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      <span className="text-base">{label}</span>
      <ChevronRight className="size-4 opacity-70" aria-hidden />
    </button>
  );
}