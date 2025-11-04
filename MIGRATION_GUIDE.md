# Migration Guide: From Single-Select to Multi-Select Filters

This guide explains the changes made to support multi-select category and cuisine filtering.

## Breaking Changes

### URL Format

**Before:**
```
/browse?category=desserts-id        # Single category
/browse?cuisines=Italian,Mexican    # Cuisine names
```

**After:**
```
/browse?category=id1,id2,id3        # Multiple category IDs
/browse?cuisines=id1,id2            # Cuisine IDs (not names)
```

### Component Props

**BrowseSidebarFiltersNew**

Before:
```typescript
selectedCategoryId: string          // Single ID
selectedCuisines: string[]          // Cuisine names
onTagToggle: (tag: string) => void  // Tag names
```

After:
```typescript
selectedCategoryIds: string[]           // Multiple IDs
selectedCuisineIds: string[]            // Cuisine IDs
onCategoryToggle: (categoryId: string) => void  // Category IDs
onCuisineToggle: (cuisineId: string) => void    // Cuisine IDs
onTagToggle: (tagId: string) => void            // Tag IDs
```

**BrowseClientPage initialFilters**

Before:
```typescript
{
  categoryId: string          // Single category ID
  cuisines: string[]          // Cuisine names
}
```

After:
```typescript
{
  categoryIds: string[]       // Multiple category IDs
  cuisineIds: string[]        // Cuisine IDs (not names)
}
```

## Component Changes

### 1. Category Display

**Before:**
```tsx
<Link href={`/browse?category=${category.id}`}>
  {category.name}
</Link>
```

**After:**
```tsx
<label className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={isChecked || isIndeterminate}
    onChange={() => onCategoryToggle(category.id)}
  />
  <span>{category.name}</span>
</label>
```

### 2. Filter Toggle Logic

**Before:**
```typescript
const handleTagToggle = (tag: string) => {
  const newTags = selectedTags.includes(tag)
    ? selectedTags.filter(t => t !== tag)
    : [...selectedTags, tag];
  
  router.push(buildURL({ ...filters, tags: newTags }));
};
```

**After:**
```typescript
const handleToggleFilter = (filterKey: string, id: string) => {
  const params = new URLSearchParams(searchParams.entries());
  const values = (params.get(filterKey) || '').split(',').filter(Boolean);
  
  const index = values.indexOf(id);
  if (index === -1) values.push(id);
  else values.splice(index, 1);
  
  if (values.length === 0) params.delete(filterKey);
  else params.set(filterKey, values.join(','));
  
  params.delete('page'); // Reset pagination
  router.replace(`/browse?${params.toString()}`);
};
```

### 3. Server-Side Parsing

**Before:**
```typescript
const categoryFilterId = searchParams.category;
const cuisines = searchParams.cuisines?.split(",") || [];

if (categoryFilterId) {
  categoryIdsToFilter = await getDescendantCategoryIds(
    categoryFilterId, 
    prisma
  );
}
```

**After:**
```typescript
const categoryFilterIds = searchParams.category?.split(",").filter(Boolean) || [];
const cuisineFilterIds = searchParams.cuisines?.split(",").filter(Boolean) || [];

if (categoryFilterIds.length > 0) {
  categoryIdsToFilter = await getDescendantCategoryIdsForMultiple(
    categoryFilterIds,
    prisma
  );
}

if (cuisineFilterIds.length > 0) {
  const cuisinesData = await prisma.cuisine.findMany({
    where: { id: { in: cuisineFilterIds } },
    select: { name: true },
  });
  cuisineNames = cuisinesData.map(c => c.name);
}
```

## New Utility Functions

### getDescendantCategoryIdsForMultiple

```typescript
import { getDescendantCategoryIdsForMultiple } from "@/lib/category-utils";

// Get all descendants for multiple parent categories
const allDescendantIds = await getDescendantCategoryIdsForMultiple(
  ['desserts-id', 'breakfast-id'],
  prisma
);
// Returns unique union of all descendant IDs
```

### getDescendantIdsFromTree (Client-Side)

```typescript
import { getDescendantIdsFromTree } from "@/lib/category-utils";

// Get descendants from tree structure (no DB call)
const descendantIds = getDescendantIdsFromTree(
  categoryId,
  categoryTree
);
// Returns [categoryId, child1Id, child2Id, ...]
```

### getDescendantCount

```typescript
import { getDescendantCount } from "@/lib/category-utils";

// Count descendants for indeterminate state
const count = getDescendantCount(categoryId, categoryTree);
// Returns number of descendants (excluding parent)
```

## Indeterminate Checkbox State

```typescript
import { useRef, useEffect } from 'react';

function CategoryCheckbox({ category, selected, categoryTree }) {
  const checkboxRef = useRef<HTMLInputElement>(null);
  
  const descendantIds = getDescendantIdsFromTree(category.id, categoryTree);
  const descendantsWithoutSelf = descendantIds.filter(id => id !== category.id);
  
  const isSelected = selected.includes(category.id);
  const selectedDescendantCount = descendantsWithoutSelf.filter(
    id => selected.includes(id)
  ).length;
  
  const isChecked = isSelected && 
                    selectedDescendantCount === descendantsWithoutSelf.length;
  const isIndeterminate = !isChecked && 
                          (isSelected || selectedDescendantCount > 0);
  
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);
  
  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      checked={isChecked || isIndeterminate}
      aria-checked={isIndeterminate ? "mixed" : isChecked}
    />
  );
}
```

## Router Strategy

- **router.replace()**: Filter toggles (avoids history clutter)
- **router.push()**: Search submit, clear all (creates history entry)
- **Page reset**: Remove `page` param when filters change

```typescript
// Good: Use replace for toggles
const handleCategoryToggle = (id: string) => {
  updateParams();
  router.replace(newUrl);  // ✅ No history entry
};

// Good: Use push for major actions
const handleSearch = () => {
  router.push(newUrl);     // ✅ Creates history entry
};
```

## Mobile Filter Modal

The mobile modal now reuses the desktop filter component:

```tsx
<BrowseMobileFilters
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  // Pass exact same props as desktop sidebar
  categoryTree={categoryTree}
  selectedCategoryIds={selectedCategoryIds}
  onCategoryToggle={handleCategoryToggle}
  // ... all other props
/>
```

Inside the modal:
```tsx
<BrowseSidebarFiltersNew
  // Render the exact same component
  {...allSameProps}
/>
```

## Backward Compatibility

To support old URLs with single category:

```typescript
// Server-side
const rawCategory = searchParams.category;
const categoryFilterIds = rawCategory
  ? rawCategory.split(",").filter(Boolean)
  : [];

// This handles both:
// - Old: ?category=single-id
// - New: ?category=id1,id2,id3
```

## Testing Checklist

After migration, test:

- [ ] Select multiple categories → URL updates correctly
- [ ] Parent checkbox shows indeterminate when some children selected
- [ ] Deselect parent removes all descendants
- [ ] Multiple cuisines can be selected
- [ ] Filter order: Categories → Cuisines → Tags
- [ ] Mobile modal has identical behavior
- [ ] URL with filters can be bookmarked and shared
- [ ] Browser back/forward works correctly
- [ ] "Clear" buttons work for each section
- [ ] Pagination resets when filters change

## Common Issues

### Issue: Checkboxes don't show indeterminate state

**Solution:** Make sure you're using a ref and setting `indeterminate` in useEffect:

```typescript
const checkboxRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  if (checkboxRef.current) {
    checkboxRef.current.indeterminate = isIndeterminate;
  }
}, [isIndeterminate]);

<input ref={checkboxRef} type="checkbox" ... />
```

### Issue: URL has names instead of IDs

**Solution:** Check that you're passing IDs to toggle handlers, not names:

```typescript
// ❌ Wrong
onCuisineToggle(cuisine.name)

// ✅ Correct
onCuisineToggle(cuisine.id)
```

### Issue: Page doesn't update when toggling filters

**Solution:** Make sure you're using `router.replace()` and the URL is actually changing:

```typescript
const params = new URLSearchParams(searchParams.entries());
// ... update params
router.replace(`/browse?${params.toString()}`);
```

### Issue: Selected filters don't show on page load

**Solution:** Verify you're parsing URL params on the server and passing to client:

```typescript
// Server
const categoryIds = searchParams.category?.split(",").filter(Boolean) || [];

// Client
initialFilters={{ categoryIds }}
```

## Additional Resources

- See `TESTING.md` for comprehensive test cases
- See `IMPLEMENTATION_DETAILS.md` for architecture diagrams
- See `lib/category-utils.ts` for utility function documentation
