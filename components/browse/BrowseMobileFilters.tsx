"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import BrowseSidebarFiltersNew from "./BrowseSidebarFiltersNew";

interface CategoryNode {
  id: string;
  name: string;
  parentId: string | null;
  children?: CategoryNode[];
}

interface FilterOption {
  id: string;
  name: string;
  count?: number;
}

interface BrowseMobileFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  categoryTree: CategoryNode[];
  tags: FilterOption[];
  cuisines: FilterOption[];
  allergens: FilterOption[];
  selectedCategoryIds: string[];
  selectedTags: string[];
  selectedCuisineIds: string[];
  selectedAllergens: string[];
  selectedDifficulty: string;
  sortOption: string;
  onCategoryToggle: (categoryId: string) => void;
  onTagToggle: (tagId: string) => void;
  onCuisineToggle: (cuisineId: string) => void;
  onAllergenToggle: (allergenId: string) => void;
  onDifficultyChange: (difficulty: string) => void;
  onSortChange: (sort: string) => void;
  onClearAll: () => void;
}

export default function BrowseMobileFilters({
  isOpen,
  onClose,
  categoryTree,
  tags,
  cuisines,
  allergens,
  selectedCategoryIds,
  selectedTags,
  selectedCuisineIds,
  selectedAllergens,
  selectedDifficulty,
  sortOption,
  onCategoryToggle,
  onTagToggle,
  onCuisineToggle,
  onAllergenToggle,
  onDifficultyChange,
  onSortChange,
  onClearAll,
}: BrowseMobileFiltersProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white dark:bg-gray-900 z-50 shadow-xl overflow-y-auto lg:hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-5 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Filters
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            aria-label="Close filters"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content - Reuse sidebar filters without sticky positioning */}
        <div className="p-5">
          <BrowseSidebarFiltersNew
            categoryTree={categoryTree}
            tags={tags}
            cuisines={cuisines}
            allergens={allergens}
            selectedCategoryIds={selectedCategoryIds}
            selectedTags={selectedTags}
            selectedCuisineIds={selectedCuisineIds}
            selectedAllergens={selectedAllergens}
            selectedDifficulty={selectedDifficulty}
            sortOption={sortOption}
            onCategoryToggle={onCategoryToggle}
            onTagToggle={onTagToggle}
            onCuisineToggle={onCuisineToggle}
            onAllergenToggle={onAllergenToggle}
            onDifficultyChange={onDifficultyChange}
            onSortChange={onSortChange}
            onClearAll={onClearAll}
          />
        </div>

        {/* Apply Button */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-5">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-accent text-bg rounded-lg hover:bg-accent-hover transition font-semibold"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
