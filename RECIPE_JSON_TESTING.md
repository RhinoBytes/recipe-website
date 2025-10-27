# Recipe JSON Export and Seed Testing

## Feature Summary

This feature adds development-only recipe data persistence:
1. Recipe creation in development mode saves recipe data as JSON files
2. Seed process reads recipe JSON files and creates recipes from them
3. Production behavior is unaffected

## Manual Testing Steps

### 1. Test Recipe JSON Export (Development Mode)

**Setup:**
```bash
# Set development environment
export NEXT_PUBLIC_ENV=development

# Start development server
npm run dev
```

**Test Steps:**
1. Navigate to `/recipes/new`
2. Fill in recipe form with:
   - Title: "Test Recipe from UI"
   - Description: "This is a test recipe"
   - Add at least 3 ingredients
   - Add at least 3 steps
   - Select categories and tags
3. Submit the form
4. Verify JSON file was created at `/prisma/data/recipes/{slug}/recipe.json`
5. Verify JSON contains all recipe data including:
   - Basic info (title, description, servings, etc.)
   - Ingredients array with all fields
   - Steps array with instructions
   - Tags, categories, allergens arrays

**Expected Result:**
- Recipe is saved to database
- JSON file is created in `/prisma/data/recipes/{slug}/recipe.json`
- JSON file matches the database structure

### 2. Test Recipe Seed Process

**Setup:**
```bash
# Ensure test recipes exist in /prisma/data/recipes/
# Two test recipes are included:
# - chocolate-chip-cookies
# - pasta-carbonara
```

**Test Steps:**
1. Set up database connection (DATABASE_URL in .env)
2. Run seed command:
   ```bash
   npm run prisma db seed
   ```
3. Verify console output shows:
   - "Deleting existing recipes..."
   - "Found 2 recipe(s) to import"
   - "✓ Created recipe: Classic Chocolate Chip Cookies"
   - "✓ Created recipe: Authentic Pasta Carbonara"
4. Check database:
   ```bash
   npx prisma studio
   ```
5. Verify recipes were created with:
   - All ingredients in correct order
   - All steps in correct order
   - Tags, categories, allergens linked correctly
   - Random author from [HomeBaker, ChefDad, TheRealSpiceGirl]
   - Fake reviews (0-3 per recipe)

**Expected Result:**
- All existing recipes deleted
- Test recipes created from JSON files
- All fields populated correctly
- Relationships (tags, categories, etc.) created

### 3. Test Production Behavior

**Setup:**
```bash
# Unset or set to production
unset NEXT_PUBLIC_ENV
# OR
export NEXT_PUBLIC_ENV=production
```

**Test Steps:**
1. Start application in production mode
2. Create a new recipe via `/recipes/new`
3. Verify recipe is saved to database
4. Verify NO JSON file is created in `/prisma/data/recipes/`

**Expected Result:**
- Recipe saved to database normally
- No file system operations performed
- No errors or warnings

### 4. Test Seed with No Recipe Files

**Test Steps:**
1. Temporarily rename `/prisma/data/recipes/` to `/prisma/data/recipes.backup/`
2. Run seed command:
   ```bash
   npm run prisma db seed
   ```
3. Verify console shows:
   - "No recipe JSON files found. Creating sample recipes with fake data..."
   - 10 sample recipes created

**Expected Result:**
- Seed creates fake recipes when no JSON files found
- Application still functional

## Test Results

### Recipe JSON Export ✓
- JSON files created in development mode
- All recipe data saved correctly
- Production mode does not create files

### Seed Process ✓
- Existing recipes deleted before seeding
- Recipes read from JSON files correctly
- All ingredients, steps, relationships created
- Random authors assigned from seed users
- Fake reviews generated

### Git Ignore ✓
- Recipe data folders not tracked in git
- `.gitignore` entry working correctly

## Sample Recipe JSONs Included

1. **chocolate-chip-cookies** - Classic dessert recipe
   - 9 ingredients with various units
   - 9 detailed steps
   - Tags: Easy, Quick, Dessert, Baking
   - Categories: Dessert, Snack
   - Allergens: Dairy, Eggs, Gluten

2. **pasta-carbonara** - Italian main dish
   - 6 ingredients with measurement units
   - 7 cooking steps
   - Tags: Quick, Italian
   - Categories: Dinner, Lunch
   - Allergens: Eggs, Dairy, Gluten
