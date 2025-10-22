import React from "react";

type Props = {
  children: React.ReactNode;
};

export default function AuthLayout({ children }: Props) {
  // Minimal layout with no external imports (use this as a diagnostic)
  return <div>{children}</div>;
}