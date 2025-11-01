// src/app/dev/layout.tsx
import { notFound } from "next/navigation";

export default function DevLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_DEV !== "true") {
    notFound();
  }
  return children;
}