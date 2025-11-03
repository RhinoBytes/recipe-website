// app/(dashboard)/layout.tsx
import React from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>
  <div className="h-20 flex-shrink-0" aria-hidden="true" />
  {children}
  </>;
}
