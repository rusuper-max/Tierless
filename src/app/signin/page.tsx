// src/app/signin/page.tsx  (Server Component wrapper)
import { Suspense } from "react";
import SignInClient from "./signin-client";

export const dynamic = "force-dynamic"; // da izbegnemo prerender error

export default function SignInPage() {
  return (
    <Suspense fallback={<main className="p-6">Loading…</main>}>
      <SignInClient />
    </Suspense>
  );
}