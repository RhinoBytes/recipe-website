"use client";

import { useState, useRef, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";

interface MultiSelectOption {
  id: string;
  name: string;
  parentId?: string | null;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  label?: string;
}

export default function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  label,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Flatten for display, showing only leaf nodes (children) for selection
  const selectableOptions = options.filter(opt => {
    // If it has children, it's a parent and shouldn't be directly selectable
    const hasChildren = options.some(o => o.parentId === opt.id);
    return !hasChildren;
  });

  // Filter options based on search
  const filteredOptions = selectableOptions.filter((option) =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOptions = options.filter((opt) => selected.includes(opt.name));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionName: string) => {
    if (selected.includes(optionName)) {
      onChange(selected.filter((s) => s !== optionName));
    } else {
      onChange([...selected, optionName]);
    }
  };

  const handleRemove = (optionName: string) => {
    onChange(selected.filter((s) => s !== optionName));
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-text mb-2">
          {label}
        </label>
      )}

      {/* Selected Items Display */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="min-h-[42px] w-full px-3 py-2 bg-bg border border-border rounded-lg cursor-pointer hover:border-accent transition-colors"
      >
        {selectedOptions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedOptions.map((option) => (
              <span
                key={option.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent rounded-md text-sm"
              >
                {option.name}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(option.name);
                  }}
                  className="hover:text-accent-dark"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <div className="text-text-muted flex items-center justify-between">
            <span>{placeholder}</span>
            <ChevronDown
              size={18}
              className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-bg border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {/* Search Input */}
          <div className="p-2 border-b border-border sticky top-0 bg-bg">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options List */}
          <div className="p-2">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => handleSelect(option.name)}
                  className={`px-3 py-2 rounded-md cursor-pointer transition-colors ${
                    selected.includes(option.name)
                      ? "bg-accent/20 text-accent font-medium"
                      : "hover:bg-bg-secondary text-text"
                  }`}
                >
                  {option.name}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-text-muted text-sm">
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
