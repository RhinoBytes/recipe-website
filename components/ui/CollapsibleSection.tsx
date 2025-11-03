"use client";

import { useState, ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
}

export default function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  badge,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-bg-secondary rounded-lg shadow-md overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-bg/50 dark:hover:bg-bg-elevated transition-colors"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-text">{title}</h2>
          {badge !== undefined && (
            <span className="px-2 py-1 text-xs font-medium bg-accent/20 text-accent rounded-full">
              {badge}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="text-text-secondary" size={20} />
        ) : (
          <ChevronDown className="text-text-secondary" size={20} />
        )}
      </button>
      {isOpen && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}
