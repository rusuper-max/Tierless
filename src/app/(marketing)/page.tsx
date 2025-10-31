// src/app/(marketing)/page.tsx
import "@/styles/marketing.css";
import MainPhase1 from "@/components/scrolly/MainPhase1";
import MainPhase2 from "@/components/scrolly/MainPhase2";
import MainPhase3 from "@/components/scrolly/MainPhase3";
import ScrollNav from "@/components/marketing/ScrollNav";
import { t } from "@/i18n";
import { getSession } from "@/lib/session";

export const metadata = {
  title: t("Tierless — Pricing pages made simple"),
  description: t("Create a price page without a website. Share, configure, receive structured inquiries."),
};

function Anchor({ id }: { id: string }) {
  return (
    <span id={id} aria-hidden className="block h-0 w-0 overflow-hidden" style={{ scrollMarginTop: "12vh" }} />
  );
}

// minimalna varijanta (bez SSR seed-a)
export default function Page() {
  return (
    <main className="marketing-root">
      <MainPhase1 />
      <span id="page-2" className="block h-0 w-0 overflow-hidden" />
      <div className="phase2-bridge"><MainPhase2 /></div>
      <span id="page-3" className="block h-0 w-0 overflow-hidden" />
      <div className="phase3-bridge"><MainPhase3 /></div>
      <span id="page-4" className="block h-0 w-0 overflow-hidden" />
      <ScrollNav side="right" pages={[
        { id: "page-2", label: "Page 2" },
        { id: "page-3", label: "Page 3" },
        { id: "page-4", label: "Page 4" },
      ]} showLogin showSignup />
    </main>
  );
}