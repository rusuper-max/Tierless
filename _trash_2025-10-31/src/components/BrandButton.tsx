// src/components/BrandButton.tsx
"use client";
import * as React from "react";

function cn(...cls: Array<string | undefined | null | false>) {
  return cls.filter(Boolean).join(" ");
}

type Variant = "plain" | "brand" | "outline";
type Size = "sm" | "md" | "lg";

export interface BrandButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  pill?: boolean;
}

const BASE =
  "btn inline-flex items-center justify-center select-none whitespace-nowrap font-medium transition-colors outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none border";

const VARIANT: Record<Variant, string> = {
  plain:  "bg-white border-[color-mix(in_oklab,var(--brand-1),transparent_70%)] hover:bg-[#fafafa]",
  outline:"bg-transparent border-[color-mix(in_oklab,var(--brand-1),transparent_40%)] hover:bg-[color-mix(in_oklab,var(--brand-1),transparent_92%)]",
  brand:  "bg-[color-mix(in_oklab,var(--brand-1),transparent_88%)] border-[color-mix(in_oklab,var(--brand-1),transparent_55%)] hover:bg-[color-mix(in_oklab,var(--brand-1),transparent_82%)]",
};

const SIZE: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-xl",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-12 px-6 text-base rounded-2xl",
};

export default function BrandButton({
  className,
  variant = "plain",
  size = "md",
  pill = false,
  ...props
}: BrandButtonProps) {
  return (
    <button
      className={cn(BASE, VARIANT[variant], SIZE[size], pill && "rounded-full", className)}
      {...props}
    />
  );
}