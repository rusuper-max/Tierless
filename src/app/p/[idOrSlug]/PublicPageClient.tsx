"use client";

import PublicRenderer from "@/components/PublicRenderer";
import AdvancedPublicRenderer from "@/components/AdvancedPublicRenderer";
import type { CalcJson } from "@/hooks/useEditorStore";

export default function PublicPageClient({ calc }: { calc: CalcJson }) {
  // Check editor mode from meta
  const editorMode = calc?.meta?.editorMode;

  // Use Advanced renderer if mode is "advanced", otherwise use Simple renderer
  if (editorMode === "advanced") {
    return <AdvancedPublicRenderer calc={calc} />;
  }

  // Default to simple mode (backward compatible with old calculators)
  return <PublicRenderer calc={calc} />;
}
