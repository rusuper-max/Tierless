"use client";
import { useState } from "react";

export default function CopyLinkButton({
  href,
  className = "btn btn-outline-brand",
  children,
}: {
  href: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      const url = typeof window !== "undefined"
        ? new URL(href, window.location.origin).toString()
        : href;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  }

  return (
    <button
      type="button"
      className={className}
      onClick={onCopy}
      aria-label="Copy public link"
    >
      {copied ? "Copied" : (children ?? "Copy link")}
    </button>
  );
}