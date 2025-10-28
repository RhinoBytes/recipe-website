"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";

interface FilterOption {
  id: string;
  name: string;
  count?: number;
}

interface BrowseSidebarFiltersProps {
  categories: FilterOption[];
  tags: FilterOption[];
  cuisines: FilterOption[];
  allergens: FilterOption[];
  selectedCategories: string[];
  selectedTags: string[];
  selectedCuisines: string[];
  selectedAllergens: string[];
  selectedDifficulty: string;
  sortOption: string;
  onCategoryToggle: (category: string) => void;
  onTagToggle: (tag: string) => void;
  onCuisineToggle: (cuisine: string) => void;
  onAllergenToggle: (allergen: string) => void;
  onDifficultyChange: (difficulty: string) => void;
  onSortChange: (sort: string) => void;
  onClearAll: () => void;
}

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, children, defaultOpen = true }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left font-semibold text-gray-900 dark:text-white mb-2"
      >
        <span>{title}</span>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  );
}

export default function BrowseSidebarFilters({
  categories,
  tags,
  cuisines,
  allergens,
  selectedCategories,
  selectedTags,
  selectedCuisines,
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
}: BrowseSidebarFiltersProps) {
  const hasActiveFilters = 
    selectedCategories.length > 0 ||
    selectedTags.length > 0 ||
    selectedCuisines.length > 0 ||
    selectedAllergens.length > 0 ||
    selectedDifficulty !== "";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 sticky top-6 max-h-[calc(100vh-100px)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="text-sm text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 font-medium flex items-center gap-1"
          >
            <X size={14} />
            Clear all
          </button>
        )}
      </div>

      {/* Sort */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Sort By
        </label>
        <select
          value={sortOption}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="popular">Most Popular</option>
        </select>
      </div>

      {/* Categories */}
      <CollapsibleSection title="Categories">
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {categories.map((category) => (
            <label
              key={category.id}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition"
            >
              <input
                type="checkbox"
                checked={selectedCategories.includes(category.name)}
                onChange={() => onCategoryToggle(category.name)}
                className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 dark:focus:ring-amber-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                {category.name}
              </span>
              {category.count !== undefined && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {category.count}
                </span>
              )}
            </label>
          ))}
        </div>
      </CollapsibleSection>

      {/* Tags */}
      <CollapsibleSection title="Tags">
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {tags.slice(0, 15).map((tag) => (
            <label
              key={tag.id}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition"
            >
              <input
                type="checkbox"
                checked={selectedTags.includes(tag.name)}
                onChange={() => onTagToggle(tag.name)}
                className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 dark:focus:ring-amber-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                {tag.name}
              </span>
              {tag.count !== undefined && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {tag.count}
                </span>
              )}
            </label>
          ))}
        </div>
      </CollapsibleSection>

      {/* Cuisines */}
      <CollapsibleSection title="Cuisines">
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {cuisines.map((cuisine) => (
            <label
              key={cuisine.id}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition"
            >
              <input
                type="checkbox"
                checked={selectedCuisines.includes(cuisine.name)}
                onChange={() => onCuisineToggle(cuisine.name)}
                className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 dark:focus:ring-amber-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                {cuisine.name}
              </span>
              {cuisine.count !== undefined && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {cuisine.count}
                </span>
              )}
            </label>
          ))}
        </div>
      </CollapsibleSection>

      {/* Difficulty */}
      <CollapsibleSection title="Difficulty">
        <div className="space-y-2">
          {["EASY", "MEDIUM", "HARD"].map((difficulty) => (
            <label
              key={difficulty}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition"
            >
              <input
                type="radio"
                name="difficulty"
                checked={selectedDifficulty === difficulty}
                onChange={() => onDifficultyChange(difficulty === selectedDifficulty ? "" : difficulty)}
                className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 focus:ring-amber-500 dark:focus:ring-amber-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {difficulty.charAt(0) + difficulty.slice(1).toLowerCase()}
              </span>
            </label>
          ))}
        </div>
      </CollapsibleSection>

      {/* Allergens */}
      {allergens.length > 0 && (
        <CollapsibleSection title="Allergens" defaultOpen={false}>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {allergens.map((allergen) => (
              <label
                key={allergen.id}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition"
              >
                <input
                  type="checkbox"
                  checked={selectedAllergens.includes(allergen.name)}
                  onChange={() => onAllergenToggle(allergen.name)}
                  className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 dark:focus:ring-amber-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {allergen.name}
                </span>
              </label>
            ))}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}
