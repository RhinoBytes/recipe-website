# Recipe Website - Manual Testing Guide

## Prerequisites
- PostgreSQL database running
- DATABASE_URL environment variable set
- JWT_SECRET environment variable set

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run database migrations:
```bash
npx prisma migrate dev
```

3. Seed the database:
```bash
npx prisma db seed
```

## Test Credentials

The seed file creates the following users:
- **Username**: chef_alice, **Email**: alice@example.com, **Password**: password123
- **Username**: baker_bob, **Email**: bob@example.com, **Password**: password123
- **Username**: admin, **Email**: admin@example.com, **Password**: password123

## Testing Checklist

### 1. Authentication Flow
- [ ] Navigate to `/auth`
- [ ] Login with one of the test credentials
- [ ] Verify you're redirected to the home page
- [ ] Check that the navbar shows the logged-in user's name

### 2. Recipe Creation - Manual Entry Mode
- [ ] Click "Create Recipe" in the user dropdown (should navigate to `/recipes/new`)
- [ ] Fill in the following fields:
  - Title: "Test Recipe Manual"
  - Description: "This is a test recipe"
  - Servings: 4
  - Prep Time: 15 minutes
  - Cook Time: 30 minutes
- [ ] Add at least 3 ingredients with amounts and units
- [ ] Write instructions (multiple steps)
- [ ] Add tags (e.g., "Quick", "Easy")
- [ ] Select at least one category
- [ ] Select allergens if applicable
- [ ] Click "Format & Validate with AI"
- [ ] Verify nutrition info appears (calories, protein, fat, carbs)
- [ ] Click "Publish Recipe"
- [ ] Verify you're redirected to the recipe detail page at `/recipes/test-recipe-manual`

### 3. Recipe Creation - Paste & Format Mode
- [ ] Navigate to `/recipes/new`
- [ ] Switch to "Paste & Format" mode
- [ ] Paste the following sample recipe:

```
Honey Garlic Salmon

Perfectly flaky salmon with a sweet and savory glaze.

4 servings
Prep time: 10 min
Cook time: 15 min

Ingredients:
4 salmon fillets
2 tbsp olive oil
1/3 cup honey
4 cloves garlic, minced
3 tbsp soy sauce
Salt and pepper to taste

Instructions:
1. Season salmon with salt and pepper
2. Heat oil in a pan over medium-high heat
3. Cook salmon skin-side down for 4 minutes
4. Mix honey, garlic, and soy sauce
5. Flip salmon and pour sauce over
6. Cook for 3-4 more minutes
7. Serve immediately
```

- [ ] Click "Format Recipe with AI"
- [ ] Verify the form is populated with parsed data
- [ ] Review and edit if needed
- [ ] Click "Format & Validate with AI"
- [ ] Click "Publish Recipe"
- [ ] Verify you're redirected to the recipe detail page

### 4. Recipe Detail Page Display
- [ ] Navigate to one of the created recipes
- [ ] Verify all fields are displayed correctly:
  - [ ] Title
  - [ ] Description
  - [ ] Author information
  - [ ] Hero image (if URL was provided)
  - [ ] Prep time, cook time, servings cards
  - [ ] Nutrition information (calories, protein, fat, carbs)
  - [ ] Tags (if any)
  - [ ] Categories (if any)
  - [ ] Allergen warnings (if any)
  - [ ] Ingredients list with amounts and units
  - [ ] Instructions

### 5. Recipe List API
- [ ] Navigate to `/api/recipes`
- [ ] Verify JSON response contains all published recipes
- [ ] Check that relations (author, tags, categories) are included

### 6. Recipe by Slug API
- [ ] Navigate to `/api/recipes/classic-spaghetti-carbonara`
- [ ] Verify JSON response contains the full recipe with:
  - Author details
  - Ingredients (ordered by displayOrder)
  - Tags
  - Categories
  - Allergens

### 7. Old Routes Redirect
- [ ] Navigate to `/new-recipe` (old route)
- [ ] Verify you're redirected to `/recipes/new`
- [ ] Navigate to `/classic-spaghetti-carbonara` (old route pattern)
- [ ] Verify you're redirected to `/recipes/classic-spaghetti-carbonara`

### 8. Categories & Allergens API
- [ ] Navigate to `/api/categories`
- [ ] Verify JSON response contains all categories
- [ ] Navigate to `/api/allergens`
- [ ] Verify JSON response contains all allergens

### 9. Authentication Protection
- [ ] Log out
- [ ] Try to navigate to `/recipes/new`
- [ ] Verify you're redirected to `/auth` (login page)
- [ ] Log back in
- [ ] Verify you can access `/recipes/new` again

### 10. AI Formatting Endpoint
You can test this with curl:

```bash
# Test with raw text
curl -X POST http://localhost:3000/api/ai/format-recipe \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -d '{
    "text": "Grilled Cheese\n2 slices bread\n1 slice cheese\n1. Butter bread\n2. Add cheese\n3. Grill until golden"
  }'

# Test with structured data
curl -X POST http://localhost:3000/api/ai/format-recipe \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -d '{
    "data": {
      "title": "Simple Pasta",
      "servings": 2,
      "prepTimeMinutes": 5,
      "cookTimeMinutes": 10,
      "ingredients": [
        {"amount": 200, "unit": "g", "name": "pasta", "displayOrder": 0}
      ]
    }
  }'
```

## Expected Behavior Summary

1. **Recipe Creation**: Users must be authenticated and AI formatting must be completed before publishing
2. **Recipe Display**: All recipe data including nutrition is displayed on the detail page
3. **API Endpoints**: All endpoints return proper JSON responses with correct relations
4. **Redirects**: Old routes properly redirect to new routes
5. **Authentication**: Protected pages require login and redirect unauthenticated users

## Known Limitations

- The AI formatting is a mock implementation that does basic text parsing
- Image upload is not implemented (only URL input)
- Nutrition values are estimated based on ingredient count
- No real AI model integration (this would require OpenAI API key or similar)
