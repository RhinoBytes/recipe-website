# Testing Validation for Recipe Data Flow Fixes

## Overview
This document provides step-by-step instructions to validate the recipe data flow fixes.

---

## Prerequisites

1. Ensure database is seeded with test data:
   ```bash
   npm run seed
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Log in with a test account (see TESTING.md for credentials)

---

## Test Case 1: Create New Recipe

**Objective**: Verify new recipe creation works correctly with structured data

### Steps
1. Navigate to `/recipes/new`
2. Fill in the form:
   - Title: "Test Recipe - Data Flow Validation"
   - Description: "Testing recipe data flow"
   - Ingredients (in textarea):
     ```
     2 cups flour
     1/2 cup sugar (or brown sugar)
     
     For the sauce:
     3 tbsp olive oil
     2 cloves garlic, minced (optional)
     ```
   - Instructions (in textarea):
     ```
     Mix flour and sugar in a large bowl
     Knead the dough for 5 minutes
     
     For the sauce:
     Heat oil in a pan
     Add garlic and cook until fragrant (optional)
     ```
   - Servings: 4
   - Prep Time: 15 min
   - Cook Time: 30 min
   - Difficulty: Medium

3. Click "Publish Recipe"

### Expected Results
✅ Recipe created successfully  
✅ Redirected to recipe detail page  
✅ All fields displayed correctly  
✅ Steps numbered correctly  
✅ Ingredients show amounts as strings (including "1/2")  
✅ Ingredient groups visible ("For the sauce:")  
✅ Optional markers visible  

### Validation Queries
```sql
-- Check recipe was created
SELECT * FROM "Recipe" WHERE title = 'Test Recipe - Data Flow Validation';

-- Check steps were saved correctly
SELECT * FROM "RecipeStep" WHERE "recipeId" = '<recipe_id>' ORDER BY "stepNumber";

-- Check ingredients were saved correctly
SELECT * FROM "RecipeIngredient" WHERE "recipeId" = '<recipe_id>' ORDER BY "displayOrder";
```

### Expected Database State
- Recipe record created with correct data
- 4 RecipeStep records created with correct stepNumber and groupName
- 4 RecipeIngredient records created with:
  - amount as strings ("2", "1/2", "3", "2")
  - groupName set for sauce ingredients
  - isOptional = true for garlic

---

## Test Case 2: Read Recipe for Editing

**Objective**: Verify recipe data loads correctly into edit form

### Steps
1. Navigate to the recipe created in Test Case 1
2. Click "Edit Recipe" button
3. Observe the edit form

### Expected Results
✅ Title field populated correctly  
✅ Description field populated correctly  
✅ Ingredients textarea shows formatted text with:
  - Amounts as strings (including "1/2")
  - Group headers ("For the sauce:")
  - Optional markers  
✅ Instructions textarea shows formatted text with:
  - All steps in order
  - Group headers ("For the sauce:")
  - Optional markers  
✅ All numeric fields populated correctly  
✅ Difficulty dropdown shows correct value  
✅ Tags, categories, allergens selected correctly  

### What to Check
```
Ingredients Textarea Should Show:
2 cups flour
1/2 cup sugar (or brown sugar)

For the sauce:
3 tbsp olive oil
2 cloves garlic, minced (optional)

Instructions Textarea Should Show:
Mix flour and sugar in a large bowl
Knead the dough for 5 minutes

For the sauce:
Heat oil in a pan
Add garlic and cook until fragrant (optional)
```

---

## Test Case 3: Update Existing Recipe

**Objective**: Verify recipe updates preserve all data correctly

### Steps
1. In the edit form from Test Case 2, make these changes:
   - Change title to "Test Recipe - Updated"
   - Add a new ingredient line:
     ```
     1 tsp salt
     ```
   - Add a new step:
     ```
     Let dough rest for 10 minutes
     ```
   - Change servings to 6

2. Click "Update Recipe"

### Expected Results
✅ Recipe updated successfully  
✅ Redirected to recipe detail page  
✅ Title shows "Test Recipe - Updated"  
✅ Servings shows 6  
✅ All original ingredients still present  
✅ New ingredient (salt) visible  
✅ All original steps still present  
✅ New step visible  
✅ Ingredient groups still visible  
✅ Optional markers still present  

### Critical Validation
**MOST IMPORTANT**: Verify that steps were NOT deleted

```sql
-- Count steps before and after update
SELECT COUNT(*) FROM "RecipeStep" WHERE "recipeId" = '<recipe_id>';
-- Should be 5 (4 original + 1 new)

-- Verify all step instructions are present
SELECT "stepNumber", "instruction", "groupName", "isOptional" 
FROM "RecipeStep" 
WHERE "recipeId" = '<recipe_id>' 
ORDER BY "stepNumber";
```

### Expected Database Changes
- Recipe.title updated to "Test Recipe - Updated"
- Recipe.servings updated to 6
- RecipeStep count increased to 5
- RecipeIngredient count increased to 5
- All original steps preserved (not deleted!)
- All original ingredients preserved
- Group names preserved
- Optional markers preserved

---

## Test Case 4: Ingredient Amount Types

**Objective**: Verify string amounts (fractions, ranges) work correctly

### Steps
1. Create a new recipe with these ingredients:
   ```
   1/2 cup flour
   1-2 tbsp sugar
   2 1/4 cups milk
   3.5 oz butter
   ```

2. Save the recipe
3. Edit the recipe
4. Verify ingredients display correctly

### Expected Results
✅ "1/2" stored as string (not converted to 0.5)  
✅ "1-2" stored as string (range preserved)  
✅ "2 1/4" stored as string (mixed fraction preserved)  
✅ "3.5" stored as string  
✅ All amounts display correctly in edit form  
✅ All amounts can be edited without loss  

### Database Validation
```sql
SELECT "amount", "name" FROM "RecipeIngredient" 
WHERE "recipeId" = '<recipe_id>';
```

Expected amounts column values:
- "1/2"
- "1-2"
- "2 1/4"
- "3.5"

---

## Test Case 5: Ingredient Notes and Groups

**Objective**: Verify notes, groups, and optional markers persist

### Steps
1. Create a recipe with grouped ingredients:
   ```
   For the dough:
   3 cups flour
   1 cup water
   
   For the filling:
   2 cups cheese, shredded (any cheese works) optional
   1/2 cup herbs (fresh or dried)
   ```

2. Save, then edit the recipe
3. Update and save again

### Expected Results
✅ Groups display in edit textarea with headers  
✅ Notes display in parentheses  
✅ Optional markers display  
✅ After update, all fields preserved  
✅ Can add new groups  
✅ Can modify notes  
✅ Can toggle optional status  

### Database Validation
```sql
SELECT "name", "notes", "groupName", "isOptional" 
FROM "RecipeIngredient" 
WHERE "recipeId" = '<recipe_id>'
ORDER BY "displayOrder";
```

Expected:
- flour: groupName = "dough", notes = null, isOptional = false
- water: groupName = "dough", notes = null, isOptional = false
- cheese: groupName = "filling", notes = "any cheese works", isOptional = true
- herbs: groupName = "filling", notes = "fresh or dried", isOptional = false

---

## Test Case 6: Edge Cases

### 6.1 Empty Optional Fields
**Test**: Leave cuisine, sourceUrl, sourceText empty  
**Expected**: ✅ Recipe saves successfully with null values

### 6.2 Special Characters
**Test**: Use special characters in ingredients:
```
2 cups all-purpose flour (pre-sifted)
1/4 tsp salt & pepper
3-4 garlic cloves, minced
```
**Expected**: ✅ Parses and saves correctly

### 6.3 Long Instructions
**Test**: Add 20+ steps with various groups  
**Expected**: ✅ All steps saved and numbered correctly

### 6.4 Unicode Characters
**Test**: Use unicode in recipe:
```
½ cup sugar
2 tbsp olive oil 🫒
```
**Expected**: ✅ Saves and displays correctly

---

## Test Case 7: Data Type Consistency

### Objective: Verify type consistency throughout the flow

### Check Points

1. **Amounts as Strings**
   - [ ] New recipe form accepts string amounts
   - [ ] API receives string amounts
   - [ ] Database stores string amounts
   - [ ] Edit form displays string amounts
   - [ ] Updated recipe preserves string amounts

2. **Steps as Arrays**
   - [ ] New recipe sends steps array to API
   - [ ] API stores steps in RecipeStep table
   - [ ] Edit form receives steps array from API
   - [ ] Edit form sends steps array on update
   - [ ] Steps not deleted on update

3. **Enum Types**
   - [ ] Difficulty uses enum (EASY, MEDIUM, HARD)
   - [ ] Status uses enum (DRAFT, PUBLISHED)
   - [ ] Both work correctly in dropdowns

---

## Console Validation

### No Errors Expected
Open browser console (F12) during all tests. Verify:
- [ ] No type errors
- [ ] No undefined variable errors
- [ ] No failed API requests
- [ ] No validation errors

### Expected Warnings (OK to ignore)
- Next.js image optimization warnings (using `<img>` instead of `<Image>`)

---

## Regression Testing

### Test Existing Recipes
1. Find an old recipe created before the fix
2. Edit and update it
3. Verify:
   - [ ] Recipe updates successfully
   - [ ] No data loss
   - [ ] Steps preserved (not deleted)
   - [ ] Ingredients preserved

---

## API Contract Validation

### POST /api/recipes
**Request Body**:
```json
{
  "title": "Test",
  "steps": [
    { "stepNumber": 1, "instruction": "Step 1", "groupName": null, "isOptional": false }
  ],
  "ingredients": [
    { "amount": "1/2", "unit": "cup", "name": "flour", "notes": null, "groupName": null, "isOptional": false, "displayOrder": 0 }
  ]
}
```
**Expected**: 201 Created with recipe object

### GET /api/recipes/[slug]
**Expected Response**:
```json
{
  "steps": [
    { "stepNumber": 1, "instruction": "...", "groupName": null, "isOptional": false }
  ],
  "ingredients": [
    { "amount": "1/2", "unit": "cup", "name": "flour", ... }
  ]
}
```

### PATCH /api/recipes/[slug]
**Request Body**: Same as POST  
**Expected**: 200 OK with updated recipe object  
**Critical**: Steps not deleted, all data preserved

---

## Summary Checklist

After running all tests, verify:

- [ ] Can create new recipe with structured data
- [ ] Recipe data saves correctly to database
- [ ] Can load recipe into edit form
- [ ] Edit form displays all fields correctly
- [ ] Can update recipe successfully
- [ ] Updates preserve all existing data
- [ ] Steps not deleted on update (CRITICAL)
- [ ] Ingredient amounts stored as strings
- [ ] Ingredient notes preserved
- [ ] Ingredient groups preserved
- [ ] Optional markers preserved
- [ ] No type errors in console
- [ ] UI consistent between new and edit pages
- [ ] API responses match expected formats

---

## Rollback Plan

If any test fails critically:

1. Identify which operation fails (create, read, update)
2. Check browser console for error messages
3. Check server logs for API errors
4. Verify database state with SQL queries
5. Report issue with:
   - Test case that failed
   - Error message
   - Expected vs actual behavior
   - Database state
   - Console logs

---

## Success Criteria

✅ All test cases pass  
✅ No data loss during updates  
✅ Type consistency maintained throughout  
✅ UI/UX consistent between pages  
✅ No console errors  
✅ Database state matches expectations
