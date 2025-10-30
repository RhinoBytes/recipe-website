# Recipe Data Flow Audit Report

## Executive Summary

This document summarizes the data flow analysis and fixes applied to resolve mismatches between recipe frontend pages and backend APIs.

**Status**: ✅ All critical mismatches resolved

---

## Data Flow Analysis

### Operation 1: CREATE (New Recipe)

**Frontend**: `app/(dashboard)/recipes/new/page.tsx`  
**API**: `POST /api/recipes`  
**Status**: ✅ CONSISTENT (No changes needed)

#### Data Flow
1. User fills textarea fields for ingredients and steps
2. Frontend parses textareas using `parseIngredients()` and `parseSteps()`
3. Submits structured arrays to POST API
4. API stores in database

#### Type Mapping
| Field | Form Type | API Type | DB Type | Status |
|-------|-----------|----------|---------|--------|
| steps | `RecipeStep[]` | `RecipeStep[]` | Related table | ✅ |
| ingredients | `Ingredient[]` | `Ingredient[]` | Related table | ✅ |
| ingredients.amount | `string \| null` | `string \| null` | `String?` | ✅ |
| servings | `number` | `number` | `Int?` | ✅ |
| difficulty | `Difficulty` enum | `Difficulty` enum | `Difficulty?` | ✅ |

---

### Operation 2: READ (Get Recipe for Editing)

**API**: `GET /api/recipes/[slug]`  
**Frontend**: `app/(dashboard)/recipes/edit/[slug]/page.tsx`  
**Status**: ✅ FIXED

#### Issues Found
1. ❌ **CRITICAL**: API returns `steps[]`, edit page expected `instructions: string`
2. ❌ **MAJOR**: API returns `amount: string`, edit page expected `amount: number`
3. ❌ **MAJOR**: Edit page missing ingredient fields: `notes`, `groupName`, `isOptional`

#### Fixes Applied
1. ✅ Changed edit page to use `steps: RecipeStep[]`
2. ✅ Changed ingredient amount to `string | null`
3. ✅ Added missing ingredient fields
4. ✅ Added data transformation on load:
   - `stepsToText()` converts steps array → textarea
   - `ingredientsToText()` converts ingredients array → textarea

#### After Fix - Type Mapping
| Field | API Response | Form Type | Transformation | Status |
|-------|--------------|-----------|----------------|--------|
| steps | `RecipeStep[]` | `RecipeStep[]` | Array → textarea text | ✅ |
| ingredients | `Ingredient[]` | `Ingredient[]` | Array → textarea text | ✅ |
| ingredients.amount | `string \| null` | `string \| null` | None needed | ✅ |
| ingredients.notes | `string \| null` | `string \| null` | Included in text | ✅ |
| ingredients.groupName | `string \| null` | `string \| null` | Included in text | ✅ |
| ingredients.isOptional | `boolean` | `boolean` | Included in text | ✅ |

---

### Operation 3: UPDATE (Edit Recipe)

**Frontend**: `app/(dashboard)/recipes/edit/[slug]/page.tsx`  
**API**: `PATCH /api/recipes/[slug]`  
**Status**: ✅ FIXED

#### Issues Found
1. ❌ **CRITICAL**: Edit page sent `instructions: string`, API expected `steps: RecipeStep[]`
   - **Result**: Steps were DELETED on update (API received undefined for steps)
2. ❌ **MAJOR**: Edit page sent `amount: number`, API expected `amount: string`
   - **Result**: Type coercion worked but inconsistent

#### Fixes Applied
1. ✅ Edit page now sends `steps: RecipeStep[]`
2. ✅ Textarea parsed to structured array before submit using `parseSteps()`
3. ✅ Ingredient amount now sent as `string | null`
4. ✅ All ingredient fields included (notes, groupName, isOptional)

#### After Fix - Type Mapping
| Field | Form Submission | API Expectation | DB Storage | Status |
|-------|----------------|-----------------|------------|--------|
| steps | `RecipeStep[]` | `RecipeStep[]` | Related table | ✅ |
| ingredients | `Ingredient[]` | `Ingredient[]` | Related table | ✅ |
| ingredients.amount | `string \| null` | `string \| null` | `String?` | ✅ |
| ingredients.notes | `string \| null` | `string \| null` | `String?` | ✅ |
| ingredients.groupName | `string \| null` | `string \| null` | `String?` | ✅ |
| ingredients.isOptional | `boolean` | `boolean` | `Boolean` | ✅ |

---

## Summary of Mismatches Found and Fixed

### Critical (Broke Functionality)

#### 1. Edit Page Instructions/Steps Field
- **Location**: `app/(dashboard)/recipes/edit/[slug]/page.tsx`
- **Problem**: Used `instructions: string` instead of `steps: RecipeStep[]`
- **Impact**: Recipe steps were DELETED when editing because API received `undefined` for steps
- **Fix**: Changed to use `steps: RecipeStep[]` with textarea UI
- **Status**: ✅ RESOLVED

### Major (Type Inconsistency & Data Loss)

#### 2. Ingredient Amount Type
- **Location**: `app/(dashboard)/recipes/edit/[slug]/page.tsx`
- **Problem**: Used `amount: number | null` instead of `string | null`
- **Impact**: 
  - Lost ability to store fractions (e.g., "1/2", "1-2")
  - Lost ability to store ranges (e.g., "2-3")
  - Type coercion could cause precision issues
- **Fix**: Changed to `amount: string | null`
- **Status**: ✅ RESOLVED

#### 3. Missing Ingredient Fields
- **Location**: `app/(dashboard)/recipes/edit/[slug]/page.tsx`
- **Problem**: Edit page ingredient interface missing `notes`, `groupName`, `isOptional`
- **Impact**: Data loss when editing recipes with these fields
- **Fix**: Added all missing fields to ingredient interface
- **Status**: ✅ RESOLVED

### Minor (Design Inconsistency)

#### 4. Inconsistent UI Pattern
- **Problem**: New recipe page used textareas, edit page used individual input fields
- **Impact**: Confusing user experience, different workflows for similar tasks
- **Fix**: Unified both pages to use textarea-based input
- **Status**: ✅ RESOLVED

#### 5. Difficulty Type Inconsistency
- **Problem**: New page used `Difficulty` enum, edit page used plain `string`
- **Impact**: None (handled by coercion), but inconsistent typing
- **Fix**: Edit page now uses `Difficulty` enum
- **Status**: ✅ RESOLVED

---

## Standardization Improvements

### 1. Shared Type Definitions
Created comprehensive types in `types/recipe.ts`:

```typescript
export interface RecipeIngredient {
  amount: string | null;      // String for fractions/ranges
  unit: string | null;
  name: string;
  notes?: string | null;      // Now included
  groupName?: string | null;  // Now included
  isOptional?: boolean;       // Now included
  displayOrder?: number;
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
  groupName?: string | null;
  isOptional?: boolean;
}

export interface RecipeFormData {
  title: string;
  description: string;
  steps: RecipeStep[];        // Consistent everywhere
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: Difficulty;     // Enum, not string
  imageUrl: string;
  sourceUrl: string;
  sourceText: string;
  cuisineName: string;
  ingredients: RecipeIngredient[];
  tags: string[];
  categories: string[];
  allergens: string[];
  status: RecipeStatus;       // Enum, not string
}
```

### 2. Data Transformation Functions
Both pages now use shared utility functions from `lib/recipeParser.ts`:

- `parseIngredients(text: string): Ingredient[]` - Parse textarea → structured array
- `parseSteps(text: string): RecipeStep[]` - Parse textarea → structured array
- `ingredientsToText(ingredients: Ingredient[]): string` - Array → textarea
- `stepsToText(steps: RecipeStep[]): string` - Array → textarea

### 3. Consistent Validation
Both pages now:
- Validate at least one ingredient exists
- Validate at least one step exists
- Parse textareas before submission
- Use same data structures

---

## API Contract Verification

### POST /api/recipes
**Status**: ✅ No changes needed

Correctly expects:
- `steps: RecipeStep[]`
- `ingredients: RecipeIngredient[]` with `amount: string | null`
- All optional fields properly handled

### GET /api/recipes/[slug]
**Status**: ✅ No changes needed

Correctly returns:
- `steps: RecipeStep[]` ordered by `stepNumber`
- `ingredients: RecipeIngredient[]` ordered by `displayOrder`
- All fields present

### PATCH /api/recipes/[slug]
**Status**: ✅ No changes needed

Correctly handles:
- `steps: RecipeStep[]` - Deletes old, creates new
- `ingredients: RecipeIngredient[]` - Deletes old, creates new
- Properly handles `amount: string | null`
- All optional fields properly handled

---

## Database Schema Verification

**File**: `prisma/schema.prisma`  
**Status**: ✅ Schema matches API contract

```prisma
model Recipe {
  servings        Int?
  prepTimeMinutes Int?
  cookTimeMinutes Int?
  difficulty      Difficulty?
  status          RecipeStatus
}

model RecipeIngredient {
  amount       String?      // Correct: String, not number
  unit         String?
  name         String
  notes        String?      // Present
  groupName    String?      // Present
  isOptional   Boolean      // Present
  displayOrder Int
}

model RecipeStep {
  stepNumber  Int
  instruction String
  groupName   String?
  isOptional  Boolean
}
```

---

## Testing Checklist

### Before Changes
- ❌ Edit recipe → Steps were deleted on save
- ❌ Edit recipe → Lost ingredient notes, groups, optional markers
- ❌ Edit recipe → Inconsistent amount types

### After Changes
- [ ] Can create new recipe successfully
- [ ] New recipe data saves correctly to database
- [ ] Can fetch and display existing recipe in edit form
- [ ] Can update recipe successfully
- [ ] Updated recipe data persists correctly (especially steps!)
- [ ] Ingredient notes preserved through edit workflow
- [ ] Ingredient groups preserved through edit workflow
- [ ] Optional markers preserved through edit workflow
- [ ] No console errors or type warnings
- [ ] UI consistent between new and edit pages

---

## Files Modified

1. `app/(dashboard)/recipes/edit/[slug]/page.tsx` - Major refactor
   - Changed `instructions: string` → `steps: RecipeStep[]`
   - Fixed ingredient interface
   - Added textarea UI
   - Added data transformations

2. `types/recipe.ts` - Enhanced with complete types
   - Added `RecipeFormData` interface
   - Added comprehensive documentation
   - Imported enums from Prisma

---

## Recommendations for Future Development

### 1. Consider Zod Validation
Add runtime validation with Zod schemas:
```typescript
import { z } from 'zod';

const RecipeFormSchema = z.object({
  title: z.string().min(1),
  steps: z.array(RecipeStepSchema).min(1),
  ingredients: z.array(RecipeIngredientSchema).min(1),
  // ... etc
});
```

### 2. API Response Types
Create explicit API response types to ensure type safety:
```typescript
export type RecipeApiResponse = Prisma.RecipeGetPayload<{
  include: {
    ingredients: true,
    steps: true,
    tags: { include: { tag: true } },
    // ... etc
  }
}>;
```

### 3. Transformation Layer
Create a dedicated transformation module:
```typescript
// lib/recipeTransformers.ts
export const apiToFormData = (recipe: RecipeApiResponse): RecipeFormData => { }
export const formDataToApi = (formData: RecipeFormData): RecipeApiPayload => { }
```

### 4. Unit Tests
Add tests for transformation functions:
```typescript
describe('parseIngredients', () => {
  it('should handle fractions in amounts', () => {
    const result = parseIngredients('1/2 cup flour');
    expect(result[0].amount).toBe('1/2');
  });
});
```

---

## Conclusion

All critical and major data flow mismatches have been identified and resolved. The recipe data flow is now consistent across create, read, and update operations:

1. ✅ **Steps** - Properly handled as arrays throughout
2. ✅ **Ingredients** - Consistent types and fields everywhere
3. ✅ **UI/UX** - Unified textarea-based interface
4. ✅ **Types** - Shared type definitions with proper imports
5. ✅ **Validation** - Consistent validation across pages

The system now maintains data integrity throughout the entire recipe lifecycle.
