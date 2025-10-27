# MVP Gap Analysis — Recipe Website

## Executive summary

This recipe website has a solid foundation with authentication, recipe creation with AI-powered formatting, and recipe display features fully implemented. However, critical user-facing features are missing, including search/filtering (P0), user profile/dashboard (P0), image upload (P1), favorites (P1), comments (P1), ratings (P1), collections (P2), and sharing links (P2). The AI formatter currently uses a mock implementation that needs OpenAI API integration. While the core infrastructure (Prisma schema, authentication, basic CRUD) is production-ready, the application lacks the interactive features users expect from a modern recipe platform. Priority should be given to implementing search functionality and enhancing the user profile page to create a complete MVP experience.

## Quick snapshot
- Repo: RhinoBytes/recipe-website @ copilot/create-mvp-gap-analysis-doc
- Date: 2025-10-27
- Analysis: static code review only

## Feature matrix
- Authentication: **present** — Full JWT-based auth with login/register/logout
- Recipe create/edit: **partial** — Create works; edit missing
- AI formatter (OpenAI): **partial** — Mock implementation present; real AI integration missing
- Search: **missing** — No search or filter functionality
- User profile & dashboard: **partial** — Basic profile page exists; dashboard/recipe management missing
- Image upload/display: **partial** — Display works; URL input only; no file upload
- Favorites/bookmarks: **missing** — Schema exists; no UI or API endpoints
- Comments: **missing** — No implementation (Review model exists for ratings, not comments)
- Ratings: **partial** — Schema exists (Review model); no UI or API endpoints
- Collections: **missing** — No schema, UI, or API
- Sharing links: **missing** — No social sharing functionality

## Prioritized checklist (P0/P1/P2)

### P0 (Critical for MVP)
- [ ] Search/filter recipes — Users must be able to find recipes by title, ingredients, tags, categories
- [ ] User dashboard — Users need to see and manage their own recipes
- [ ] Recipe edit functionality — Recipe authors must be able to update their published recipes
- [ ] OpenAI API integration — Replace mock AI formatter with real OpenAI integration

### P1 (Important for launch)
- [ ] Favorites/bookmarks system — Users should be able to save recipes for later
- [ ] Ratings & reviews UI — Users need to rate and review recipes
- [ ] Image file upload — Replace URL input with actual file upload (S3/Cloudinary)
- [ ] Browse page implementation — Currently shows placeholder; needs recipe grid with pagination
- [ ] Recipe delete functionality — Authors should be able to remove their recipes

### P2 (Nice to have)
- [ ] Collections feature — Users can organize recipes into custom collections
- [ ] Social sharing — Share buttons for Facebook, Twitter, Pinterest, email
- [ ] Comments system — Distinct from ratings; threaded discussions on recipes
- [ ] Recipe printing — Printer-friendly view
- [ ] Advanced search filters — By prep time, cook time, calories, allergens, etc.
- [ ] User following system — Follow favorite chefs/authors

## File-level pointers

### Feature: Search/Filter — Priority: P0
  - Problem: No search functionality exists; browse page is a placeholder
  - Files:
    - https://github.com/RhinoBytes/recipe-website/blob/copilot/create-mvp-gap-analysis-doc/app/(site)/browse/page.tsx — Placeholder page with TODO comment
    - https://github.com/RhinoBytes/recipe-website/blob/copilot/create-mvp-gap-analysis-doc/app/api/recipes/route.ts — GET endpoint returns all recipes without filters
  - Recommended fix: Add API endpoint `/api/recipes/search` with query params (q, category, tag, allergen, maxPrepTime, maxCalories); implement browse page with search bar, filter chips, and recipe grid with pagination.

### Feature: User Dashboard — Priority: P0
  - Problem: Profile page only shows user info; no recipe management
  - Files:
    - https://github.com/RhinoBytes/recipe-website/blob/copilot/create-mvp-gap-analysis-doc/app/(site)/profile/page.tsx — Basic profile page with logout button only
  - Recommended fix: Extend profile page with tabs (My Recipes, Favorites, Settings); add recipe list with edit/delete actions; create `/api/user/recipes` endpoint to fetch user's recipes.

### Feature: Recipe Edit — Priority: P0
  - Problem: No edit functionality; users cannot update published recipes
  - Files:
    - https://github.com/RhinoBytes/recipe-website/blob/copilot/create-mvp-gap-analysis-doc/app/recipes/new/page.tsx — Only handles creation
    - https://github.com/RhinoBytes/recipe-website/blob/copilot/create-mvp-gap-analysis-doc/app/api/recipes/[slug]/route.ts — Only has GET handler
  - Recommended fix: Add `/recipes/edit/[slug]` page reusing form from `/recipes/new`; add PUT/PATCH handler to `/api/recipes/[slug]/route.ts` with authorization check (must be author); add "Edit" button on recipe detail page (visible to author only).

### Feature: OpenAI Integration — Priority: P0
  - Problem: AI formatter uses mock text parsing instead of real AI
  - Files:
    - https://github.com/RhinoBytes/recipe-website/blob/copilot/create-mvp-gap-analysis-doc/app/api/ai/format-recipe/route.ts — Contains parseRecipeText() mock function
  - Recommended fix: Add OPENAI_API_KEY to .env; install openai package; replace parseRecipeText() with OpenAI API call using GPT-4 with structured output (JSON mode); use prompt from Appendix A.

### Feature: Favorites/Bookmarks — Priority: P1
  - Problem: FavoriteRecipe schema exists but no UI or API
  - Files:
    - https://github.com/RhinoBytes/recipe-website/blob/copilot/create-mvp-gap-analysis-doc/prisma/schema.prisma — Lines 115-124 (FavoriteRecipe model defined)
    - https://github.com/RhinoBytes/recipe-website/blob/copilot/create-mvp-gap-analysis-doc/app/recipes/[slug]/page.tsx — Recipe detail page missing favorite button
  - Recommended fix: Create `/api/favorites` POST/DELETE endpoints; add heart icon button to recipe detail page; add "Favorites" tab to profile page showing favorited recipes.

### Feature: Ratings & Reviews — Priority: P1
  - Problem: Review schema exists but no UI or API to create reviews
  - Files:
    - https://github.com/RhinoBytes/recipe-website/blob/copilot/create-mvp-gap-analysis-doc/prisma/schema.prisma — Lines 103-113 (Review model defined)
    - https://github.com/RhinoBytes/recipe-website/blob/copilot/create-mvp-gap-analysis-doc/app/recipes/[slug]/page.tsx — Recipe detail page doesn't show reviews
  - Recommended fix: Create `/api/recipes/[slug]/reviews` POST/GET endpoints; add review section to recipe detail page with star rating input and comment textarea; display average rating and review list.

### Feature: Image Upload — Priority: P1
  - Problem: Only URL input supported; no file upload capability
  - Files:
    - https://github.com/RhinoBytes/recipe-website/blob/copilot/create-mvp-gap-analysis-doc/app/recipes/new/page.tsx — Line 383-388 (imageUrl text input)
  - Recommended fix: Add image storage service (AWS S3 or Cloudinary); create `/api/upload` endpoint with multipart/form-data support; replace URL input with file input and image preview; store uploaded image URL in recipe.imageUrl.

### Feature: Browse Page — Priority: P1
  - Problem: Browse page shows placeholder text instead of recipes
  - Files:
    - https://github.com/RhinoBytes/recipe-website/blob/copilot/create-mvp-gap-analysis-doc/app/(site)/browse/page.tsx — Line 9-12 (TODO comment)
  - Recommended fix: Fetch recipes with pagination; display in responsive grid layout; add category filter sidebar; integrate with search functionality.

### Feature: Recipe Delete — Priority: P1
  - Problem: No way for authors to delete their recipes
  - Files:
    - https://github.com/RhinoBytes/recipe-website/blob/copilot/create-mvp-gap-analysis-doc/app/api/recipes/[slug]/route.ts — Missing DELETE handler
  - Recommended fix: Add DELETE handler to `/api/recipes/[slug]/route.ts` with authorization; add delete button to recipe edit page with confirmation dialog; soft delete by setting isPublished=false or hard delete with cascade.

### Feature: Collections — Priority: P2
  - Problem: No collections feature exists at all
  - Files:
    - https://github.com/RhinoBytes/recipe-website/blob/copilot/create-mvp-gap-analysis-doc/prisma/schema.prisma — No Collection model
  - Recommended fix: Add Collection and CollectionRecipe models to schema; create CRUD endpoints at `/api/collections`; add "Add to Collection" button on recipe pages; add "Collections" tab to profile page.

### Feature: Social Sharing — Priority: P2
  - Problem: No sharing functionality exists
  - Files:
    - https://github.com/RhinoBytes/recipe-website/blob/copilot/create-mvp-gap-analysis-doc/app/recipes/[slug]/page.tsx — Recipe detail page missing share buttons
  - Recommended fix: Add share button group to recipe detail page with links to Facebook, Twitter, Pinterest (using their share APIs); add "Copy Link" button; optionally add Open Graph meta tags for rich previews.

## Quick wins

1. **Browse page implementation** — Reuse existing API endpoints (`/api/recipes/recent`, `/api/recipes/popular`) and add pagination/grid layout to browse page. Estimated: 2-3 hours.

2. **Edit recipe button** — Add "Edit Recipe" link on detail page (visible only to author) that navigates to edit page with pre-filled form. Estimated: 1 hour.

3. **Basic search** — Add simple text search to `/api/recipes` endpoint filtering by title/description with SQL ILIKE. Update browse page to include search input. Estimated: 2 hours.

4. **Favorite button** — Implement favorites API endpoints and add heart button to recipe detail page. Estimated: 3-4 hours.

5. **User recipes list** — Add "My Recipes" section to profile page showing logged-in user's recipes with edit/delete links. Estimated: 2-3 hours.

## Implementation plan

1. **Phase 1: Core Search & Discovery (P0)**
   - Implement search API with filters (title, category, tag, ingredient)
   - Build browse page with search bar, category filters, and recipe grid
   - Add pagination support to handle large recipe sets
   - Duration: 1 week

2. **Phase 2: User Dashboard & Recipe Management (P0)**
   - Extend profile page with tabbed interface (My Recipes, Favorites, Settings)
   - Implement recipe edit functionality (page and API)
   - Add recipe delete functionality with confirmation
   - Create user recipes API endpoint
   - Duration: 1 week

3. **Phase 3: OpenAI Integration (P0)**
   - Set up OpenAI API credentials and environment variables
   - Replace mock parser with OpenAI structured output
   - Design and test recipe formatting prompt
   - Handle API errors and rate limiting
   - Duration: 3-4 days

4. **Phase 4: Social Features (P1)**
   - Implement favorites/bookmarks system (API + UI)
   - Build ratings & reviews functionality
   - Add review display to recipe detail page
   - Show average rating and review count
   - Duration: 1 week

5. **Phase 5: Image Upload (P1)**
   - Set up cloud storage service (S3 or Cloudinary)
   - Create upload API endpoint with file validation
   - Replace URL input with file picker and image preview
   - Add image compression/optimization
   - Duration: 3-4 days

6. **Phase 6: Advanced Features (P2)**
   - Implement collections system (schema, API, UI)
   - Add social sharing buttons
   - Build comments system (separate from reviews)
   - Add printer-friendly recipe view
   - Duration: 2 weeks

## Appendix A — OpenAI formatter prompt & expected JSON

### Prompt Template

```
You are a recipe formatting assistant. Convert the following unstructured recipe text into a structured JSON format.

Recipe Text:
"""
{USER_PROVIDED_TEXT}
"""

Extract and format the following information:
- title: Recipe name (string)
- description: Brief description (string)
- servings: Number of servings (integer)
- prepTimeMinutes: Preparation time in minutes (integer)
- cookTimeMinutes: Cooking time in minutes (integer)
- ingredients: Array of objects with:
  - amount: Numeric quantity (number or null)
  - unit: Measurement unit (string or null)
  - name: Ingredient name (string)
  - displayOrder: Position in list (integer, starting from 0)
- instructions: Step-by-step cooking instructions (string, use newlines to separate steps)
- tags: Array of relevant tags (strings) such as "Vegetarian", "Quick & Easy", "Gluten-Free"
- categories: Array of category names (strings) such as "Breakfast", "Dinner", "Desserts"
- allergens: Array of allergen names (strings) such as "Dairy", "Nuts", "Wheat", "Eggs"
- calories: Estimated calories per serving (integer or null)
- proteinG: Estimated protein in grams per serving (integer or null)
- fatG: Estimated fat in grams per serving (integer or null)
- carbsG: Estimated carbohydrates in grams per serving (integer or null)

If information is missing, use reasonable defaults or null. For nutrition information, provide best estimates based on the ingredients.

Respond ONLY with valid JSON, no additional text.
```

### Expected JSON Shape (mapped to Prisma schema)

```json
{
  "title": "Honey Garlic Glazed Salmon",
  "description": "Perfectly flaky salmon with a sweet and savory glaze",
  "servings": 4,
  "prepTimeMinutes": 10,
  "cookTimeMinutes": 15,
  "ingredients": [
    {
      "amount": 4,
      "unit": null,
      "name": "salmon fillets",
      "displayOrder": 0
    },
    {
      "amount": 2,
      "unit": "tbsp",
      "name": "olive oil",
      "displayOrder": 1
    },
    {
      "amount": 0.33,
      "unit": "cup",
      "name": "honey",
      "displayOrder": 2
    },
    {
      "amount": 4,
      "unit": "cloves",
      "name": "garlic, minced",
      "displayOrder": 3
    },
    {
      "amount": 3,
      "unit": "tbsp",
      "name": "soy sauce",
      "displayOrder": 4
    },
    {
      "amount": null,
      "unit": null,
      "name": "salt and pepper to taste",
      "displayOrder": 5
    }
  ],
  "instructions": "1. Season salmon fillets with salt and pepper.\n2. Heat olive oil in a large pan over medium-high heat.\n3. Place salmon skin-side down and cook for 4 minutes.\n4. While salmon cooks, mix honey, minced garlic, and soy sauce in a bowl.\n5. Flip salmon fillets carefully.\n6. Pour the honey garlic sauce over the salmon.\n7. Cook for an additional 3-4 minutes until salmon is cooked through and glaze is slightly thickened.\n8. Serve immediately with rice or vegetables.",
  "tags": ["Seafood", "Quick & Easy", "Gluten-Free"],
  "categories": ["Dinner", "Main Course"],
  "allergens": ["Fish", "Soy", "Sesame"],
  "calories": 320,
  "proteinG": 35,
  "fatG": 12,
  "carbsG": 18
}
```

### Mapping to Prisma Schema

The JSON structure directly maps to the Recipe model and related models:

- Root fields → `Recipe` model (title, description, servings, etc.)
- `ingredients[]` → `RecipeIngredient` model records (created in transaction)
- `tags[]` → Create/connect `Tag` records via `RecipesTags` join table
- `categories[]` → Connect `Category` records via `RecipesCategories` join table
- `allergens[]` → Connect `Allergen` records via `RecipesAllergens` join table

## Appendix B — Proposed Prisma models (if missing)

### Collection Model (for recipe organization)

```prisma
model Collection {
  id          String              @id @default(uuid())
  userId      String
  name        String
  description String?
  isPublic    Boolean             @default(false)
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt

  user        User                @relation(fields: [userId], references: [id])
  recipes     CollectionRecipes[]

  @@index([userId])
}

model CollectionRecipes {
  collectionId  String
  recipeId      String
  addedAt       DateTime  @default(now())
  note          String?

  collection    Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  recipe        Recipe     @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  @@id([collectionId, recipeId])
}
```

Add to User model:
```prisma
collections   Collection[]
```

Add to Recipe model:
```prisma
collections   CollectionRecipes[]
```

### Comment Model (separate from Review/ratings)

```prisma
model Comment {
  id          String    @id @default(uuid())
  recipeId    String
  userId      String
  parentId    String?
  content     String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  recipe      Recipe    @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id])
  parent      Comment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies     Comment[] @relation("CommentReplies")

  @@index([recipeId])
  @@index([userId])
}
```

Add to User model:
```prisma
comments      Comment[]
```

Add to Recipe model:
```prisma
comments      Comment[]
```

### Enhanced User Model (for social features)

```prisma
// Add to existing User model
model User {
  // ... existing fields ...
  
  // Social features
  following     UserFollow[] @relation("Following")
  followers     UserFollow[] @relation("Followers")
  
  // New relations
  collections   Collection[]
  comments      Comment[]
}

model UserFollow {
  followerId    String
  followingId   String
  createdAt     DateTime  @default(now())

  follower      User      @relation("Following", fields: [followerId], references: [id], onDelete: Cascade)
  following     User      @relation("Followers", fields: [followingId], references: [id], onDelete: Cascade)

  @@id([followerId, followingId])
}
```

## Appendix C — Acceptance tests

### Manual test 1: Search and filter recipes
1. Navigate to `/browse` page
2. Enter search term "salmon" in search box
3. Verify recipes containing "salmon" in title or description appear
4. Click "Seafood" category filter
5. Verify only seafood recipes are displayed
6. Clear filters and verify all recipes return
7. Test pagination by navigating to page 2

### Manual test 2: Create and edit recipe workflow
1. Login as test user (chef_alice / password123)
2. Navigate to `/recipes/new`
3. Create a recipe titled "Test Recipe Edit"
4. Click "Publish Recipe" and verify redirect to recipe detail page
5. Click "Edit Recipe" button (visible because you're the author)
6. Update recipe title to "Test Recipe Edited"
7. Save changes and verify updated title appears on detail page
8. Navigate to `/profile` and verify recipe appears in "My Recipes" tab

### Manual test 3: Favorites and ratings
1. Login as test user (baker_bob / password123)
2. Navigate to any recipe detail page
3. Click heart icon to favorite the recipe
4. Verify heart icon fills/changes state
5. Navigate to `/profile` and click "Favorites" tab
6. Verify favorited recipe appears in list
7. Return to recipe detail page
8. Submit a 5-star rating with comment "Delicious!"
9. Verify rating appears in reviews section
10. Verify average rating updates

### Manual test 4: AI recipe formatting
1. Navigate to `/recipes/new`
2. Switch to "Paste & Format" mode
3. Paste unstructured recipe text with ingredients and instructions
4. Click "Format Recipe with AI"
5. Verify AI correctly extracts title, ingredients with amounts/units
6. Verify instructions are properly formatted
7. Verify tags and allergens are auto-detected
8. Verify nutrition information is calculated
9. Make manual adjustments if needed
10. Publish and verify recipe displays correctly

### Manual test 5: Collections organization
1. Login as test user
2. Navigate to `/profile` and click "Collections" tab
3. Click "Create Collection" button
4. Name collection "Weeknight Dinners" and save
5. Navigate to a quick recipe (< 30 min total time)
6. Click "Add to Collection" button
7. Select "Weeknight Dinners" from dropdown
8. Navigate back to `/profile` > "Collections"
9. Click "Weeknight Dinners" collection
10. Verify recipe appears in collection

### Manual test 6: Image upload
1. Navigate to `/recipes/new`
2. In "Image" section, click "Choose File" button
3. Select a JPG/PNG image from computer (< 5MB)
4. Verify image preview appears
5. Complete recipe form and publish
6. Verify uploaded image displays on recipe detail page
7. Verify image URL is stored in database (S3/Cloudinary URL)

### Manual test 7: Social sharing
1. Navigate to any recipe detail page
2. Click "Share" button to reveal share options
3. Click Facebook share button
4. Verify Facebook share dialog opens with recipe title and image
5. Close dialog and click "Copy Link" button
6. Verify success message appears
7. Paste link in new browser tab
8. Verify recipe loads correctly

### Manual test 8: Recipe deletion
1. Login as recipe author
2. Navigate to your recipe detail page
3. Click "Edit Recipe" button
4. Click "Delete Recipe" button at bottom of edit form
5. Verify confirmation dialog appears with warning message
6. Click "Confirm Delete"
7. Verify redirect to profile page
8. Verify recipe no longer appears in "My Recipes" list
9. Attempt to navigate to deleted recipe's URL
10. Verify 404 page appears
