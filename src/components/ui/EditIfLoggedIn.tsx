"use client";
import { useEffect, useState } from "react";

export default function EditIfLoggedIn({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/me", { credentials: "same-origin", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => { if (alive && me?.user) setShow(true); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (!show) return null;

  return (
    <a
      href={`/editor/${slug}`}
      className={className ?? "btn btn-outline-brand"}
    >
      Edit
    </a>
  );
}