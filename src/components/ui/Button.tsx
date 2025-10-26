"use client";

import * as React from "react";

type Variant = "solid" | "subtle" | "ghost" | "grad-outline";
type Size = "sm" | "md" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  as?: React.ElementType; // ako želiš <a> kao dugme
};

function cn(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * Shared Button — normalizuje stilove i donosi stalni outline.
 * Default: variant="solid", size="md"
 */
export default function Button({
  className,
  variant = "solid",
  size = "md",
  as: Comp = "button",
  ...props
}: ButtonProps) {
  const variantClass =
    variant === "solid" ? "btn--solid" :
    variant === "subtle" ? "btn--subtle" :
    variant === "ghost" ? "btn--ghost" :
    "btn--grad-outline";

  const sizeClass =
    size === "sm" ? "btn--sm" :
    size === "lg" ? "btn--lg" : "btn--md";

  return (
    <Comp
      className={cn("btn", variantClass, sizeClass, className)}
      {...props}
    />
  );
}