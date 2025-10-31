// src/app/signin/page.tsx
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type SP = Record<string, string | string[] | undefined>;

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<SP>; // ⬅️ Next 16: Promise
}) {
  // Ako si već ulogovan → odmah na dashboard
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  // Unwrap searchParams
  const sp = await searchParams; // ⬅️ obavezno
  const next =
    typeof sp?.next === "string" && sp.next.startsWith("/")
      ? sp.next
      : "/dashboard";

  return (
    <main className="container-page max-w-md">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="text-sm text-neutral-500">Enter your email to continue.</p>

      {/* Čist HTML form: POST na /api/login → naš route vraća HTML sa Set-Cookie + instant redirect */}
      <form action="/api/login" method="post" className="mt-4 space-y-3">
        <input
          className="field w-full"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoFocus
        />
        <input type="hidden" name="next" value={next} />
        <button className="btn btn-brand" type="submit">
          Continue
        </button>
      </form>
    </main>
  );
}