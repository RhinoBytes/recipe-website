"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ChevronRight, X } from "lucide-react";
import Link from "next/link";

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
  selectedCategoryId: string;
  selectedTags: string[];
  selectedCuisines: string[];
  selectedAllergens: string[];
  selectedDifficulty: string;
  sortOption: string;
  onTagToggle: (tag: string) => void;
  onCuisineToggle: (cuisine: string) => void;
  onAllergenToggle: (allergen: string) => void;
  onDifficultyChange: (difficulty: string) => void;
  onSortChange: (sort: string) => void;
  onClearAll: () => void;
}

type SectionKey = "categories" | "tags" | "cuisines" | "difficulty" | "allergens";

interface CollapsibleSectionProps {
  title: string;
  sectionKey: SectionKey;
  children: React.ReactNode;
  openSection: SectionKey | null;
  onToggle: (key: SectionKey) => void;
}

function CollapsibleSection({ title, sectionKey, children, openSection, onToggle }: CollapsibleSectionProps) {
  const isOpen = openSection === sectionKey;

  return (
    <div className="border-b border-border pb-4 mb-4">
      <button
        onClick={() => onToggle(sectionKey)}
        className="flex items-center justify-between w-full text-left font-semibold font-heading text-text mb-2"
      >
        <span>{title}</span>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  );
}

interface CategoryItemProps {
  category: CategoryNode;
  selectedCategoryId: string;
  level: number;
  expandedCategories: Set<string>;
  onToggleExpanded: (id: string) => void;
}

function CategoryItem({
  category,
  selectedCategoryId,
  level,
  expandedCategories,
  onToggleExpanded,
}: CategoryItemProps) {
  const hasChildren = category.children && category.children.length > 0;
  const isExpanded = expandedCategories.has(category.id);
  const isSelected = selectedCategoryId === category.id;

  return (
    <div>
      <div
        className={`flex items-center gap-2 p-2 rounded-lg transition ${
          isSelected ? "bg-accent-light/50" : "hover:bg-accent-light/30"
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => onToggleExpanded(category.id)}
            className="flex-shrink-0"
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
        <Link
          href={`/browse?category=${category.id}`}
          className={`text-sm flex-1 ${
            isSelected ? "font-semibold text-accent" : "text-text"
          }`}
        >
          {category.name}
        </Link>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {category.children?.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              selectedCategoryId={selectedCategoryId}
              level={level + 1}
              expandedCategories={expandedCategories}
              onToggleExpanded={onToggleExpanded}
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
  selectedCategoryId,
  selectedTags,
  selectedCuisines,
  selectedAllergens,
  selectedDifficulty,
  sortOption,
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
    selectedCategoryId !== "" ||
    selectedTags.length > 0 ||
    selectedCuisines.length > 0 ||
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
      >
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {categoryTree.map((category) => (
            <CategoryItem
              key={category.id}
              category={category}
              selectedCategoryId={selectedCategoryId}
              level={0}
              expandedCategories={expandedCategories}
              onToggleExpanded={handleToggleExpanded}
            />
          ))}
        </div>
      </CollapsibleSection>

      {/* Tags */}
      <CollapsibleSection 
        title="Tags" 
        sectionKey="tags"
        openSection={openSection}
        onToggle={handleSectionToggle}
      >
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {tags.slice(0, 15).map((tag) => (
            <label
              key={tag.id}
              className="flex items-center gap-2 cursor-pointer hover:bg-accent-light/30 p-2 rounded-lg transition"
            >
              <input
                type="checkbox"
                checked={selectedTags.includes(tag.name)}
                onChange={() => onTagToggle(tag.name)}
                className="w-4 h-4 text-accent bg-bg border-border rounded focus:ring-accent focus:ring-2"
              />
              <span className="text-sm text-text flex-1">
                {tag.name}
              </span>
            </label>
          ))}
        </div>
      </CollapsibleSection>

      {/* Cuisines */}
      <CollapsibleSection 
        title="Cuisines" 
        sectionKey="cuisines"
        openSection={openSection}
        onToggle={handleSectionToggle}
      >
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {cuisines.map((cuisine) => (
            <label
              key={cuisine.id}
              className="flex items-center gap-2 cursor-pointer hover:bg-accent-light/30 p-2 rounded-lg transition"
            >
              <input
                type="checkbox"
                checked={selectedCuisines.includes(cuisine.name)}
                onChange={() => onCuisineToggle(cuisine.name)}
                className="w-4 h-4 text-accent bg-bg border-border rounded focus:ring-accent focus:ring-2"
              />
              <span className="text-sm text-text flex-1">
                {cuisine.name}
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
        >
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {allergens.map((allergen) => (
              <label
                key={allergen.id}
                className="flex items-center gap-2 cursor-pointer hover:bg-accent-light/30 p-2 rounded-lg transition"
              >
                <input
                  type="checkbox"
                  checked={selectedAllergens.includes(allergen.name)}
                  onChange={() => onAllergenToggle(allergen.name)}
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
