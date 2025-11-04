"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, ChevronRight, X } from "lucide-react";
import { getDescendantIdsFromTree, getDescendantCount } from "@/lib/category-utils";

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

interface BrowseSidebarFiltersProps {
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

type SectionKey = "categories" | "cuisines" | "tags" | "difficulty" | "allergens";

interface CollapsibleSectionProps {
  title: string;
  sectionKey: SectionKey;
  children: React.ReactNode;
  openSection: SectionKey | null;
  onToggle: (key: SectionKey) => void;
  onClear?: () => void;
  hasActiveFilters?: boolean;
}

function CollapsibleSection({ 
  title, 
  sectionKey, 
  children, 
  openSection, 
  onToggle,
  onClear,
  hasActiveFilters = false 
}: CollapsibleSectionProps) {
  const isOpen = openSection === sectionKey;

  return (
    <div className="border-b border-border pb-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => onToggle(sectionKey)}
          className="flex items-center gap-2 text-left font-semibold font-heading text-text"
        >
          <span>{title}</span>
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {hasActiveFilters && onClear && (
          <button
            onClick={onClear}
            className="text-xs text-accent hover:text-accent-hover font-medium"
          >
            Clear
          </button>
        )}
      </div>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  );
}

interface CategoryItemProps {
  category: CategoryNode;
  selectedCategoryIds: string[];
  categoryTree: CategoryNode[];
  level: number;
  expandedCategories: Set<string>;
  onToggleExpanded: (id: string) => void;
  onCategoryToggle: (categoryId: string) => void;
}

function CategoryItem({
  category,
  selectedCategoryIds,
  categoryTree,
  level,
  expandedCategories,
  onToggleExpanded,
  onCategoryToggle,
}: CategoryItemProps) {
  const checkboxRef = useRef<HTMLInputElement>(null);
  const hasChildren = category.children && category.children.length > 0;
  const isExpanded = expandedCategories.has(category.id);
  
  // Get all descendant IDs for this category
  const descendantIds = getDescendantIdsFromTree(category.id, categoryTree);
  const descendantIdsWithoutSelf = descendantIds.filter(id => id !== category.id);
  
  // Check if this category is selected
  const isSelected = selectedCategoryIds.includes(category.id);
  
  // Count how many descendants are selected
  const selectedDescendantCount = descendantIdsWithoutSelf.filter(
    id => selectedCategoryIds.includes(id)
  ).length;
  
  // Determine checkbox state
  const isChecked = isSelected && selectedDescendantCount === descendantIdsWithoutSelf.length;
  const isIndeterminate = !isChecked && (isSelected || selectedDescendantCount > 0);
  
  // Set indeterminate state on the checkbox element
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  return (
    <div>
      <div
        className="flex items-center gap-2 p-2 rounded-lg transition hover:bg-accent-light/30"
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => onToggleExpanded(category.id)}
            className="flex-shrink-0"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            <ChevronRight
              size={16}
              className={`transform transition-transform ${
                isExpanded ? "rotate-90" : ""
              }`}
            />
          </button>
        ) : (
          <span className="w-4" />
        )}
        <label className="flex items-center gap-2 cursor-pointer flex-1">
          <input
            ref={checkboxRef}
            type="checkbox"
            checked={isChecked || isIndeterminate}
            onChange={() => onCategoryToggle(category.id)}
            className="w-4 h-4 text-accent bg-bg border-border rounded focus:ring-accent focus:ring-2"
            aria-checked={isIndeterminate ? "mixed" : isChecked}
          />
          <span className="text-sm text-text flex-1">
            {category.name}
          </span>
        </label>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {category.children?.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              selectedCategoryIds={selectedCategoryIds}
              categoryTree={categoryTree}
              level={level + 1}
              expandedCategories={expandedCategories}
              onToggleExpanded={onToggleExpanded}
              onCategoryToggle={onCategoryToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function BrowseSidebarFilters({
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
}: BrowseSidebarFiltersProps) {
  const [openSection, setOpenSection] = useState<SectionKey | null>("categories");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  const hasActiveFilters = 
    selectedCategoryIds.length > 0 ||
    selectedTags.length > 0 ||
    selectedCuisineIds.length > 0 ||
    selectedAllergens.length > 0 ||
    selectedDifficulty !== "";

  const handleSectionToggle = (key: SectionKey) => {
    setOpenSection(openSection === key ? null : key);
  };

  const handleToggleExpanded = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const clearCategories = () => {
    selectedCategoryIds.forEach(id => onCategoryToggle(id));
  };

  const clearTags = () => {
    selectedTags.forEach(tag => onTagToggle(tag));
  };

  const clearCuisines = () => {
    selectedCuisineIds.forEach(cuisine => onCuisineToggle(cuisine));
  };

  const clearAllergens = () => {
    selectedAllergens.forEach(allergen => onAllergenToggle(allergen));
  };

  return (
    <div className="bg-bg-secondary rounded-2xl shadow-md border-2 border-border p-5 sticky top-6 max-h-[calc(100vh-100px)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold font-heading text-text">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="text-sm text-accent hover:text-accent-hover font-medium flex items-center gap-1"
          >
            <X size={14} />
            Clear all
          </button>
        )}
      </div>

      {/* Sort */}
      <div className="mb-5">
        <label className="block text-sm font-semibold font-heading text-text mb-2">
          Sort By
        </label>
        <select
          value={sortOption}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full px-3 py-2 border-2 border-border rounded-2xl bg-bg text-text focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="popular">Most Popular</option>
        </select>
      </div>

      {/* Hierarchical Categories */}
      <CollapsibleSection 
        title="Categories" 
        sectionKey="categories"
        openSection={openSection}
        onToggle={handleSectionToggle}
        onClear={clearCategories}
        hasActiveFilters={selectedCategoryIds.length > 0}
      >
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {categoryTree.map((category) => (
            <CategoryItem
              key={category.id}
              category={category}
              selectedCategoryIds={selectedCategoryIds}
              categoryTree={categoryTree}
              level={0}
              expandedCategories={expandedCategories}
              onToggleExpanded={handleToggleExpanded}
              onCategoryToggle={onCategoryToggle}
            />
          ))}
        </div>
      </CollapsibleSection>

      {/* Cuisines - Now appears before Tags */}
      <CollapsibleSection 
        title="Cuisines" 
        sectionKey="cuisines"
        openSection={openSection}
        onToggle={handleSectionToggle}
        onClear={clearCuisines}
        hasActiveFilters={selectedCuisineIds.length > 0}
      >
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {cuisines.map((cuisine) => (
            <label
              key={cuisine.id}
              className="flex items-center gap-2 cursor-pointer hover:bg-accent-light/30 p-2 rounded-lg transition"
            >
              <input
                type="checkbox"
                checked={selectedCuisineIds.includes(cuisine.id)}
                onChange={() => onCuisineToggle(cuisine.id)}
                className="w-4 h-4 text-accent bg-bg border-border rounded focus:ring-accent focus:ring-2"
              />
              <span className="text-sm text-text flex-1">
                {cuisine.name}
              </span>
            </label>
          ))}
        </div>
      </CollapsibleSection>

      {/* Tags */}
      <CollapsibleSection 
        title="Tags" 
        sectionKey="tags"
        openSection={openSection}
        onToggle={handleSectionToggle}
        onClear={clearTags}
        hasActiveFilters={selectedTags.length > 0}
      >
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {tags.slice(0, 15).map((tag) => (
            <label
              key={tag.id}
              className="flex items-center gap-2 cursor-pointer hover:bg-accent-light/30 p-2 rounded-lg transition"
            >
              <input
                type="checkbox"
                checked={selectedTags.includes(tag.id)}
                onChange={() => onTagToggle(tag.id)}
                className="w-4 h-4 text-accent bg-bg border-border rounded focus:ring-accent focus:ring-2"
              />
              <span className="text-sm text-text flex-1">
                {tag.name}
              </span>
            </label>
          ))}
        </div>
      </CollapsibleSection>

      {/* Difficulty */}
      <CollapsibleSection 
        title="Difficulty" 
        sectionKey="difficulty"
        openSection={openSection}
        onToggle={handleSectionToggle}
      >
        <div className="space-y-2">
          {["EASY", "MEDIUM", "HARD"].map((difficulty) => (
            <label
              key={difficulty}
              className="flex items-center gap-2 cursor-pointer hover:bg-accent-light/30 p-2 rounded-lg transition"
            >
              <input
                type="radio"
                name="difficulty"
                checked={selectedDifficulty === difficulty}
                onChange={() => onDifficultyChange(difficulty === selectedDifficulty ? "" : difficulty)}
                className="w-4 h-4 text-accent bg-bg border-border focus:ring-accent focus:ring-2"
              />
              <span className="text-sm text-text">
                {difficulty.charAt(0) + difficulty.slice(1).toLowerCase()}
              </span>
            </label>
          ))}
        </div>
      </CollapsibleSection>

      {/* Allergens */}
      {allergens.length > 0 && (
        <CollapsibleSection 
          title="Allergens" 
          sectionKey="allergens"
          openSection={openSection}
          onToggle={handleSectionToggle}
          onClear={clearAllergens}
          hasActiveFilters={selectedAllergens.length > 0}
        >
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {allergens.map((allergen) => (
              <label
                key={allergen.id}
                className="flex items-center gap-2 cursor-pointer hover:bg-accent-light/30 p-2 rounded-lg transition"
              >
                <input
                  type="checkbox"
                  checked={selectedAllergens.includes(allergen.id)}
                  onChange={() => onAllergenToggle(allergen.id)}
                  className="w-4 h-4 text-accent bg-bg border-border rounded focus:ring-accent focus:ring-2"
                />
                <span className="text-sm text-text">
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
