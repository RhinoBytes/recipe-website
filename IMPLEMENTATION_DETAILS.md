# Multi-Select Filter Implementation

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser URL                                  │
│  /browse?category=id1,id2&cuisines=id3,id4&tags=tag1,tag2          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  Server: app/(site)/browse/page.tsx                  │
│                                                                       │
│  1. Parse URL query params (comma-separated IDs)                     │
│  2. Get descendant category IDs for all selected categories          │
│  3. Convert cuisine IDs to names for search                          │
│  4. Call searchRecipes with expanded filters                         │
│  5. Pass data to BrowseClientPage                                    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Client: BrowseClientPage Component                      │
│                                                                       │
│  - Receives initialFilters (categoryIds[], cuisineIds[], etc.)       │
│  - Manages filter toggle handlers                                    │
│  - Uses useSearchParams() and router.replace()                       │
│  - Passes props to sidebar and mobile modal                          │
└─────────────────┬──────────────────────────────┬────────────────────┘
                  │                              │
                  ▼                              ▼
    ┌─────────────────────────┐    ┌──────────────────────────────┐
    │ BrowseSidebarFiltersNew │    │   BrowseMobileFilters        │
    │                         │    │                              │
    │ - Category checkboxes   │    │ - Renders same sidebar       │
    │ - Indeterminate state   │    │ - Identical behavior         │
    │ - Cuisine checkboxes    │    │ - Order: Cat→Cuisine→Tags    │
    │ - Section order         │    │ - Apply button closes modal  │
    └─────────────────────────┘    └──────────────────────────────┘
```

## Data Flow: Filter Toggle

```
User clicks category checkbox
         │
         ▼
CategoryItem component calls onCategoryToggle(categoryId)
         │
         ▼
BrowseClientPage.handleCategoryToggle(categoryId)
         │
         ▼
handleToggleFilter('category', categoryId)
         │
         ├─ Read current URLSearchParams
         ├─ Parse 'category' param into array
         ├─ Toggle categoryId in array
         ├─ Update URLSearchParams
         └─ router.replace(/browse?category=id1,id2)
         │
         ▼
Next.js re-renders page with new URL
         │
         ▼
Server re-executes page.tsx with new params
         │
         ▼
Results update without full page reload
```

## Indeterminate State Calculation

```typescript
// For each category node
const descendantIds = getDescendantIdsFromTree(categoryId, categoryTree);
const descendantsWithoutSelf = descendantIds.filter(id => id !== categoryId);

const isParentSelected = selectedCategoryIds.includes(categoryId);
const selectedDescendantCount = descendantsWithoutSelf.filter(
  id => selectedCategoryIds.includes(id)
).length;

const isChecked = isParentSelected && 
                  selectedDescendantCount === descendantsWithoutSelf.length;

const isIndeterminate = !isChecked && 
                        (isParentSelected || selectedDescendantCount > 0);
```

## Component Hierarchy

```
BrowseClientPage
├── BrowseSidebarFiltersNew (desktop only)
│   ├── Sort dropdown
│   ├── CollapsibleSection (Categories)
│   │   └── CategoryItem (recursive tree)
│   │       ├── Checkbox with indeterminate
│   │       ├── Expand/collapse button
│   │       └── Child CategoryItems
│   ├── CollapsibleSection (Cuisines)
│   │   └── Cuisine checkboxes
│   ├── CollapsibleSection (Tags)
│   │   └── Tag checkboxes
│   ├── CollapsibleSection (Difficulty)
│   │   └── Radio buttons
│   └── CollapsibleSection (Allergens)
│       └── Allergen checkboxes
│
└── BrowseMobileFilters (mobile only)
    ├── Modal backdrop
    ├── Slide-over panel
    ├── Header with close button
    ├── BrowseSidebarFiltersNew (reused)
    └── Apply button
```

## Key Functions

### Server-Side (lib/category-utils.ts)

```typescript
// Get descendants for multiple parent categories
getDescendantCategoryIdsForMultiple(parentIds[], prisma)
  → Returns unique union of all descendant IDs

// Get descendants from tree structure (client-side, no DB calls)
getDescendantIdsFromTree(categoryId, categoryTree)
  → Returns array of all descendant IDs including parent

// Count descendants (for indeterminate calculation)
getDescendantCount(categoryId, categoryTree)
  → Returns number of descendants (excluding parent)
```

### Client-Side (BrowseClientPage.tsx)

```typescript
// Generic filter toggle handler
handleToggleFilter(filterKey, id)
  → Parses URL params
  → Toggles id in array
  → Updates URL with router.replace
  → Resets page to 1

// Specific handlers
handleCategoryToggle(categoryId)
  → Calls handleToggleFilter('category', categoryId)

handleCuisineToggle(cuisineId)
  → Calls handleToggleFilter('cuisines', cuisineId)
```

## URL Format Examples

```
# Single category
/browse?category=desserts-id

# Multiple categories
/browse?category=desserts-id,breakfast-id,main-course-id

# Multiple cuisines
/browse?cuisines=italian-id,mexican-id

# Combined filters
/browse?category=desserts-id&cuisines=italian-id&tags=quick,easy&difficulty=EASY&sort=popular&page=2

# Empty filter (removed from URL)
/browse  (no category param)
```

## Router Strategy

- **router.replace()**: Used for filter toggles to avoid cluttering history
- **router.push()**: Used for search submission and "Clear all"
- Page param is removed/reset to 1 when any filter changes

## Accessibility Features

1. **Checkboxes**: Native `<input type="checkbox">` for keyboard support
2. **Indeterminate**: Set via `ref.indeterminate = true` and `aria-checked="mixed"`
3. **Labels**: Clickable labels wrapping checkboxes
4. **Focus indicators**: CSS focus:ring styles
5. **Expand/collapse**: Button with aria-label
6. **Keyboard**: Space toggles checkboxes, Enter/Space expands/collapses

## Performance Considerations

1. **Server-side filtering**: All filtering happens on server
2. **Client-side tree traversal**: Uses in-memory tree (no DB calls)
3. **Debouncing**: Not implemented (could be added for rapid toggles)
4. **Caching**: Category tree could be cached (suggested in comments)
5. **Pagination**: Reset to page 1 on filter change
