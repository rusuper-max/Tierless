"use client";

import PublicRenderer from "@/components/PublicRenderer";
import type { CalcJson } from "@/hooks/useEditorStore";

export default function PublicPageClient({ calc }: { calc: CalcJson }) {
  return <PublicRenderer calc={calc} />;
}
