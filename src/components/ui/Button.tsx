"use client";

import React, { forwardRef } from "react";

/** Minimalan util (umesto clsx) */
function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type CommonProps = {
  /** outline (default), solid, plain, danger, dangerSolid, nav */
  variant?: "outline" | "solid" | "plain" | "danger" | "dangerSolid" | "nav";
  /** sm | md | lg */
  size?: "sm" | "md" | "lg";
  /** zaobljeno kao pilula */
  pill?: boolean;
  /** dodatne klase */
  className?: string;
  /** popuni blagom bojom na hover (za outline) */
  fillOnHover?: boolean;
  /** CSS-only text swap (potreban i global.css blok) */
  textSwap?: boolean;
  /** tekst koji se pojavljuje na hover; ako nije zadat, koristi children */
  swapTo?: string;
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>;

type ButtonAsAnchor = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children"> & {
    href: string;
    as?: "a";
  };

type ButtonAsButton = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: never;
    as?: "button";
  };

type Props = ButtonAsAnchor | ButtonAsButton;

const Button = forwardRef<HTMLElement, Props>(function Button(props, ref) {
  const {
    as,
    href,
    variant = "outline",
    size = "md",
    pill,
    className,
    fillOnHover,
    textSwap,
    swapTo,
    children,
    ...rest
  } = props as any;

  const isLink = !!href || as === "a";
  const Comp: any = isLink ? "a" : "button";

  const sizeCls =
    size === "lg" ? "btn-lg" : size === "sm" ? "px-2 py-1 text-[13px]" : "";

  const variantCls =
    variant === "solid"
      ? "btn-brand"
      : variant === "plain"
      ? "btn-plain"
      : variant === "nav"
      ? "btn-nav"
      : variant === "danger"
      ? "btn-danger"
      : variant === "dangerSolid"
      ? "btn-danger btn-danger--solid"
      : "btn"; // outline (default)

  const hoverFillCls = fillOnHover ? "btn-fill" : "";

  const pillCls = pill ? "btn-pill" : "";

  // Ako je textSwap aktivan, dodaj strukturu koju očekuje CSS
  const labelForSwap =
    typeof swapTo === "string"
      ? swapTo
      : typeof children === "string"
      ? children
      : "";

  const swapAttrs =
    textSwap && labelForSwap
      ? {
          "data-label": labelForSwap,
          "data-swap": "1",
        }
      : {};

  const content = textSwap ? <span className="btn-text">{children}</span> : children;

  return (
    <Comp
      ref={ref as any}
      href={href as any}
      className={cx(
        "inline-flex items-center justify-center",
        "no-underline select-none",
        variantCls,
        sizeCls,
        pillCls,
        hoverFillCls,
        textSwap && "btn-swap",
        className
      )}
      {...swapAttrs}
      {...rest}
    >
      {content}
    </Comp>
  );
});

export default Button;