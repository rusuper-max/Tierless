// src/app/editor/page.tsx
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /editor index page - redirects to dashboard or signin.
 * This ensures the route exists and returns proper status codes for tests.
 */
export default async function EditorIndexPage() {
  const user = await getSessionUser();

  if (!user) {
    // Not authenticated → redirect to signin
    redirect("/signin?next=/dashboard");
  }

  // Authenticated → go to dashboard
  redirect("/dashboard");
}

