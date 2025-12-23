"use client";

import { useEffect, useRef } from "react";
import PublicRenderer from "@/components/PublicRenderer";
import AdvancedPublicRenderer from "@/components/AdvancedPublicRenderer";
import type { CalcJson } from "@/hooks/useEditorStore";

type EmbedOptions = {
  theme: string;
  showBadge: boolean;
  transparent: boolean;
  radius: string;
};

type Props = {
  calc: CalcJson;
  pageId: string;
  options: EmbedOptions;
};

export default function EmbedPageClient({ calc, pageId, options }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Send height to parent window for auto-resize
  useEffect(() => {
    const sendHeight = () => {
      if (containerRef.current && window.parent !== window) {
        const height = containerRef.current.scrollHeight;
        window.parent.postMessage(
          {
            type: "tierless-resize",
            pageId,
            height,
          },
          "*"
        );
      }
    };

    // Initial height
    sendHeight();

    // Watch for size changes
    const observer = new ResizeObserver(() => {
      sendHeight();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // Also send on window load (images, fonts, etc.)
    window.addEventListener("load", sendHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("load", sendHeight);
    };
  }, [pageId]);

  // Apply theme override
  useEffect(() => {
    if (options.theme === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    } else if (options.theme === "dark") {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    }
    // "auto" uses the calculator's own theme setting
  }, [options.theme]);

  const editorMode = calc?.meta?.editorMode;
  const isAdvanced = editorMode === "advanced";

  // Radius classes
  const radiusClass = {
    "0": "rounded-none",
    sm: "rounded-lg",
    md: "rounded-xl",
    lg: "rounded-2xl",
    xl: "rounded-3xl",
  }[options.radius] || "rounded-xl";

  return (
    <>
      {/* Embed-specific styles */}
      <style jsx global>{`
        html, body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
          background: ${options.transparent ? "transparent" : "inherit"};
        }
        /* Hide any navigation or footers in embed mode */
        header, footer, nav, .tierless-header, .tierless-footer {
          display: none !important;
        }
      `}</style>

      <div
        ref={containerRef}
        className={`embed-container ${radiusClass} overflow-hidden`}
        style={{
          background: options.transparent ? "transparent" : undefined,
        }}
      >
        {isAdvanced ? (
          <AdvancedPublicRenderer calc={calc} embedMode hideBadge={!options.showBadge} />
        ) : (
          <div className="p-4">
            <PublicRenderer calc={calc} embedMode hideBadge={!options.showBadge} />
          </div>
        )}
      </div>
    </>
  );
}
