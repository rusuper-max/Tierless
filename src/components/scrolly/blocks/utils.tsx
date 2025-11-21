import React from "react";
import {
    Layers,
    Puzzle,
    SlidersHorizontal,
    ListChecks,
} from "lucide-react";
import type { AdvancedNodeKind } from "@/app/editor/[id]/panels/advanced/types";

export function renderKindIcon(kind: AdvancedNodeKind) {
    if (kind === "tier") return <Layers className="h-3.5 w-3.5" />;
    if (kind === "addon") return <Puzzle className="h-3.5 w-3.5" />;
    if (kind === "item") return <ListChecks className="h-3.5 w-3.5" />;
    return <SlidersHorizontal className="h-3.5 w-3.5" />;
}
