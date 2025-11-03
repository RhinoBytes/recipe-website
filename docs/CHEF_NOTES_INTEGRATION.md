# Chef Notes Field Integration Documentation

## Overview
This document describes the integration of the `chefNotes` field into the recipe management system. The field allows recipe authors to add personal tips, tricks, and insights about their recipes.

## Database Schema
The `chefNotes` field is defined in the Recipe model:

```prisma
model Recipe {
  // ... other fields
  chefNotes       String?
  // ... other fields
}
```

- **Type**: String (nullable)
- **Purpose**: Store chef's personal notes, tips, and tricks for the recipe
- **Database Column**: `chefNotes`

## Type Definitions

### RecipeFormData (types/recipe.ts)
Used in recipe creation and editing forms:
```typescript
export interface RecipeFormData {
  // ... other fields
  chefNotes: string;
  // ... other fields
}
```

### RecipeData (types/recipe.ts)
Used for seed data and file storage:
```typescript
export interface RecipeData {
  // ... other fields
  chefNotes: string | null;
  // ... other fields
}
```

## API Endpoints

### POST /api/recipes
**Request Body:**
```json
{
  "title": "Recipe Title",
  "chefNotes": "Optional chef tips and tricks",
  ...
}
```

**Behavior:**
- Accepts `chefNotes` in request body
- Stores in database
- Saves to JSON file (in development mode)

### PATCH /api/recipes/[slug]
**Request Body:**
```json
{
  "chefNotes": "Updated chef notes",
  ...
}
```

**Behavior:**
- Updates `chefNotes` if provided
- Preserves existing value if not provided

### GET /api/recipes/[slug]
**Response:**
```json
{
  "id": "...",
  "title": "...",
  "chefNotes": "Chef's personal tips...",
  ...
}
```

**Behavior:**
- Returns `chefNotes` field in recipe response
- Value may be `null` for recipes without notes

## Client-Side Components

### Recipe Form (new/edit pages)
Location: `app/(dashboard)/recipes/new/page.tsx` and `app/(dashboard)/recipes/edit/[slug]/page.tsx`

The forms include a textarea for chef notes:
```tsx
<textarea
  value={formData.chefNotes}
  onChange={(e) => setFormData({ ...formData, chefNotes: e.target.value })}
  placeholder="Share your personal tips and tricks..."
/>
```

### Recipe Display
Location: `app/(site)/recipes/[username]/[slug]/page.tsx`

Chef notes are displayed using the ChefNotes component:
```tsx
<ChefNotes notes={recipe.chefNotes} />
```

## Seed Data

### Format
Each recipe in `prisma/seed-data/*/recipe.json` includes:
```json
{
  "title": "Recipe Title",
  "status": "PUBLISHED",
  "chefNotes": "Chef's personal tips...",
  "ingredients": [...],
  ...
}
```

### Seeding Process
The seed script (`prisma/seed.ts`):
1. Reads recipe JSON files
2. Creates recipes with `chefNotes` field
3. Field is optional - can be `null` or omitted

### Example Chef Notes
- "For extra chewy cookies, chill the dough for 30 minutes before baking."
- "The key to great sourdough is patience and a healthy starter."
- "Use room temperature ingredients for the best texture."

## File Storage (Development Mode)

When creating recipes in development mode, the system saves a JSON file:

**Location:** `prisma/data/recipes/[slug]/recipe.json`

**Content includes chefNotes:**
```json
{
  "title": "...",
  "chefNotes": "...",
  "ingredients": [...],
  "steps": [...]
}
```

**Implementation:** `app/api/recipes/route.ts`
```typescript
const recipeDataForFile = {
  // ... other fields
  chefNotes: fullRecipe.chefNotes,
  // ... other fields
};
await saveRecipeToFile(recipe.slug!, recipeDataForFile);
```

## Cloudinary Media Cleanup

### Problem
When resetting seed data, media files were left orphaned in Cloudinary.

### Solution
Enhanced the `clearExistingData()` function in `prisma/seed.ts`:

```typescript
async function clearExistingData() {
  // 1. Fetch all media records
  const allMedia = await prisma.media.findMany({
    select: { publicId: true, resourceType: true }
  });

  // 2. Delete from Cloudinary
  for (const media of allMedia) {
    await deleteCloudinaryAsset(
      media.publicId,
      media.resourceType === "VIDEO" ? "video" : "image"
    );
  }

  // 3. Delete database records
  await prisma.media.deleteMany({});
  // ... delete other tables
}
```

### Features
- ✅ Fetches all media before deletion
- ✅ Deletes from Cloudinary API
- ✅ Progress logging (every 10 deletions)
- ✅ Error handling (continues on failure)
- ✅ Summary report

## File Upload Workflow

The file upload process is **unchanged** by chefNotes integration:

1. **Client prepares upload**
   - Calls `/api/cloudinary/sign` to get signature
   - Receives upload credentials

2. **Client uploads to Cloudinary**
   - Direct upload to Cloudinary
   - Receives upload response with `public_id`, `url`, etc.

3. **Client persists Media record**
   - POST to `/api/media` with Cloudinary response
   - Creates Media record in database
   - Links to recipe via `recipeId`

4. **Recipe retrieval includes media**
   - GET `/api/recipes/[slug]` includes media relation
   - Returns full recipe with images

## Best Practices

### For Developers

1. **Always include chefNotes in RecipeData types**
   ```typescript
   interface RecipeData {
     chefNotes: string | null;
   }
   ```

2. **Handle nullable values**
   ```typescript
   const notes = recipe.chefNotes ?? "";
   ```

3. **Include in Prisma queries when needed**
   ```typescript
   const recipe = await prisma.recipe.findUnique({
     where: { slug },
     // chefNotes is included by default
   });
   ```

4. **Preserve chefNotes in updates**
   ```typescript
   // Don't overwrite if not provided
   chefNotes: chefNotes ?? existingRecipe.chefNotes
   ```

### For Content Authors

1. **Be specific and helpful**
   - ✅ "Use room temperature butter for better creaming"
   - ❌ "This is a great recipe"

2. **Share personal insights**
   - Tips learned from experience
   - Common mistakes to avoid
   - Variations that work well

3. **Keep it concise**
   - 1-2 sentences is ideal
   - Focus on the most important tip

## Testing Checklist

- [ ] Create new recipe with chef notes
- [ ] Edit recipe to update chef notes
- [ ] View recipe to see chef notes displayed
- [ ] Create recipe without chef notes (should work)
- [ ] Run seed script (should include chef notes)
- [ ] Upload image to recipe (should work)
- [ ] Reset seed data (should clean Cloudinary)

## Migration Guide

If you have existing recipes without chef notes:

### Database
No migration needed - field is nullable and defaults to NULL.

### Seed Data
Add `chefNotes` field after `status`:
```json
{
  "status": "PUBLISHED",
  "chefNotes": "Your chef tip here",
  ...
}
```

### Client Code
Chef notes are optional - no changes required for existing code.

## Troubleshooting

### Chef notes not saving
1. Check request body includes `chefNotes`
2. Verify field is in RecipeFormData type
3. Check console for validation errors

### Chef notes not displaying
1. Verify recipe has chefNotes in database
2. Check ChefNotes component is imported
3. Ensure recipe query includes chefNotes field

### Seed data fails
1. Check JSON syntax in recipe files
2. Verify chefNotes is a string
3. Check console for parsing errors

### Cloudinary cleanup fails
1. Verify Cloudinary credentials in .env
2. Check media publicId is valid
3. Review error logs for specific failures
4. Note: Script continues even if some deletions fail

## Related Files

- `prisma/schema.prisma` - Database schema
- `types/recipe.ts` - TypeScript types
- `prisma/seed.ts` - Seeding logic with Cloudinary cleanup
- `app/api/recipes/route.ts` - Recipe creation/update API
- `app/api/recipes/[slug]/route.ts` - Recipe retrieval/update API
- `app/(dashboard)/recipes/new/page.tsx` - Recipe creation form
- `app/(dashboard)/recipes/edit/[slug]/page.tsx` - Recipe edit form
- `app/(site)/recipes/[username]/[slug]/page.tsx` - Recipe display
- `lib/cloudinary.ts` - Cloudinary utilities
- `prisma/seed-data/*/recipe.json` - Seed data files

## Summary

The chefNotes field is fully integrated across:
- ✅ Database schema
- ✅ TypeScript types
- ✅ API endpoints (create, update, retrieve)
- ✅ Client forms (create, edit)
- ✅ Recipe display
- ✅ Seed data (all 15 recipes)
- ✅ File storage
- ✅ Cloudinary cleanup

No breaking changes were introduced. The field is optional and backward-compatible.
