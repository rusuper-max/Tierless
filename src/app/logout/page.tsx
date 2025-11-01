"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await fetch("/api/logout", { method: "POST", credentials: "same-origin", cache: "no-store" });
      } catch {}

      // Obavesti sve CSR header/rail komponente da refetch-uju status
      try { window.dispatchEvent(new CustomEvent("TL_AUTH_CHANGED")); } catch {}

      if (alive) {
        router.replace("/");
        router.refresh();
      }
    })();
    return () => { alive = false; };
  }, [router]);

  return (
    <main className="mx-auto max-w-xl p-6">
      <p className="text-sm text-neutral-600">Signing you out…</p>
    </main>
  );
}