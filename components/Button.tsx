"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import React from "react";

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

type BaseProps = {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  className?: string;
  children?: React.ReactNode;
};

// Two render modes:
// - "button" -> HTMLButtonElement props
// - "link" -> Next.js Link props (anchor-like)
type ButtonAsButton = BaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
    as?: "button";
  };

type ButtonAsLink = BaseProps &
  Omit<React.ComponentPropsWithoutRef<typeof Link>, "className" | "href"> & {
    as: "link";
    href: string;
  };

type ButtonProps = ButtonAsButton | ButtonAsLink;

export default function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    loading = false,
    className = "",
    children,
    ...rest
  } = props as ButtonProps & { className?: string };

  const base =
    "inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60 disabled:pointer-events-none";
  const variants = {
    primary:
      "bg-[#d4735a] hover:bg-[#b85c42] text-white border border-transparent",
    secondary:
      "bg-[#fef9f7] text-[#b85c42] border border-[#f0d5cf] hover:bg-[#f5ede8]",
    outline:
      "bg-transparent text-[#d4735a] border-2 border-[#d4735a] hover:bg-[#f5ede8]",
  } as const;
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2 text-base",
    lg: "px-8 py-3 text-lg",
  } as const;

  const finalClass = cn(base, variants[variant], sizes[size], className);

  // Link variant
  if ((props as ButtonAsLink).as === "link") {
    const { href, ...linkRest } = rest as Omit<ButtonAsLink, "as">;
    return (
      // Next Link in Next 13+ accepts className and passes anchor props
      <Link href={href} className={finalClass} {...linkRest}>
        {loading && <Loader2 className="animate-spin w-5 h-5" />}
        {children}
      </Link>
    );
  }

  // Button variant
  const buttonRest = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button className={finalClass} {...buttonRest}>
      {loading && <Loader2 className="animate-spin w-5 h-5" />}
      {children}
    </button>
  );
}