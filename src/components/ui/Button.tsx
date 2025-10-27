"use client";

import Link from "next/link";
import React from "react";

type Variant = "default" | "brand" | "light" | "ghost" | "nav" | "plain" | "danger";
type Size = "sm" | "md" | "lg";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  pill?: boolean;
  className?: string;
  children?: React.ReactNode;
};

type AnchorProps = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
  };

type NativeButtonProps = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

function cls(variant: Variant = "default", size: Size = "md", pill?: boolean, extra?: string) {
  const base = ["btn"];                         // globalna .btn (outline via ::after)
  if (variant === "nav") base.push("btn-nav");
  if (variant === "brand") base.push("btn-brand");
  if (variant === "light") base.push("btn-light");
  if (variant === "ghost") base.push("btn-ghost");
  if (variant === "plain") base.push("btn-plain");
  if (variant === "danger") base.push("btn-danger");  // NOVO: crvena varijanta

  if (size === "lg") base.push("btn-lg");
  if (pill) base.push("btn-pill");

  if (extra) base.push(extra);
  return base.join(" ");
}

export default function Button(props: AnchorProps | NativeButtonProps) {
  const { variant = "default", size = "md", pill, className, children, ...rest } = props as any;

  if ("href" in props && props.href) {
    const { href, ...aProps } = rest as AnchorProps;
    return (
      <Link href={href} className={cls(variant, size, pill, className)} {...aProps}>
        {children}
      </Link>
    );
  }

  return (
    <button className={cls(variant, size, pill, className)} {...(rest as NativeButtonProps)}>
      {children}
    </button>
  );
}