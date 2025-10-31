"use client";
import { useEffect } from "react";

export default function LogoutPage() {
  useEffect(() => {
    (async () => {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
      window.location.replace("/");
    })();
  }, []);
  return <main className="container-page">Logging out…</main>;
}