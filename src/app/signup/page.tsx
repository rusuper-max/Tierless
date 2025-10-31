// src/app/signup/page.tsx
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function SignupAlias() {
  // zadržavamo "Sign up" URL, ali koristimo isti flow kao signin
  redirect("/signin?create=1");
}