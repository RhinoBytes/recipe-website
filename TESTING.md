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

1. **Mobile Filters**: The mobile filter modal is not yet implemented (placeholder alert shown)
2. **Active Filters Display**: Simplified version showing only "Clear all" button
3. **Category Count**: Recipe counts per category are not yet displayed
4. **Deep Linking**: Direct access with category ID works, but category name would be more user-friendly

## Future Enhancements

1. Add recipe count badges to each category
2. Implement mobile filter modal with hierarchical tree
3. Add "breadcrumb" display showing current category path
4. Add keyboard navigation for category tree
5. Add search within categories
6. Optimize with category hierarchy caching
