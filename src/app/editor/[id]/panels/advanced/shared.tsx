import React from "react";

/* -----------------------------------------------------------------------------
   Shared Components
----------------------------------------------------------------------------- */
export type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "solid" | "outline" | "ghost" | "secondary";
    size?: "xs" | "sm" | "md" | "lg" | "icon";
};

export function Button({ variant = "outline", size = "md", className = "", ...props }: BtnProps) {
    const sizeCls = {
        xs: "h-7 px-2 text-xs",
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4 text-sm",
        lg: "h-11 px-5 text-base",
        icon: "h-9 w-9 p-0",
    }[size];

    const variants = {
        solid: "bg-[var(--accent)] text-white hover:brightness-110 shadow-sm",
        outline: "border border-[var(--border)] bg-transparent hover:bg-[var(--surface)] text-[var(--text)]",
        ghost: "bg-transparent hover:bg-[var(--surface)] text-[var(--text)]",
        secondary: "bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--border)]",
    };

    return (
        <button
            className={`inline-flex items-center justify-center rounded-lg font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50 disabled:pointer-events-none ${sizeCls} ${variants[variant]} ${className}`}
            {...props}
        />
    );
}

export const InlineInput = ({ value, onChange, className, placeholder, ...props }: any) => (
    <input
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        className={`bg-transparent outline-none border-b border-transparent hover:border-dashed hover:border-[var(--border)] focus:border-[var(--accent)] transition-all text-center w-full ${className}`}
        {...props}
    />
);

export const InlineTextarea = ({ value, onChange, className, placeholder }: any) => (
    <textarea
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        rows={1}
        className={`bg-transparent outline-none border-b border-transparent hover:border-dashed hover:border-[var(--border)] focus:border-[var(--accent)] transition-all text-center w-full resize-none ${className}`}
        style={{ minHeight: "1.5em" }}
        onInput={(e: any) => {
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
        }}
    />
);
