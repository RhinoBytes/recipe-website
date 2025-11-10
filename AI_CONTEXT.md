---
# AI Context Document
# Last Updated: 2025-11-05
# Updated By: AI (Initial Creation)
# Version: 1.0.0

project:
  name: "CookBook - Recipe Website"
  description: "A Next.js-based recipe sharing platform where users can discover, create, share, and review recipes with full-featured recipe management"
  repository: "RhinoBytes/recipe-website"

tech_stack:
  framework: "Next.js 15.5.5 (App Router with Turbopack)"
  runtime: "Node.js 20+"
  language: "TypeScript 5.9.3 (strict mode enabled)"
  database:
    provider: "PostgreSQL"
    host: "Supabase"
    orm: "Prisma 6.18.0"
    connection: "Connection pooling via DATABASE_URL"
  styling: "Tailwind CSS 4"
  hosting: "Vercel (Serverless)"
  storage: "Supabase Storage"
  auth: "Custom JWT with bcrypt (HTTP-only cookies)"
  ai: "OpenAI API (recipe formatting)"

conventions:
  file_naming:
    components: "PascalCase.tsx (e.g., RecipeCard.tsx)"
    utilities: "kebab-case.ts (e.g., category-utils.ts)"
    api_routes: "route.ts in app/api/*"
    pages: "page.tsx in app/*"
    layouts: "layout.tsx in app/*"
    types: "camelCase.ts or PascalCase.ts"

  folder_structure:
    feature_components: "components/[feature]/* (e.g., components/recipe/*, components/auth/*)"
    shared_ui: "components/ui/* - reusable UI components"
    layout_components: "components/layout/* - Navbar, Footer, etc."
    utilities: "lib/[domain].ts or lib/[domain]-utils.ts"
    queries: "lib/queries/* - database query functions"
    schemas: "lib/schemas/* - Zod validation schemas"
    types: "types/* - TypeScript type definitions"
    context: "context/* - React Context providers"
    hooks: "hooks/* - Custom React hooks"

  import_patterns:
    aliases:
      - "@/*": "./* (root)"
      - "@components/*": "./components/*"
      - "@lib/*": "./lib/*"
      - "@styles/*": "./styles/*"
    prefer_named_exports: "Use named exports over default exports (exceptions: page.tsx, layout.tsx)"
    client_directive: "Add 'use client' at top of file when using hooks, browser APIs, or interactivity"

patterns:
  server_components:
    default: "Components in app/ are Server Components by default"
    data_fetching: "Fetch data directly in Server Components using async/await and Prisma"
    no_hooks: "Cannot use useState, useEffect, or other React hooks"
    async_allowed: "Can be async functions that await data"

  client_components:
    directive: "Must have 'use client' at top of file"
    state: "Use useState, useReducer for local state"
    effects: "Use useEffect sparingly, prefer server-side data fetching"
    context: "Can use Context (AuthContext, etc.)"
    browser_apis: "Can access window, localStorage, etc."

  data_fetching:
    server: "Use Prisma directly in Server Components and API routes"
    client: "Use fetch() to call API routes from client components"
    caching: "Leverage Next.js cache with revalidate option"
    parallel: "Use Promise.all() for independent parallel queries"

  error_handling:
    boundaries: "Use ErrorBoundary component for component-level errors"
    api_routes: "Use try/catch with appropriate HTTP status codes"
    logging: "Use pino logger from @/lib/logger"
    format: "Return { error: 'message' } with status code"

  authentication:
    mechanism: "Custom JWT tokens stored in HTTP-only cookies"
    middleware: "middleware.ts protects /dashboard, /profile, /new-recipe routes"
    session: "Use getUserFromSession() in Server Components"
    client_context: "Use useAuth() hook from AuthContext in Client Components"
    token_expiry: "7 days (JWT_EXPIRES_IN)"

anti_patterns:
  serverless:
    avoid:
      - "localStorage/sessionStorage in initial render (causes hydration errors)"
      - "Long-running connections without connection pooling"
      - "File system writes outside of /tmp (use Supabase Storage instead)"
      - "setInterval/setTimeout for background jobs (use external cron)"
      - "Large bundle sizes (impacts cold starts)"
      - "Creating new Prisma instances (use singleton from @/lib/prisma)"

  database:
    avoid:
      - "N+1 queries (use Prisma include/select to fetch related data)"
      - "Sequential queries (use Promise.all for parallel execution)"
      - "Fetching all data then filtering in JS (filter in SQL/Prisma)"
      - "Not using connection pooling (always use DATABASE_URL from env)"

  components:
    avoid:
      - "Creating duplicate utilities when existing ones exist in lib/"
      - "Installing new packages when existing ones work"
      - "Mixing server and client component concerns"
      - "Using 'use client' unnecessarily (only when hooks/browser APIs needed)"

utilities_index:
  database:
    file: "lib/prisma.ts"
    exports:
      - prisma: "Singleton Prisma client - ALWAYS import this, never create new instances"
    usage: "import { prisma } from '@/lib/prisma'"

  authentication:
    file: "lib/auth.ts"
    functions:
      - hashPassword: "Hash passwords with bcrypt"
      - verifyPassword: "Verify password against hash"
      - createToken: "Create JWT token"
      - verifyToken: "Verify and decode JWT token"
      - setAuthCookie: "Set HTTP-only auth cookie"
      - deleteAuthCookie: "Remove auth cookie"
      - getUserFromSession: "Get current user from session cookie (server-side)"
      - getCurrentUser: "Get current user with validation (server-side)"
    usage: "Use for all authentication operations"

  category_operations:
    file: "lib/category-utils.ts"
    functions:
      - getDescendantCategoryIds: "Get all child category IDs recursively (single category)"
      - buildCategoryTree: "Convert flat categories to hierarchical tree structure"
      - getDescendantCategoryIdsForMultiple: "Get descendants for multiple categories (optimized)"
    note: "Categories are hierarchical - ALWAYS use these helpers for category operations"

  recipe_queries:
    file: "lib/queries/recipes.ts"
    functions:
      - formatRecipeWithRatings: "Format recipe with calculated ratings"
      - searchRecipes: "Search recipes with filters (categories, tags, cuisines, etc.)"
      - getPrimaryImageUrl: "Extract primary image from media array"
      - getProfileAvatarUrl: "Extract profile avatar from media array"
    usage: "Use for all recipe data fetching and formatting"

  validation:
    file: "lib/schemas/recipe.ts"
    exports:
      - RecipeSchema: "Zod schema for recipe validation"
    file2: "lib/validation/password.ts"
    exports:
      - validatePassword: "Password validation rules"
    usage: "Use Zod schemas for API input validation"

  logging:
    file: "lib/logger.ts"
    exports:
      - log: "Pino logger instance"
    usage: "import { log } from '@/lib/logger'; log.info(), log.error(), etc."
    methods: "log.info(), log.error(), log.warn(), log.debug()"

  storage:
    file: "lib/recipeStorage.ts"
    functions:
      - saveRecipeToFile: "Save recipe to Supabase Storage"
    file2: "lib/uploadHelper.ts"
    functions:
      - uploadToSupabase: "Upload files to Supabase Storage"
    note: "Use Supabase Storage for all file uploads (images, videos)"

  supabase:
    file: "lib/supabase/server.ts"
    exports:
      - createServerSupabaseClient: "Create Supabase client for server-side"
    file2: "lib/supabase/client.ts"
    exports:
      - createBrowserSupabaseClient: "Create Supabase client for browser"
    usage: "Use appropriate client based on context (server vs client)"

  constants:
    file: "lib/constants.ts"
    exports:
      - AUTH_COOKIE_NAME: "Name of auth cookie"
      - AUTH_COOKIE_MAX_AGE: "Cookie expiry time"
      - PASSWORD_MIN_LENGTH: "Minimum password length"
      - JWT_EXPIRES_IN: "JWT token expiry"
      - API_ROUTES: "API route constants"
      - PAGE_ROUTES: "Page route constants"
      - PROTECTED_ROUTES: "Routes requiring authentication"
      - DEFAULT_PAGE_SIZE: "Pagination default"
    file2: "config/constants.ts"
    note: "Same as lib/constants.ts - both exist, prefer lib/constants.ts"

common_tasks:
  "Need to format a date?": "→ Check if date-fns is used, or create in lib/date-utils.ts"
  "Need to work with categories?": "→ lib/category-utils.ts"
  "Need to query database?": "→ import { prisma } from '@/lib/prisma'"
  "Need to search recipes?": "→ lib/queries/recipes.ts → searchRecipes()"
  "Need icons?": "→ Use lucide-react (already installed)"
  "Need UI components?": "→ Check components/ui/* first before creating new"
  "Need authentication?": "→ lib/auth.ts for server-side, useAuth() hook for client-side"
  "Need to validate input?": "→ Use Zod schemas from lib/schemas/*"
  "Need to upload files?": "→ lib/uploadHelper.ts or lib/recipeStorage.ts"
  "Need to log?": "→ import { log } from '@/lib/logger'"

vercel_serverless:
  architecture:
    hosting: "Vercel (serverless functions)"
    function_timeout: "10s (Hobby) / 60s (Pro) / configurable"
    memory_limit: "1024MB default"
    build_command: "npm run build (uses Turbopack)"

  optimization:
    cold_starts:
      - "Minimize bundle size (use dynamic imports for large libraries)"
      - "Use connection pooling for database (DATABASE_URL with pooler)"
      - "Avoid heavy dependencies in API routes"
      - "Use Next.js ISR (Incremental Static Regeneration) where possible"

    database:
      - "ALWAYS use connection pooling URL from env (DATABASE_URL)"
      - "Keep Prisma client as singleton (lib/prisma.ts)"
      - "Use parallel queries with Promise.all()"
      - "Leverage ISR (revalidate) for semi-static pages"
      - "Use DIRECT_URL only for migrations, not queries"

    caching:
      - "Use Next.js revalidate for ISR"
      - "Cache filter options (categories, tags, cuisines) - they rarely change"
      - "Consider edge caching for static assets"

    edge_runtime:
      limitations:
        - "No Prisma support in edge runtime"
        - "No Node.js APIs (fs, crypto native modules, etc.)"
        - "Limited to 1MB compressed size"
      use_cases:
        - "Lightweight API routes"
        - "Middleware (middleware.ts uses edge runtime)"
        - "Simple transformations with fetch-based data access"

  gotchas:
    - "Don't use process.cwd() for file paths (unreliable in serverless)"
    - "Don't write to /tmp expecting persistence across invocations"
    - "Don't use localhost in API calls (use absolute URLs or relative paths)"
    - "Don't forget connection pooling (CRITICAL for serverless)"
    - "Always handle cold starts gracefully"

packages:
  core:
    - "next@15.5.5: App Router framework with Turbopack"
    - "react@19.1.0: React 19 with new features"
    - "typescript@5.9.3: Type safety"

  database:
    - "@prisma/client@6.18.0: Database ORM - use this for all DB operations"
    - "prisma@6.18.0: Prisma CLI (dev dependency)"

  authentication:
    - "bcrypt@6.0.0: Password hashing"
    - "jsonwebtoken@9.0.2: JWT token creation and verification"
    - "cookie@1.0.2: Cookie parsing"

  storage:
    - "@supabase/supabase-js@2.78.0: Supabase client for storage and auth"

  ui:
    - "lucide-react@0.546.0: Icon library - use this for ALL icons"
    - "next-themes@0.4.6: Theme management (dark/light mode)"
    - "tailwindcss@4: Styling framework"

  validation:
    - "zod@4.1.12: Schema validation - use for API input validation"

  ai:
    - "openai@6.7.0: OpenAI API client for recipe formatting"

  logging:
    - "pino@10.1.0: Structured logging"
    - "pino-pretty@13.1.2: Pretty print logs in dev"

  analytics:
    - "@vercel/analytics@1.5.0: Vercel Analytics"
    - "@vercel/speed-insights@1.2.0: Performance monitoring"

  dev_tools:
    - "@types/*: TypeScript type definitions"
    - "eslint@9: Linting"
    - "eslint-config-next@15.5.5: Next.js ESLint config"
    - "ts-node@10.9.2: TypeScript execution"
    - "tsx@4.20.6: TypeScript execution with ESM"

database:
  provider: "postgresql"
  key_models:
    - User: "Core user model with authentication (id, username, email, passwordHash, role, bio)"
    - Recipe: "Main content model with ingredients, steps, status (DRAFT/PUBLISHED)"
    - RecipeIngredient: "Recipe ingredients with amounts, units, optional flags"
    - RecipeStep: "Recipe instructions with step numbers"
    - Category: "Hierarchical categories with parentId (self-referential)"
    - Cuisine: "Hierarchical cuisines with parentId (self-referential)"
    - Tag: "Simple tags for recipes"
    - Allergen: "Allergen information"
    - Review: "Recipe reviews with ratings (1-5)"
    - FavoriteRecipe: "User favorite recipes (many-to-many)"
    - Media: "Media storage (images/videos) linked to users and recipes"

  relationships:
    - "Recipe → User (author): One-to-many"
    - "Recipe → RecipeIngredient: One-to-many (cascade delete)"
    - "Recipe → RecipeStep: One-to-many (cascade delete)"
    - "Recipe ↔ Category: Many-to-many via RecipesCategories"
    - "Recipe ↔ Cuisine: Many-to-many via RecipesCuisines"
    - "Recipe ↔ Tag: Many-to-many via RecipesTags"
    - "Recipe ↔ Allergen: Many-to-many via RecipesAllergens"
    - "Recipe → Review: One-to-many (cascade delete)"
    - "Recipe ↔ User (favorites): Many-to-many via FavoriteRecipe"
    - "Category → Category: Self-referential hierarchy (parent/children)"
    - "Cuisine → Cuisine: Self-referential hierarchy (parent/children)"
    - "Media → User: Many-to-one (cascade delete)"
    - "Media → Recipe: Many-to-one optional (cascade delete)"

  important_fields:
    - "Recipe.status: DRAFT or PUBLISHED (use RecipeStatus enum)"
    - "Recipe.difficulty: EASY, MEDIUM, HARD (use Difficulty enum)"
    - "Recipe.slug: Unique slug for URLs (can be null)"
    - "User.role: USER or ADMIN (use UserRole enum)"
    - "Media.isPrimary: Primary image for recipe"
    - "Media.isProfileAvatar: Profile avatar for user"

  indexes:
    - "Media: userId, recipeId, publicId, userId+isProfileAvatar, recipeId+isPrimary"

environment:
  required_vars:
    - DATABASE_URL: "PostgreSQL connection string with connection pooling (use for queries)"
    - DIRECT_URL: "Direct PostgreSQL connection (use ONLY for migrations)"
    - JWT_SECRET: "Secret key for JWT token generation (server-only)"
    - OPENAI_API_KEY: "OpenAI API key for AI features (server-only)"
    - NEXT_PUBLIC_SUPABASE_URL: "Supabase project URL (client-accessible)"
    - NEXT_PUBLIC_SUPABASE_ANON_KEY: "Supabase anonymous key (client-accessible)"
    - SUPABASE_SERVICE_KEY: "Supabase service role key (server-only)"

  naming_convention:
    client_side: "NEXT_PUBLIC_* - accessible in browser"
    server_side: "No prefix - server-only, never exposed to client"

  locations:
    - ".env.local: Local development (gitignored)"
    - ".env.example: Template with dummy values (committed to repo)"
    - "Vercel: Production/preview environment variables (set in dashboard)"

deployment:
  platform: "Vercel"
  branches:
    main: "Production deployment"
    feature_branches: "Preview deployments for pull requests"

  build_process:
    - "npm install"
    - "prisma generate (postinstall script)"
    - "next build --turbopack"

  migrations:
    local: "npx prisma migrate dev"
    production: "Manual - run migrations before deployment"
    note: "Use DIRECT_URL for migrations, DATABASE_URL for queries"

  checks:
    - "ESLint: npm run lint"
    - "TypeScript: Type checking during build"
    - "Build: npm run build"

ui_patterns:
  styling:
    framework: "Tailwind CSS 4"
    config: "postcss.config.mjs (uses @tailwindcss/postcss plugin)"

  theme:
    system: "CSS custom properties with data-theme attribute"
    colors:
      primary: "--accent (#d4735a - terracotta)"
      primary_hover: "--accent-hover (#b85c42)"
      secondary: "--secondary (#8b7355 - warm brown)"
      background: "--bg (#f8f9fa)"
      text: "--text (#333)"
    fonts:
      heading: "--font-family-heading (Playfair Display)"
      body: "--font-family-body (Lora)"
      handwritten: "--font-family-handwritten (Dancing Script)"
    dark_mode: "Supported via data-theme attribute and CSS custom properties"

  component_patterns:
    cards: "components/ui/RecipeCard.tsx - recipe display cards"
    forms: "components/auth/AuthForm.tsx - authentication forms"
    modals: "components/ui/Modal.tsx - modal dialogs"
    buttons: "Use Tailwind classes with theme colors"
    images: "Use Next.js Image component with appropriate sizes and priority"

  responsive:
    approach: "Mobile-first with Tailwind responsive utilities"
    breakpoints: "Default Tailwind breakpoints (sm, md, lg, xl, 2xl)"

auth:
  provider: "Custom JWT implementation"

  session:
    storage: "HTTP-only cookies (AUTH_COOKIE_NAME)"
    expiry: "7 days (AUTH_COOKIE_MAX_AGE)"
    middleware: "middleware.ts checks auth cookie for protected routes"

  protected_routes:
    pattern: "Listed in PROTECTED_ROUTES constant"
    routes: ["/new-recipe", "/dashboard", "/profile"]
    redirect: "Redirects to /login if not authenticated"

  user_data:
    server_components: "Use getUserFromSession() from @/lib/auth"
    client_components: "Use useAuth() hook from @/context/AuthContext"
    example_server: "const user = await getUserFromSession()"
    example_client: "const { user, login, logout } = useAuth()"

  password_requirements:
    min_length: "8 characters (PASSWORD_MIN_LENGTH)"
    hashing: "bcrypt with 10 rounds"

---

# Project Context Document

> **Note to AI Agents**: Read this document at the START of every task. Update it at the END of every completed task if you discovered new patterns, utilities, or architectural decisions.

## Quick Reference

### Common Tasks Checklist

**Before creating any new utility function:**
- [ ] Check `lib/` for existing implementations
- [ ] Check utilities_index in YAML frontmatter
- [ ] Search codebase for similar functionality

**Before installing a new package:**
- [ ] Check package.json for existing alternatives
- [ ] Verify the package is Vercel-serverless compatible
- [ ] Consider bundle size impact on cold starts

**Before writing database queries:**
- [ ] Use connection pooling URL (DATABASE_URL from env)
- [ ] Import singleton: `import { prisma } from '@/lib/prisma'`
- [ ] Use Promise.all for parallel queries
- [ ] Check for N+1 query patterns
- [ ] Use Prisma include/select to fetch related data efficiently

**For Server Components:**
- [ ] Fetch data directly (no useEffect needed)
- [ ] No 'use client' directive needed
- [ ] Can use async/await at component level
- [ ] Cannot use hooks (useState, useEffect, etc.)

**For Client Components:**
- [ ] Add 'use client' directive at top of file
- [ ] Avoid localStorage in initial render
- [ ] Use existing Context providers, don't create new ones
- [ ] Use useAuth() for authentication state

---

## Project Structure

### Key Directories

**`/app`** - Next.js App Router
- Routes are defined by folder structure
- `page.tsx` = route endpoint
- `layout.tsx` = shared layout
- `loading.tsx`, `error.tsx` = special files
- **Route Groups**: 
  - `(site)` - Public pages (home, browse, recipes, auth, contact, faq)
  - `(dashboard)` - Protected pages (profile, recipe management)
- **API Routes**: `app/api/*` - serverless API endpoints
  - `api/auth/*` - Authentication (login, register, logout)
  - `api/recipes/*` - Recipe CRUD operations
  - `api/ai/*` - AI-powered features
  - `api/upload/*` - File upload endpoints
  - `api/categories/*`, `api/tags/*`, etc. - Metadata endpoints

**`/components`** - React Components
- **Feature-based organization**:
  - `auth/` - Authentication components (AuthForm, ProtectedPage)
  - `recipe/` - Recipe-specific components
  - `browse/` - Browse/search components
  - `user/` - User profile components
  - `layout/` - Layout components (Navbar, Footer)
  - `ui/` - Reusable UI components (RecipeCard, Modal, CategoryCard, etc.)
- **Key components**:
  - `ErrorBoundary.tsx` - Error boundary wrapper
  - `MediaUploader.tsx` - File upload component

**`/lib`** - Utility Functions & Configuration
- **Core files**:
  - `prisma.ts` - **Database client singleton (ALWAYS import this)**
  - `auth.ts` - Authentication utilities (JWT, cookies, sessions)
  - `logger.ts` - Pino logger instance
  - `constants.ts` - Application constants
  - `category-utils.ts` - Category hierarchy utilities
  - `recipeParser.ts` - Recipe parsing utilities
  - `recipeStorage.ts` - Recipe file storage
  - `uploadHelper.ts` - File upload helpers
- **Subdirectories**:
  - `queries/` - Database query functions (recipes, users, metadata)
  - `schemas/` - Zod validation schemas
  - `validation/` - Input validation utilities
  - `supabase/` - Supabase client configuration (server, client)

**`/context`** - React Context Providers
- `AuthContext.tsx` - Authentication context (wraps useAuth hook)

**`/hooks`** - Custom React Hooks
- `useAuth.ts` - Authentication hook (used by AuthContext)
- `useForm.ts` - Form handling utilities
- `usePlaceholders.ts` - Placeholder image hooks

**`/types`** - TypeScript Type Definitions
- `index.ts` - Shared type definitions
- `recipe.ts` - Recipe-related types

**`/prisma`** - Prisma Database Files
- `schema.prisma` - Database schema definition
- `migrations/` - Database migrations
- `seed.ts` - Database seeding script
- `data/`, `seed-data/` - Seed data files

**`/config`** - Configuration Files
- `constants.ts` - Application constants (duplicate of lib/constants.ts)

**`/public`** - Static Assets
- Public files served directly (images, etc.)

**`/scripts`** - Utility Scripts
- Custom scripts for maintenance tasks

---

## Architecture Decisions

### Why This Structure?

- **Server Components by default**: Optimal performance, reduced client bundle size
- **Client components only when needed**: Interactivity, hooks, browser APIs
- **Feature-based component organization**: Better maintainability and discoverability
- **Utility functions grouped by domain**: Clear separation of concerns
- **Singleton Prisma client**: Efficient connection pooling for serverless
- **Custom JWT auth**: Full control over authentication flow
- **Supabase for storage**: Scalable file storage without serverless filesystem issues

### Data Flow

**Server-Side Data Fetching (Preferred):**
```
User Request → Server Component → Prisma Query → Database → Render HTML → Client
```

**Client-Side Interactions:**
```
User Action → Client Component → API Route → Prisma Query → Database → JSON Response → Update UI
```

**Authentication Flow:**
```
Login → Create JWT → Set HTTP-only Cookie → Middleware Checks Cookie → Access Protected Routes
```

---

## Database Schema Overview

**Core Models:**

- **User**: User accounts with authentication
  - Fields: id, username, email, passwordHash, bio, role (USER/ADMIN)
  - Relations: recipes (authored), reviews, favorites, media

- **Recipe**: Main content model
  - Fields: title, slug, description, servings, prep/cook time, difficulty, status (DRAFT/PUBLISHED)
  - Relations: author (User), ingredients, steps, categories, cuisines, tags, allergens, reviews, favorites, media
  - **Note**: Status must be PUBLISHED for public visibility

- **Category**: Hierarchical recipe categories
  - **Important**: Self-referential with parentId for tree structure
  - Use `buildCategoryTree()` to convert flat list to tree
  - Use `getDescendantCategoryIds()` for hierarchical filtering

- **Cuisine**: Hierarchical cuisines (similar to categories)
  - Self-referential with parentId

- **Tag**: Simple tags for recipes (flat structure, no hierarchy)

- **Allergen**: Allergen information for recipes

- **Review**: Recipe reviews and ratings
  - Fields: rating (1-5), comment
  - Relations: recipe, user

- **FavoriteRecipe**: User's favorited recipes (junction table)

- **Media**: Images and videos
  - Fields: publicId, url, secureUrl, mimeType, resourceType (IMAGE/VIDEO)
  - Flags: isPrimary (primary recipe image), isProfileAvatar (user avatar)
  - Relations: user, recipe (optional)
  - **Important**: Used for both recipe images and user avatars

**Important Relationships:**
- Recipe-Category: Many-to-many (supports multiple categories per recipe)
- Recipe-Tag: Many-to-many (supports multiple tags per recipe)
- Recipe-Cuisine: Many-to-many (though typically one cuisine per recipe)
- All recipe relations use cascade delete (deleting recipe deletes ingredients, steps, etc.)

**For detailed schema**: See `prisma/schema.prisma`

---

## Common Patterns

### Pattern: Server Component Data Fetching

**✅ Correct:**
```typescript
// app/(site)/recipes/[username]/[slug]/page.tsx
export default async function RecipePage({ params }) {
  const recipe = await prisma.recipe.findUnique({
    where: { slug: params.slug },
    include: {
      author: { include: { media: true } },
      ingredients: true,
      steps: true,
      media: true,
    },
  });
  
  return <RecipeDetails recipe={recipe} />;
}
```

**❌ Incorrect:**
```typescript
// DON'T use useEffect in Server Components
export default function RecipePage() {
  const [recipe, setRecipe] = useState(null);
  
  useEffect(() => {
    fetch('/api/recipes/...')
      .then(res => res.json())
      .then(setRecipe);
  }, []);
  
  return <RecipeDetails recipe={recipe} />;
}
```

### Pattern: Hierarchical Category Handling

**✅ Use existing utilities:**
```typescript
import { buildCategoryTree, getDescendantCategoryIdsForMultiple } from '@/lib/category-utils';
import { prisma } from '@/lib/prisma';

// Convert flat categories to tree
const categories = await prisma.category.findMany();
const tree = buildCategoryTree(categories);

// Get all descendant IDs for filtering
const categoryIds = await getDescendantCategoryIdsForMultiple(['id1', 'id2'], prisma);
```

**Example usage**: See `app/(site)/browse/page.tsx`

### Pattern: Authentication in Components

**Server Component:**
```typescript
import { getUserFromSession } from '@/lib/auth';

export default async function ProfilePage() {
  const user = await getUserFromSession();
  
  if (!user) {
    redirect('/login');
  }
  
  return <ProfileDetails user={user} />;
}
```

**Client Component:**
```typescript
'use client';
import { useAuth } from '@/context/AuthContext';

export default function LogoutButton() {
  const { user, logout } = useAuth();
  
  if (!user) return null;
  
  return <button onClick={logout}>Logout</button>;
}
```

### Pattern: API Route with Validation

**✅ Correct:**
```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RecipeSchema } from '@/lib/schemas/recipe';
import { log } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = RecipeSchema.parse(body);
    
    // Create recipe
    const recipe = await prisma.recipe.create({
      data: validatedData,
    });
    
    log.info({ recipeId: recipe.id }, 'Recipe created');
    
    return NextResponse.json(recipe);
  } catch (error) {
    log.error({ error }, 'Failed to create recipe');
    return NextResponse.json(
      { error: 'Failed to create recipe' },
      { status: 500 }
    );
  }
}
```

### Pattern: Parallel Database Queries

**✅ Correct (parallel):**
```typescript
const [recipes, categories, tags] = await Promise.all([
  prisma.recipe.findMany(),
  prisma.category.findMany(),
  prisma.tag.findMany(),
]);
```

**❌ Incorrect (sequential):**
```typescript
const recipes = await prisma.recipe.findMany();
const categories = await prisma.category.findMany();
const tags = await prisma.tag.findMany();
```

### Pattern: Media/Image Handling

**✅ Use helper functions:**
```typescript
import { getPrimaryImageUrl, getProfileAvatarUrl } from '@/lib/queries/recipes';

const recipe = await prisma.recipe.findUnique({
  where: { id },
  include: { media: true, author: { include: { media: true } } },
});

const recipeImage = getPrimaryImageUrl(recipe.media);
const authorAvatar = getProfileAvatarUrl(recipe.author.media);
```

---

## Package Usage Guidelines

### Icons
**Use**: `lucide-react` (already installed)
```typescript
import { Clock, Star, Heart } from 'lucide-react';
```
**Don't**: Install heroicons, fontawesome, or other icon libraries

### Validation
**Use**: `zod` (already installed)
```typescript
import { z } from 'zod';
const schema = z.object({ name: z.string() });
```
**Don't**: Install yup, joi, or other validation libraries

### Authentication
**Use**: Built-in JWT system from `@/lib/auth`
**Don't**: Install NextAuth, Clerk, or other auth libraries (already have custom implementation)

### Database
**Use**: Prisma ORM with singleton from `@/lib/prisma`
**Don't**: Use raw SQL or other ORMs (Prisma is already configured and optimized)

### Logging
**Use**: Pino logger from `@/lib/logger`
```typescript
import { log } from '@/lib/logger';
log.info('message');
log.error({ error }, 'error message');
```
**Don't**: Use console.log in production code

### Styling
**Use**: Tailwind CSS with theme CSS variables
**Don't**: Install styled-components, emotion, or CSS-in-JS libraries

---

## Vercel Serverless Optimization

### Critical Rules

1. **Always use connection pooling**
   - Use `DATABASE_URL` from env (must be pooler URL, typically port 6543)
   - Use `DIRECT_URL` ONLY for migrations (typically port 5432)
   - Never create multiple Prisma instances - import singleton from `@/lib/prisma`

2. **Minimize cold start impact**
   - Keep API routes small and focused
   - Use dynamic imports for heavy libraries: `const lib = await import('heavy-lib')`
   - Leverage ISR for semi-static content (recipes, categories)
   - Avoid large dependencies in frequently-called API routes

3. **No file system writes**
   - Use Supabase Storage for file uploads (images, videos)
   - Don't write to /tmp expecting persistence across invocations
   - Files in /tmp are ephemeral and invocation-specific

4. **Parallel queries**
   - Always use Promise.all() for independent queries
   - Example: Fetching recipes, categories, and tags simultaneously
   - Reduces overall latency significantly

5. **Efficient data fetching**
   - Use Prisma select/include to fetch only needed fields
   - Avoid N+1 queries (use include to fetch relations)
   - Filter in database, not in JavaScript
   - Use pagination to limit result sets

---

## Troubleshooting Common Issues

### "Too many connections" Error
**Cause**: Not using connection pooling or creating multiple Prisma instances
**Fix**: 
- Verify DATABASE_URL uses pooler port (usually 6543, not 5432)
- Always import from `@/lib/prisma`, never create new PrismaClient()
- Check that lib/prisma.ts creates singleton correctly

### Slow API Routes
**Cause**: Sequential database queries
**Fix**: Use Promise.all() for parallel execution
```typescript
// Bad
const recipes = await prisma.recipe.findMany();
const categories = await prisma.category.findMany();

// Good
const [recipes, categories] = await Promise.all([
  prisma.recipe.findMany(),
  prisma.category.findMany(),
]);
```

### Hydration Errors
**Cause**: Using localStorage or browser APIs in initial render
**Fix**: 
- Use useEffect to access browser APIs
- Check for window existence: `if (typeof window !== 'undefined')`
- Use suppressHydrationWarning on html element for theme (see app/layout.tsx)

### Authentication Not Working
**Cause**: Cookie not being set or middleware not protecting routes
**Fix**:
- Verify JWT_SECRET is set in environment
- Check that route is listed in PROTECTED_ROUTES
- Verify cookie is HTTP-only and secure in production
- Use browser DevTools to inspect cookie

### Images Not Loading
**Cause**: Image domains not configured in next.config.ts
**Fix**: Add domain to remotePatterns in next.config.ts
```typescript
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'your-domain.com' },
  ],
}
```

---

## Update History

### 2025-11-05 - Initial Creation (v1.0.0)
- Created comprehensive context document
- Documented tech stack and architecture
- Indexed all utilities and common patterns
- Documented database schema and relationships
- Added Vercel serverless optimization guidelines
- Documented authentication flow and patterns
- Added common troubleshooting issues
- Created quick reference checklist for common tasks

---

## Maintenance Instructions

### When to Update This Document

Update this document after completing ANY task where you:
- ✅ Created a new utility function → Add to utilities_index
- ✅ Discovered a new pattern → Add to patterns section
- ✅ Found an anti-pattern → Document in anti_patterns section
- ✅ Installed a package → Add to packages list with purpose
- ✅ Changed architecture → Update relevant sections
- ✅ Fixed a bug due to lack of context → Add to troubleshooting
- ✅ Created an exemplary component → Link it in relevant pattern section
- ✅ Modified database schema → Update database section

### Update Process

1. **Read current document** - Always read AI_CONTEXT.md before making changes
2. **Identify changes** - What new information did this task reveal?
3. **Update YAML frontmatter** - Add new entries to appropriate sections
4. **Update markdown content** - Add to relevant sections with links to files
5. **Update version** - Increment version (patch for minor, minor for new sections)
6. **Add to update history** - Document what changed and why
7. **Include in commit** - Add AI_CONTEXT.md to your commit

### Version Numbering

- **Patch (1.0.X)**: Minor updates (new utility added, small clarifications)
- **Minor (1.X.0)**: New sections added, significant pattern changes
- **Major (X.0.0)**: Major architectural changes, complete restructuring

---

## Success Metrics

**This document is successful when:**
1. ✅ AI agents rarely create duplicate utilities
2. ✅ AI agents use existing packages correctly
3. ✅ AI agents follow established patterns consistently
4. ✅ AI agents optimize for Vercel serverless by default
5. ✅ AI agents can start tasks faster (have context immediately)
6. ✅ Document stays up-to-date with codebase
7. ✅ New patterns are documented as they emerge
8. ✅ Human developers can read and understand it too

---

## Final Notes

- **This is a living document** - it should evolve with the codebase
- **Accuracy over completeness** - better to have accurate info than exhaustive lists
- **Links over code** - reference files in the repo, don't duplicate code
- **Patterns over rules** - show how things are done, not strict requirements
- **Serverless-first** - always consider Vercel serverless constraints
- **Self-updating** - AI should maintain this without human intervention (unless corrections needed)

**Remember**: This document's purpose is to make you (the AI agent) more effective by providing instant context about the codebase, preventing duplicated work, and ensuring consistency across all tasks.
