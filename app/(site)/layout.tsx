// app/(site)/layout.tsx
import React from "react";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <>
      {/* Fixed spacer that matches navbar height - always renders immediately */}
      <div className="h-20 flex-shrink-0" aria-hidden="true" />
      {children}
    </>
}
