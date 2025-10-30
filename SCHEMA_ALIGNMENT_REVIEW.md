# Recipe System Schema Alignment Review

## Executive Summary

This document reviews the recipe system against the problem statement requirements and provides recommendations for improvements. The system has been recently refactored to fix data flow issues, but several areas need attention.

**Date**: 2025-10-30
**Status**: Review Complete - Implementation Needed

---

## Current State Analysis

### ✅ What's Working Well

1. **Data Flow Consistency**
   - ✅ Steps properly stored as arrays (no longer deleted on edit)
   - ✅ Ingredients with measurements stored correctly
   - ✅ API routes (GET, POST, PATCH) handle data consistently
   - ✅ Schema matches API expectations

2. **Measurement System Infrastructure**
   - ✅ Database schema supports `IngredientMeasurement` table with system enum
   - ✅ `MeasurementSystem` enum (IMPERIAL, METRIC, OTHER) defined
   - ✅ Recipe view page supports toggling between Imperial/Metric
   - ✅ Ingredient scaling with fraction display works

3. **Tags**
   - ✅ API returns tags sorted by recipe count (most used first)
   - ✅ UI displays top 20 tags
   - ✅ Custom tag input available

---

## ❌ Issues Identified

### Issue 1: Nutrition Info Missing from Forms
**Severity**: HIGH  
**Impact**: Users cannot input nutrition data

**Problem**:
- Schema has: `calories`, `proteinG`, `fatG`, `carbsG` fields
- API POST/PATCH accept these fields
- Recipe view displays nutrition data
- **BUT**: New/Edit recipe forms have NO input fields for nutrition

**Evidence**:
```typescript
// Schema (prisma/schema.prisma) - Line 69-72
calories        Int?
proteinG        Int?
fatG            Int?
carbsG          Int?

// API accepts (app/api/recipes/route.ts) - Line 237-240
calories,
proteinG,
fatG,
carbsG,

// View displays (components/recipe/RecipeSidebar.tsx) - Line 83-115
{hasNutrition && (
  <div className="bg-gradient-to-br...">
    ...nutrition display...
  </div>
)}

// NEW PAGE MISSING - app/(dashboard)/recipes/new/page.tsx
// NO nutrition input fields found

// EDIT PAGE MISSING - app/(dashboard)/recipes/edit/[slug]/page.tsx
// NO nutrition input fields found
```

**Recommendation**: Add nutrition input fields to both New and Edit recipe pages

---

### Issue 2: Tag Auto-Capitalization Missing
**Severity**: MEDIUM  
**Impact**: Inconsistent tag naming (could have "low carb", "Low Carb", "LOW CARB")

**Problem**:
- Problem statement requires: "New tags should auto-capitalize each word"
- Current implementation: Tags saved exactly as typed

**Evidence**:
```typescript
// app/(dashboard)/recipes/new/page.tsx - Line 293-301
const addTag = () => {
  if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
    setFormData({
      ...formData,
      tags: [...formData.tags, tagInput.trim()], // NO CAPITALIZATION
    });
    setTagInput("");
  }
};
```

**Recommendation**: Add capitalization helper function

---

### Issue 3: Single Unit System Only (Critical)
**Severity**: CRITICAL  
**Impact**: Only ONE measurement system stored per ingredient (not both)

**Problem**:
- Problem statement: "Both imperial and metric quantities should be persisted"
- AI endpoint requests BOTH systems from OpenAI
- Database supports multiple measurements per ingredient
- **BUT**: Parser only creates ONE measurement

**Evidence**:
```typescript
// lib/recipeParser.ts - Line 41-81
export function convertToNewFormat(oldIngredient: ParsedIngredient): NewIngredientFormat {
  const measurements = [];
  
  if (oldIngredient.amount && oldIngredient.unit) {
    // Determine system based on unit
    let system: MeasurementSystem;
    // ... classification logic ...
    
    measurements.push({
      system,
      amount: oldIngredient.amount,
      unit: oldIngredient.unit,
    });
    // ^^^ ONLY ONE MEASUREMENT PUSHED!
  }
  
  return {
    // ...
    measurements, // Array with only 1 item
  };
}
```

**Root Cause**: 
1. User types: "2 cups flour" 
2. `parseIngredients()` extracts: `{amount: "2", unit: "cups", name: "flour"}`
3. `convertToNewFormat()` creates: `[{system: IMPERIAL, amount: "2", unit: "cups"}]`
4. **Missing**: Conversion to metric (should also create `{system: METRIC, amount: "480", unit: "ml"}`)

**Impact Flow**:
```
User Input → Parse → Convert → Save to DB
"2 cups flour" → {amount:"2", unit:"cups"} → [{IMPERIAL, 2, cups}] → DB ❌ Missing metric

AI Input → Parse → Save to DB  
AI returns both → [{IMPERIAL...}, {METRIC...}] → DB ✅ Both saved

View Page → Toggle Units
If created manually → Only Imperial available → Can't switch to metric ❌
If created with AI → Both available → Can switch ✅
```

**Recommendation**: Implement unit conversion in `convertToNewFormat()`

---

### Issue 4: Tags Display Count
**Severity**: LOW  
**Impact**: Shows top 20 instead of top 8 as specified

**Problem**:
- Problem statement: "Show top 8 most-used tags first"
- Current: Shows top 20 tags

**Evidence**:
```typescript
// app/(dashboard)/recipes/new/page.tsx - Line 632
{availableTags.slice(0, 20).map((tag) => (
//                        ^^^ Should be 8
```

**Recommendation**: Change `slice(0, 20)` to `slice(0, 8)` and add expandable dropdown for rest

---

### Issue 5: Ingredient Scaling Fractions
**Severity**: LOW (Already Implemented)  
**Status**: ✅ WORKING

**Verification**:
```typescript
// components/recipe/IngredientsList.tsx - Line 68-103
function formatAmount(value: number): string {
  const fractions: { [key: number]: string } = {
    0.125: '⅛',
    0.25: '¼',
    0.333: '⅓',
    0.5: '½',
    0.666: '⅔',
    0.75: '¾',
  };
  // ... proper fraction formatting logic ...
}
```

**Note**: This is already implemented correctly with Unicode fractions.

---

## Schema Alignment Verification

### Recipe Schema
| Field | Schema | API POST | API GET | New Page | Edit Page | View Page | Status |
|-------|--------|----------|---------|----------|-----------|-----------|--------|
| title | String | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| description | String? | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| servings | Int? | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| prepTimeMinutes | Int? | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| cookTimeMinutes | Int? | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| difficulty | Enum | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **calories** | **Int?** | **✅** | **✅** | **❌** | **❌** | **✅** | **❌ Missing** |
| **proteinG** | **Int?** | **✅** | **✅** | **❌** | **❌** | **✅** | **❌ Missing** |
| **fatG** | **Int?** | **✅** | **✅** | **❌** | **❌** | **✅** | **❌ Missing** |
| **carbsG** | **Int?** | **✅** | **✅** | **❌** | **❌** | **✅** | **❌ Missing** |
| steps | Related | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ingredients | Related | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| tags | Related | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| categories | Related | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| allergens | Related | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Ingredient Measurements
| Field | Schema | API | Parser | AI | Status |
|-------|--------|-----|--------|-----|--------|
| system | Enum | ✅ | ✅ | ✅ | ✅ |
| amount | String | ✅ | ✅ | ✅ | ✅ |
| unit | String | ✅ | ✅ | ✅ | ✅ |
| **dual systems** | **✅** | **✅** | **❌** | **✅** | **❌ Broken** |

**Key**: Parser creates only 1 measurement, should create 2 (Imperial + Metric)

---

## Recommended Fixes

### Priority 1: Add Nutrition Input Fields (HIGH)

**Files to modify**:
1. `app/(dashboard)/recipes/new/page.tsx`
2. `app/(dashboard)/recipes/edit/[slug]/page.tsx`

**Implementation**:
```typescript
// Add to RecipeFormData interface (already has these fields in types)
// Add new CollapsibleSection:

<CollapsibleSection title="Nutrition Information" defaultOpen={false}>
  <p className="text-sm text-gray-600 mb-4">
    Optional - Add nutritional information per serving
  </p>
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Calories
      </label>
      <input
        type="number"
        value={formData.calories || ''}
        onChange={(e) => setFormData({ 
          ...formData, 
          calories: parseInt(e.target.value) || undefined 
        })}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        placeholder="0"
        min="0"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Protein (g)
      </label>
      <input
        type="number"
        value={formData.proteinG || ''}
        onChange={(e) => setFormData({ 
          ...formData, 
          proteinG: parseInt(e.target.value) || undefined 
        })}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        placeholder="0"
        min="0"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Fat (g)
      </label>
      <input
        type="number"
        value={formData.fatG || ''}
        onChange={(e) => setFormData({ 
          ...formData, 
          fatG: parseInt(e.target.value) || undefined 
        })}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        placeholder="0"
        min="0"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Carbs (g)
      </label>
      <input
        type="number"
        value={formData.carbsG || ''}
        onChange={(e) => setFormData({ 
          ...formData, 
          carbsG: parseInt(e.target.value) || undefined 
        })}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        placeholder="0"
        min="0"
      />
    </div>
  </div>
</CollapsibleSection>
```

**Update form initialization to include nutrition fields**:
```typescript
const [formData, setFormData] = useState<RecipeFormData>({
  // ... existing fields ...
  calories: undefined,
  proteinG: undefined,
  fatG: undefined,
  carbsG: undefined,
});
```

---

### Priority 2: Implement Dual Unit System Conversion (CRITICAL)

**File to modify**: `lib/recipeParser.ts`

**Strategy**: Create new conversion utility and update `convertToNewFormat()`

**Implementation**:
```typescript
// Add conversion utilities
interface ConversionResult {
  imperial?: { amount: string; unit: string };
  metric?: { amount: string; unit: string };
}

function convertUnits(amount: string, unit: string): ConversionResult {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return {};
  
  const unitLower = unit.toLowerCase();
  
  // Imperial to Metric conversions
  const conversions: Record<string, { metric: { multiplier: number; unit: string } }> = {
    'cup': { metric: { multiplier: 240, unit: 'ml' } },
    'cups': { metric: { multiplier: 240, unit: 'ml' } },
    'tbsp': { metric: { multiplier: 15, unit: 'ml' } },
    'tablespoon': { metric: { multiplier: 15, unit: 'ml' } },
    'tablespoons': { metric: { multiplier: 15, unit: 'ml' } },
    'tsp': { metric: { multiplier: 5, unit: 'ml' } },
    'teaspoon': { metric: { multiplier: 5, unit: 'ml' } },
    'teaspoons': { metric: { multiplier: 5, unit: 'ml' } },
    'oz': { metric: { multiplier: 28, unit: 'g' } },
    'ounce': { metric: { multiplier: 28, unit: 'g' } },
    'ounces': { metric: { multiplier: 28, unit: 'g' } },
    'lb': { metric: { multiplier: 454, unit: 'g' } },
    'pound': { metric: { multiplier: 454, unit: 'g' } },
    'pounds': { metric: { multiplier: 454, unit: 'g' } },
    'fl oz': { metric: { multiplier: 30, unit: 'ml' } },
  };
  
  // Metric to Imperial (reverse conversions)
  const reverseConversions: Record<string, { imperial: { multiplier: number; unit: string } }> = {
    'ml': { imperial: { multiplier: 1/240, unit: 'cup' } },
    'milliliter': { imperial: { multiplier: 1/240, unit: 'cup' } },
    'milliliters': { imperial: { multiplier: 1/240, unit: 'cup' } },
    'l': { imperial: { multiplier: 4.167, unit: 'cup' } },
    'liter': { imperial: { multiplier: 4.167, unit: 'cup' } },
    'liters': { imperial: { multiplier: 4.167, unit: 'cup' } },
    'g': { imperial: { multiplier: 1/28, unit: 'oz' } },
    'gram': { imperial: { multiplier: 1/28, unit: 'oz' } },
    'grams': { imperial: { multiplier: 1/28, unit: 'oz' } },
    'kg': { imperial: { multiplier: 2.205, unit: 'lb' } },
    'kilogram': { imperial: { multiplier: 2.205, unit: 'lb' } },
    'kilograms': { imperial: { multiplier: 2.205, unit: 'lb' } },
  };
  
  if (conversions[unitLower]) {
    // Converting from Imperial to Metric
    const converted = numAmount * conversions[unitLower].metric.multiplier;
    return {
      imperial: { amount: amount, unit: unit },
      metric: { 
        amount: formatConvertedAmount(converted), 
        unit: conversions[unitLower].metric.unit 
      }
    };
  } else if (reverseConversions[unitLower]) {
    // Converting from Metric to Imperial
    const converted = numAmount * reverseConversions[unitLower].imperial.multiplier;
    return {
      metric: { amount: amount, unit: unit },
      imperial: { 
        amount: formatConvertedAmount(converted), 
        unit: reverseConversions[unitLower].imperial.unit 
      }
    };
  }
  
  // No conversion available (e.g., "cloves", "whole", etc.)
  return {};
}

function formatConvertedAmount(value: number): string {
  // Round to reasonable precision
  if (value >= 1000) {
    // Convert large values (e.g., 1000ml -> 1l, 1000g -> 1kg)
    return (value / 1000).toFixed(1);
  } else if (value < 1) {
    return value.toFixed(2);
  } else {
    return value.toFixed(0);
  }
}

// Update convertToNewFormat
export function convertToNewFormat(oldIngredient: ParsedIngredient): NewIngredientFormat {
  const measurements = [];
  
  if (oldIngredient.amount && oldIngredient.unit) {
    // Try to convert between systems
    const converted = convertUnits(oldIngredient.amount, oldIngredient.unit);
    
    if (converted.imperial && converted.metric) {
      // We have both systems
      measurements.push({
        system: MeasurementSystem.IMPERIAL,
        amount: converted.imperial.amount,
        unit: converted.imperial.unit,
      });
      measurements.push({
        system: MeasurementSystem.METRIC,
        amount: converted.metric.amount,
        unit: converted.metric.unit,
      });
    } else {
      // No conversion available, classify and store once
      let system: MeasurementSystem;
      const unit = oldIngredient.unit.toLowerCase();
      
      if (['cup', 'cups', 'tbsp', 'tablespoon', 'tablespoons', 'tsp', 'teaspoon', 'teaspoons',
           'oz', 'ounce', 'ounces', 'lb', 'pound', 'pounds', 'fl oz'].includes(unit)) {
        system = MeasurementSystem.IMPERIAL;
      } else if (['g', 'gram', 'grams', 'kg', 'kilogram', 'kilograms', 'ml', 'milliliter', 'milliliters',
                  'l', 'liter', 'liters'].includes(unit)) {
        system = MeasurementSystem.METRIC;
      } else {
        system = MeasurementSystem.OTHER;
      }
      
      measurements.push({
        system,
        amount: oldIngredient.amount,
        unit: oldIngredient.unit,
      });
      
      // For OTHER system (cloves, whole, etc.), duplicate for both displays
      if (system === MeasurementSystem.OTHER) {
        measurements.push({
          system: MeasurementSystem.OTHER,
          amount: oldIngredient.amount,
          unit: oldIngredient.unit,
        });
      }
    }
  }
  
  return {
    name: oldIngredient.name,
    size: null,
    preparation: null,
    notes: oldIngredient.notes,
    groupName: oldIngredient.groupName,
    isOptional: oldIngredient.isOptional,
    displayOrder: oldIngredient.displayOrder,
    measurements,
  };
}
```

---

### Priority 3: Add Tag Auto-Capitalization (MEDIUM)

**Files to modify**:
1. `app/(dashboard)/recipes/new/page.tsx`
2. `app/(dashboard)/recipes/edit/[slug]/page.tsx`

**Implementation**:
```typescript
// Add helper function at top of file
function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Update addTag function
const addTag = () => {
  if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
    const capitalizedTag = capitalizeWords(tagInput.trim());
    setFormData({
      ...formData,
      tags: [...formData.tags, capitalizedTag],
    });
    setTagInput("");
  }
};
```

---

### Priority 4: Fix Tags Display Count (LOW)

**Files to modify**:
1. `app/(dashboard)/recipes/new/page.tsx`
2. `app/(dashboard)/recipes/edit/[slug]/page.tsx`

**Implementation**:
```typescript
// Change from slice(0, 20) to slice(0, 8)
{availableTags.slice(0, 8).map((tag) => (
  // ... existing code ...
))}

// Add "Show More" button if needed
{availableTags.length > 8 && (
  <button
    type="button"
    onClick={() => setShowAllTags(!showAllTags)}
    className="text-amber-600 hover:text-amber-700 text-sm font-medium"
  >
    {showAllTags ? 'Show Less' : `Show ${availableTags.length - 8} More Tags`}
  </button>
)}

// Update slice to show all when expanded
{availableTags.slice(0, showAllTags ? undefined : 8).map((tag) => (
  // ... existing code ...
))}
```

---

## Testing Plan

### Test 1: Nutrition Info
1. Create new recipe with nutrition data
2. Verify data saves to database
3. View recipe and verify nutrition displays
4. Edit recipe and verify nutrition can be updated
5. Verify nutrition displays in sidebar

### Test 2: Dual Unit System
1. Create recipe with "2 cups flour"
2. Verify database has TWO measurements:
   - IMPERIAL: 2 cups
   - METRIC: 480 ml
3. View recipe and toggle between Imperial/Metric
4. Verify both display correctly

### Test 3: Tag Capitalization
1. Add tag: "low carb"
2. Verify saved as: "Low Carb"
3. Try adding: "Low Carb" again
4. Verify duplicate detection works with capitalization

### Test 4: Tags Display
1. View new recipe form
2. Verify only 8 tags shown initially
3. Click "Show More"
4. Verify all tags displayed

---

## Summary

### Critical Issues
1. ❌ **Nutrition fields missing from forms** - Prevents user input
2. ❌ **Single unit system only** - Violates requirement for dual storage

### Medium Issues
3. ⚠️ **Tag auto-capitalization missing** - Causes inconsistent data

### Minor Issues
4. ℹ️ **Shows 20 tags instead of 8** - Minor UX issue

### Working Correctly
- ✅ Ingredient scaling with fractions
- ✅ Tag sorting by popularity
- ✅ Data flow consistency (steps/ingredients)
- ✅ Schema alignment (except nutrition inputs)

---

## Recommendations

1. **Implement all Priority 1-3 fixes** - These address the problem statement requirements
2. **Add comprehensive unit conversion** - Essential for dual system support
3. **Consider nutrition calculator API** - For automatic estimation
4. **Add conversion table UI** - Help users understand unit conversions
5. **Add tag suggestions** - Based on existing popular tags

---

## Next Steps

1. ✅ Review completed
2. ⏭️ Implement Priority 1: Nutrition fields
3. ⏭️ Implement Priority 2: Dual unit conversion
4. ⏭️ Implement Priority 3: Tag capitalization
5. ⏭️ Implement Priority 4: Tags display
6. ⏭️ Run comprehensive testing
7. ⏭️ Update documentation

