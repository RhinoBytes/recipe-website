"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import React from "react";
import { cn } from "@/utils/validation";

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
    as,
    ...rest
  } = props as ButtonProps & { className?: string; as?: "button" | "link" };

  const base =
    "inline-flex items-center justify-center gap-2 font-medium rounded-2xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60 disabled:pointer-events-none";
  const variants = {
    primary:
      "bg-accent hover:bg-accent-hover text-bg border border-transparent shadow-md",
    secondary:
      "bg-bg-secondary text-text border border-border hover:bg-bg-elevated shadow-sm",
    outline:
      "bg-transparent text-accent border-2 border-accent hover:bg-accent-light",
  } as const;
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2 text-base",
    lg: "px-8 py-3 text-lg",
  } as const;

  const finalClass = cn(base, variants[variant], sizes[size], className);

  // Link variant
  if (as === "link") {
    const { href, ...linkRest } = rest as ButtonAsLink;
    return (
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