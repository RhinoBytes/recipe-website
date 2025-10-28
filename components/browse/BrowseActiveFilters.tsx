"use client";

import { X } from "lucide-react";

interface BrowseActiveFiltersProps {
  searchQuery: string;
  selectedCategories: string[];
  selectedTags: string[];
  selectedCuisines: string[];
  selectedAllergens: string[];
  selectedDifficulty: string;
  onRemoveSearch: () => void;
  onRemoveCategory: (category: string) => void;
  onRemoveTag: (tag: string) => void;
  onRemoveCuisine: (cuisine: string) => void;
  onRemoveAllergen: (allergen: string) => void;
  onRemoveDifficulty: () => void;
  onClearAll: () => void;
}

export default function BrowseActiveFilters({
  searchQuery,
  selectedCategories,
  selectedTags,
  selectedCuisines,
  selectedAllergens,
  selectedDifficulty,
  onRemoveSearch,
  onRemoveCategory,
  onRemoveTag,
  onRemoveCuisine,
  onRemoveAllergen,
  onRemoveDifficulty,
  onClearAll,
}: BrowseActiveFiltersProps) {
  const hasActiveFilters =
    searchQuery ||
    selectedCategories.length > 0 ||
    selectedTags.length > 0 ||
    selectedCuisines.length > 0 ||
    selectedAllergens.length > 0 ||
    selectedDifficulty;

  if (!hasActiveFilters) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Active Filters:
          </p>
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <FilterBadge
                label={`Search: "${searchQuery}"`}
                onRemove={onRemoveSearch}
                color="blue"
              />
            )}
            {selectedCategories.map((category) => (
              <FilterBadge
                key={category}
                label={`Category: ${category}`}
                onRemove={() => onRemoveCategory(category)}
                color="purple"
              />
            ))}
            {selectedTags.map((tag) => (
              <FilterBadge
                key={tag}
                label={`Tag: ${tag}`}
                onRemove={() => onRemoveTag(tag)}
                color="green"
              />
            ))}
            {selectedCuisines.map((cuisine) => (
              <FilterBadge
                key={cuisine}
                label={`Cuisine: ${cuisine}`}
                onRemove={() => onRemoveCuisine(cuisine)}
                color="amber"
              />
            ))}
            {selectedAllergens.map((allergen) => (
              <FilterBadge
                key={allergen}
                label={`Allergen: ${allergen}`}
                onRemove={() => onRemoveAllergen(allergen)}
                color="red"
              />
            ))}
            {selectedDifficulty && (
              <FilterBadge
                label={`Difficulty: ${selectedDifficulty.charAt(0) + selectedDifficulty.slice(1).toLowerCase()}`}
                onRemove={onRemoveDifficulty}
                color="gray"
              />
            )}
          </div>
        </div>
        <button
          onClick={onClearAll}
          className="text-sm text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 font-medium whitespace-nowrap"
        >
          Clear All
        </button>
      </div>
    </div>
  );
}

interface FilterBadgeProps {
  label: string;
  onRemove: () => void;
  color: "blue" | "purple" | "green" | "amber" | "red" | "gray";
}

function FilterBadge({ label, onRemove, color }: FilterBadgeProps) {
  const colorClasses = {
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50",
    purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50",
    green: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50",
    amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50",
    red: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50",
    gray: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600",
  };

  return (
    <button
      onClick={onRemove}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${colorClasses[color]}`}
    >
      {label}
      <X size={12} />
    </button>
  );
}
