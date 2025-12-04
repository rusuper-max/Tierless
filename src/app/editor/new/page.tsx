// src/app/editor/new/page.tsx
import { redirect } from "next/navigation";
import { getUserIdFromRequest } from "@/lib/auth";
import { headers } from "next/headers";
import * as calcsStore from "@/lib/calcsStore";
import * as fullStore from "@/lib/fullStore";
import { CALC_TEMPLATES, LOCKED_STYLES } from "@/data/calcTemplates";
import { randomBytes } from "crypto";

/** Generate a unique YouTube-style ID */
function generateId(): string {
  return randomBytes(9).toString("base64url"); // ~12 chars, URL safe
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ template?: string; name?: string }>;
};

export default async function NewEditorPage({ searchParams }: Props) {
  const params = await searchParams;
  const templateSlug = params.template;
  const customName = params.name;

  // Get user ID - if not authenticated, redirect to signin
  const headersList = await headers();
  const req = new Request("http://localhost", { headers: headersList });
  const userId = await getUserIdFromRequest(req);
  
  if (!userId) {
    const returnUrl = templateSlug 
      ? `/editor/new?template=${encodeURIComponent(templateSlug)}&name=${encodeURIComponent(customName || "")}`
      : "/editor/new";
    redirect(`/signin?next=${encodeURIComponent(returnUrl)}`);
  }

  // If template specified, load and apply it
  if (templateSlug) {
    const template = CALC_TEMPLATES.find(t => t.slug === templateSlug);
    
    if (template) {
      // Create a new page with the template data
      const pageName = customName || template.defaultName || template.name || "New Page";
      const created = await calcsStore.create(userId, pageName);
      const newSlug = created.meta.slug;

      // Check if template has advanced config (tier-based)
      const hasAdvanced = template.config.advanced?.advancedNodes?.length > 0;
      
      // Check if template is premium (locked style)
      const isPremium = template.isPremium === true;
      const lockedStyleId = isPremium ? template.config.meta?.templateStyleId : undefined;

      // Determine editor mode: advanced for tier-based, simple for list-based
      const editorMode = hasAdvanced ? "advanced" : "simple";

      // Apply template config to the new page
      const fullCalc = {
        ...template.config,
        meta: {
          ...template.config.meta,
          slug: newSlug,
          name: pageName,
          id: generateId(), // Generate unique ID, don't reuse slug
          
          // 🎯 ALWAYS set editor mode so we skip the "select editor" screen
          editorMode: editorMode,
          
          // 🔒 Premium template flags
          ...(isPremium ? {
            templateLocked: true,
            templateStyleId: lockedStyleId || templateSlug,
            templateSlug: templateSlug,
          } : {}),
          
          // Additional advanced config
          ...(hasAdvanced ? {
            advancedNodes: template.config.advanced.advancedNodes,
            advancedPublicTheme: template.config.advanced.publicTheme,
            advancedPublicTitle: template.config.advanced.publicTitle,
            advancedPublicSubtitle: template.config.advanced.publicSubtitle,
            advancedPublicDescription: template.config.advanced.publicDescription,
            advancedLayoutVariant: template.config.advanced.layoutVariant,
            advancedColumnsDesktop: template.config.advanced.columnsDesktop,
            advancedShowSummary: template.config.advanced.showSummary,
            advancedSummaryPosition: template.config.advanced.summaryPosition,
            advancedShowInquiry: template.config.advanced.showInquiry,
          } : {}),
        },
        items: template.config.items || [],
        packages: template.config.packages || [],
        fields: template.config.fields || [],
        addons: template.config.addons || [],
      };

      await fullStore.putFull(userId, newSlug, fullCalc);

      redirect(`/editor/${newSlug}`);
    }
  }

  // No template - create blank page
  const created = await calcsStore.create(userId, customName || "Untitled Page");
  redirect(`/editor/${created.meta.slug}`);
}