# Testing Guide: Hierarchical Category Filtering

## Overview
This guide explains how to test the new hierarchical category filtering functionality on the browse page.

## Prerequisites
1. Database must be seeded with the updated recipe data
2. Run: `npm run seed`
3. Start the development server: `npm run dev`

## Test Scenarios

### 1. Basic Browse Page Load
**Steps:**
1. Navigate to `/browse`
2. Verify all recipes are displayed
3. Check that the category filter sidebar shows hierarchical structure

**Expected Results:**
- All published recipes are displayed in a grid
- Categories are organized in a tree structure with collapsible parent categories
- Example hierarchy visible:
  - By Meal Type
    - Breakfast & Brunch
    - Main Course
    - Desserts
      - Cakes & Cupcakes
      - Cookies & Bars
      - Pies & Tarts
      - etc.

### 2. Parent Category Filtering
**Steps:**
1. Navigate to `/browse`
2. Click on a parent category (e.g., "Desserts")
3. Observe the results

**Expected Results:**
- All recipes tagged with "Desserts" OR any of its child categories are shown
- This includes recipes with:
  - "Desserts"
  - "Cakes & Cupcakes" 
  - "Cookies & Bars"
  - "Pies & Tarts"
  - "Frozen Desserts"
  - "Candy & Confections"
- The URL updates to `/browse?category={category-id}`
- The selected category is highlighted in the sidebar

**Example Recipes Expected:**
- Apple Pie (Desserts, Pies & Tarts)
- Classic Chocolate Chip Cookies (Desserts, Cookies & Bars)
- Vanilla Cupcakes (Desserts, Cakes & Cupcakes)
- Churros (Desserts, Candy & Confections)

### 3. Child Category Filtering
**Steps:**
1. Navigate to `/browse`
2. Expand "Desserts" if collapsed
3. Click on a child category (e.g., "Cookies & Bars")
4. Observe the results

**Expected Results:**
- Only recipes tagged with "Cookies & Bars" (and its descendants if any) are shown
- This is more specific than filtering by parent "Desserts"
- URL updates to `/browse?category={cookies-bars-id}`

**Example Recipes Expected:**
- Classic Chocolate Chip Cookies (tagged with "Cookies & Bars")

### 4. Multi-level Hierarchy
**Steps:**
1. Navigate to `/browse`
2. Click on "By Meal Type" (top-level parent)
3. Observe all recipes that fall under any meal type category

**Expected Results:**
- Recipes from all meal type subcategories are shown:
  - Breakfast & Brunch
  - Main Course
  - Desserts (and all its children)
  - Side Dishes
  - Salads
  - etc.

### 5. Combining with Other Filters
**Steps:**
1. Navigate to `/browse`
2. Select a category (e.g., "Main Course")
3. Add a tag filter (e.g., "Quick & Easy")
4. Add a difficulty filter (e.g., "EASY")

**Expected Results:**
- Results are filtered by ALL selected criteria (AND logic)
- Only recipes matching:
  - Main Course (or any of its children)
  - AND tagged with "Quick & Easy"
  - AND difficulty is EASY
- URL parameters include all filters: `/browse?category={id}&tags=Quick+%26+Easy&difficulty=EASY`

### 6. Search with Category Filter
**Steps:**
1. Navigate to `/browse`
2. Enter a search term (e.g., "chicken")
3. Select a category (e.g., "Poultry")

**Expected Results:**
- Results match search query AND category filter
- Only recipes with "chicken" in title/description/ingredients
- AND tagged with "Poultry (Chicken, Turkey)" or its children
- URL: `/browse?q=chicken&category={poultry-id}`

**Example Recipes Expected:**
- Chicken Enchiladas Verde
- Grilled Chicken Caesar Salad

### 7. Category Tree Expansion
**Steps:**
1. Navigate to `/browse`
2. Click the arrow next to a parent category
3. Verify child categories are shown/hidden

**Expected Results:**
- Clicking the arrow toggles the visibility of child categories
- The arrow rotates to indicate expanded/collapsed state
- Child categories are indented to show hierarchy
- Multiple parent categories can be expanded simultaneously

### 8. URL Direct Access
**Steps:**
1. Get a category ID from the database or by selecting a category
2. Navigate directly to `/browse?category={category-id}`

**Expected Results:**
- Page loads with the category filter applied
- Recipes matching the category (and its descendants) are shown
- The selected category is highlighted in the sidebar
- The parent categories are auto-expanded to show the selected category

### 9. Clear Filters
**Steps:**
1. Apply multiple filters (category, tags, difficulty)
2. Click "Clear all filters" button

**Expected Results:**
- All filters are removed
- URL returns to `/browse`
- All recipes are shown again

### 10. Pagination with Filters
**Steps:**
1. Select a category with many recipes
2. Navigate to page 2
3. Change category filter
4. Verify page resets to 1

**Expected Results:**
- Pagination works correctly with filters applied
- URL includes both category and page: `/browse?category={id}&page=2`
- Changing filters resets to page 1
- Total count reflects filtered results

## Verification of Seed Data

### Check Recipe-to-Category Assignments
To verify recipes are properly assigned to hierarchical categories:

```sql
-- Check all recipes and their categories
SELECT 
  r.title,
  STRING_AGG(c.name, ', ') as categories
FROM "Recipe" r
LEFT JOIN "RecipesCategories" rc ON r.id = rc."recipeId"
LEFT JOIN "Category" c ON rc."categoryId" = c.id
GROUP BY r.id, r.title
ORDER BY r.title;
```

### Expected Assignments:
- **Apple Cinnamon Muffins**: Breakfast & Brunch, Quick Breads, Baking, Appetizers & Snacks
- **Apple Pie**: Desserts, Pies & Tarts, Baking, Holidays
- **Authentic Street Tacos**: Main Course, Meat (Beef, Pork, Lamb), Weeknight Dinners, Grilling & BBQ
- **BBQ Ribs**: Main Course, Meat (Beef, Pork, Lamb), Grilling & BBQ, Slow Cooking, Parties & Potlucks
- **Chicken Enchiladas Verde**: Main Course, Poultry (Chicken, Turkey), Weeknight Dinners
- **Churros**: Desserts, Candy & Confections, No-Cook
- **Classic Beef Burger**: Sandwiches, Wraps, & Burgers, Main Course, Meat (Beef, Pork, Lamb), Grilling & BBQ, Weeknight Dinners
- **Classic Chocolate Chip Cookies**: Desserts, Cookies & Bars, Baking, Appetizers & Snacks
- **Grilled Chicken Caesar Salad**: Salads, Main Course, Poultry (Chicken, Turkey), Weeknight Dinners
- **Homemade Guacamole**: Appetizers & Snacks, Dips & Spreads, No-Cook
- **Homemade Sourdough Bread**: Breads & Baking, Artisan Breads, Baking
- **Lemon Blueberry Scones**: Breakfast & Brunch, Quick Breads, Baking
- **Mac and Cheese**: Main Course, Side Dishes, Pasta & Noodles, Weeknight Dinners
- **Mexican Rice**: Side Dishes, Weeknight Dinners
- **Vanilla Cupcakes**: Desserts, Cakes & Cupcakes, Baking, Parties & Potlucks

## Technical Implementation Notes

### Server-Side Filtering
- Category filtering is handled server-side in `app/(site)/browse/page.tsx`
- The `getDescendantCategoryIds` function recursively finds all child categories
- All descendant IDs are passed to the `searchRecipes` function for filtering

### Category Tree Building
- `buildCategoryTree` transforms flat category list into nested structure
- Tree is built server-side and passed to client component
- Client component handles UI interactions (expand/collapse, navigation)

### URL State Management
- All filter state is stored in URL query parameters
- Changing filters triggers navigation with new URL
- Server component re-fetches data based on new parameters
- This ensures:
  - Bookmarkable URLs
  - Browser back/forward works correctly
  - Server-side rendering with correct filtered data

## Performance Considerations

1. **Recursive Queries**: The `getDescendantCategoryIds` function makes multiple database queries. For deep hierarchies, consider optimizing with:
   - Materialized path or nested set models
   - Caching category hierarchies

2. **Server-Side Rendering**: All filtering happens server-side, which:
   - Improves SEO
   - Reduces client-side JavaScript
   - Ensures data accuracy
   - May increase server load for complex filters

## Known Limitations

1. ~~**Mobile Filters**: The mobile filter modal is not yet implemented (placeholder alert shown)~~ **IMPLEMENTED** - Mobile filters now fully functional
2. **Active Filters Display**: Simplified version showing only "Clear all" button
3. **Category Count**: Recipe counts per category are not yet displayed
4. **Deep Linking**: Direct access with category ID works, but category name would be more user-friendly

## Multi-Select Filter Updates (Latest)

### New Features
1. **Multi-Select Categories**: Users can now select multiple categories simultaneously using checkboxes
2. **Multi-Select Cuisines**: Cuisines now use checkbox-based multi-select (like categories)
3. **Indeterminate State**: Parent category checkboxes show indeterminate state when some (but not all) children are selected
4. **Filter Order**: Filters now appear in order: Categories → Cuisines → Tags → Difficulty → Allergens
5. **Client-Side Navigation**: Filter toggles use `router.replace` to avoid polluting browser history
6. **Mobile Parity**: Mobile filter modal has identical behavior to desktop sidebar
7. **Clear Buttons**: Each filter section has its own "Clear" button

### URL Format
- **Categories**: `?category=id1,id2,id3` (comma-separated category IDs)
- **Cuisines**: `?cuisines=id1,id2` (comma-separated cuisine IDs)
- **Tags**: `?tags=tag1,tag2` (comma-separated tag names)
- **Allergens**: `?allergens=allergen1,allergen2` (comma-separated allergen names)
- **Difficulty**: `?difficulty=EASY` (single value)
- **Sort**: `?sort=newest` (single value)
- **Page**: `?page=2` (resets to 1 when filters change)

### Testing Multi-Select Categories

**Test Case 1: Select Multiple Categories**
1. Navigate to `/browse`
2. Expand a parent category (e.g., "Desserts")
3. Click checkbox for "Cookies & Bars"
4. Click checkbox for "Pies & Tarts"
5. Verify URL contains: `?category=<cookies-id>,<pies-id>`
6. Verify results show recipes from both categories

**Test Case 2: Indeterminate State**
1. Navigate to `/browse`
2. Expand "Desserts" category
3. Select only "Cookies & Bars" child
4. Verify parent "Desserts" checkbox shows indeterminate state (dash/mixed)
5. Click parent "Desserts" checkbox
6. Verify all dessert categories are selected (parent + all children)
7. Verify URL includes all descendant category IDs

**Test Case 3: Deselect Parent Removes Children**
1. Select parent category with children
2. Verify all descendants appear in results
3. Deselect the parent category
4. Verify only that parent and its descendants are removed
5. Other selected categories remain selected

**Test Case 4: Multi-Select Cuisines**
1. Navigate to `/browse`
2. Select "Italian" cuisine checkbox
3. Select "Mexican" cuisine checkbox
4. Verify URL contains: `?cuisines=<italian-id>,<mexican-id>`
5. Verify results show recipes from both cuisines

**Test Case 5: Filter Combination**
1. Select multiple categories (e.g., "Breakfast & Brunch", "Main Course")
2. Select multiple cuisines (e.g., "Italian", "Mexican")
3. Select multiple tags (e.g., "Quick & Easy", "Vegetarian")
4. Verify URL contains all selected filters
5. Verify results match ALL selected criteria (AND logic within category, OR between filter types)
6. Click "Clear all" and verify all filters are removed

**Test Case 6: Mobile Filter Modal**
1. Resize browser to mobile width (< 1024px) or use mobile device
2. Click "Filters" button
3. Modal opens showing identical filter UI
4. Select multiple categories using checkboxes
5. Select cuisines (should appear above tags)
6. Click "Apply Filters"
7. Modal closes and URL updates with selected filters
8. Verify results match selected filters

**Test Case 7: Client-Side Navigation**
1. Navigate to `/browse`
2. Select a category
3. Verify URL changes without full page reload (no flicker)
4. Use browser back button
5. Verify you can navigate back through filter changes
6. Toggle multiple filters rapidly
7. Verify history doesn't get cluttered (using router.replace)

**Test Case 8: Section Clear Buttons**
1. Select multiple categories
2. Select multiple cuisines
3. Select multiple tags
4. Click "Clear" button in Categories section
5. Verify only categories are cleared
6. Cuisines and tags remain selected
7. Repeat for other sections

**Test Case 9: Keyboard Accessibility**
1. Navigate to `/browse`
2. Tab through filter controls
3. Verify checkboxes can be toggled with Space key
4. Verify expand/collapse controls can be activated with Enter/Space
5. Verify visual focus indicators are clear

**Test Case 10: Direct URL Access**
1. Navigate directly to `/browse?category=<id1>,<id2>&cuisines=<id3>`
2. Verify page loads with correct filters applied
3. Verify checkboxes show correct selected state
4. Verify parent categories show indeterminate state if appropriate
5. Verify results match the URL filters

## Future Enhancements

1. Add recipe count badges to each category
2. ~~Implement mobile filter modal with hierarchical tree~~ **COMPLETED**
3. Add "breadcrumb" display showing current category path
4. Add keyboard navigation for category tree (partially implemented)
5. Add search within categories
6. Optimize with category hierarchy caching
7. Add "Select All" / "Deselect All" for each filter section
8. Add filter presets (e.g., "Quick Weeknight Dinners", "Healthy Breakfast")
9. Persist filter preferences in local storage or user profile
