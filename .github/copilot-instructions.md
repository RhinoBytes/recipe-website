# GitHub Copilot Instructions for Recipe Website

## Project Overview

This is a Next.js-based recipe sharing platform called "CookBook" where users can discover, create, share, and review recipes. The application provides a full-featured recipe management system with user authentication, recipe categorization, reviews, favorites, and nutritional information.

## Technology Stack

- **Framework**: Next.js 15.5.5 with App Router and Turbopack
- **Language**: TypeScript (with non-strict mode)
- **Runtime**: React 19.1.0
- **Database**: PostgreSQL with Prisma ORM (v6.18.0)
- **Styling**: Tailwind CSS 4
- **Authentication**: JWT with bcrypt password hashing
- **AI Integration**: OpenAI API
- **Fonts**: Google Fonts (Playfair Display, Lora, Dancing Script)
- **Icons**: Lucide React
- **Themes**: next-themes for theme management
- **Validation**: Zod
- **Linting**: ESLint with Next.js configuration

## Project Structure

### Directory Layout

```
/app                    # Next.js App Router pages and API routes
  /(dashboard)         # Dashboard routes (protected)
    /recipes           # Recipe management pages
  /(site)              # Public site routes
  /api                 # API route handlers
    /auth             # Authentication endpoints
    /recipes          # Recipe CRUD operations
    /user             # User management
    /ai               # AI-powered features
  layout.tsx          # Root layout with providers
  globals.css         # Global styles
  theme.css           # Theme definitions

/components            # React components
  /auth               # Authentication components
  /browse             # Recipe browsing components
  /layout             # Layout components (Navbar, Footer)
  /recipe             # Recipe-related components
  /ui                 # Reusable UI components
  /user               # User profile components

/context              # React Context providers
  AuthContext.tsx     # Authentication context

/hooks                # Custom React hooks
  useAuth.ts          # Authentication hook

/lib                  # Utility libraries and helpers
  /auth.ts            # Authentication utilities
  /db.ts              # Database client
  /validation         # Validation schemas

/prisma               # Prisma database files
  /migrations         # Database migrations
  /data               # Seed data
  schema.prisma       # Database schema
  seed.ts             # Database seeding script

/types                # TypeScript type definitions

/utils                # Utility functions

/config               # Configuration files

/public               # Static assets
```

## Code Conventions and Guidelines

### General Principles

1. **Use TypeScript** for all new files (strict mode is disabled, but type safety is encouraged where practical)
2. **Follow Next.js App Router patterns** for routing and data fetching
3. **Use Server Components by default**, only use Client Components when necessary (interactivity, hooks, browser APIs)
4. **Implement proper error handling** using Error Boundaries and try-catch blocks
5. **Follow the existing code style** - use ESLint for consistency

### File Naming

- Components: PascalCase (e.g., `RecipeCard.tsx`)
- Utilities: camelCase (e.g., `formatDate.ts`)
- API routes: lowercase with brackets for dynamic segments (e.g., `[slug]/route.ts`)
- Page files: lowercase (e.g., `page.tsx`, `layout.tsx`)

### Component Guidelines

1. **Functional Components**: Use functional components with TypeScript
2. **Props Interface**: Define props with TypeScript interfaces or types
3. **Client Components**: Add `'use client'` directive at the top when needed
4. **Async Server Components**: Use async/await for data fetching in Server Components
5. **Error Boundaries**: Wrap error-prone components with ErrorBoundary

### Database and Prisma

1. **Use Prisma Client** from `@/lib/db` for all database operations
2. **Follow the schema** defined in `prisma/schema.prisma`
3. **Cascade deletions** are configured for related records
4. **Use transactions** for operations that modify multiple tables
5. **Models include**:
   - User (with authentication)
   - Recipe (with ingredients, steps, reviews)
   - Category, Tag, Cuisine, Allergen
   - Review, FavoriteRecipe
   - Many-to-many junction tables

### API Routes

1. **RESTful conventions**: Use appropriate HTTP methods (GET, POST, PUT, DELETE)
2. **Route handlers**: Use Next.js 15 Route Handlers (not Pages API)
3. **Request validation**: Use Zod schemas for input validation
4. **Authentication**: Check JWT tokens using auth utilities
5. **Error responses**: Return appropriate status codes and error messages
6. **Response format**: Return JSON with consistent structure

Example pattern:
```typescript
export async function GET(request: Request) {
  try {
    // Validate auth if needed
    // Fetch data
    // Return response
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: 'Error message' }, { status: 500 });
  }
}
```

### Authentication

1. **JWT tokens** are stored in HTTP-only cookies
2. **Password hashing** uses bcrypt
3. **Middleware** (`middleware.ts`) protects dashboard routes
4. **AuthContext** provides authentication state
5. **useAuth hook** provides auth utilities in client components

### Styling

1. **Tailwind CSS** for styling
2. **CSS custom properties** for theming (see `theme.css`)
3. **Responsive design** - mobile-first approach
4. **Font variables**: Use CSS variables for fonts
   - `--font-family-heading`: Playfair Display
   - `--font-family-body`: Lora
   - `--font-family-handwritten`: Dancing Script
5. **Theme colors**: Terracotta theme with CSS custom properties

### Path Aliases

Use TypeScript path aliases for imports:
- `@/` - Root directory
- `@components/` - Components directory
- `@lib/` - Lib directory
- `@styles/` - Styles directory (if used)

Example: `import { prisma } from '@/lib/db'`

### Data Fetching

1. **Server Components**: Fetch data directly in the component
2. **Client Components**: Use React hooks (useState, useEffect) or SWR/React Query if needed
3. **API Routes**: Call from client components using fetch
4. **Revalidation**: Use Next.js revalidation strategies where appropriate

### Common Patterns

#### Recipe Operations

- Recipes have status: DRAFT or PUBLISHED
- Recipes include ingredients (with amounts, units, optional flags)
- Recipes include steps (with step numbers)
- Recipes can have categories, tags, allergens, and cuisine
- Recipes support reviews and ratings
- Recipes can be favorited by users

#### User Roles

- USER: Regular users who can create and manage their own recipes
- ADMIN: Administrators with elevated permissions

## Development Workflow

### Running the Application

```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run seed         # Seed database with sample data
```

### Database

1. Ensure PostgreSQL is running
2. Set `DATABASE_URL` environment variable
3. Run migrations: `npx prisma migrate dev`
4. Seed data: `npm run seed`
5. View data: `npx prisma studio`

### Environment Variables

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `OPENAI_API_KEY`: OpenAI API key (for AI features)
- `NEXT_PUBLIC_API_URL`: Public API URL (if different from default)

## Testing

Currently, there is no test infrastructure in this project. When adding tests:
1. Use Jest and React Testing Library
2. Follow Next.js testing conventions
3. Test API routes, components, and utilities separately
4. Mock Prisma client for database tests

## AI Features

The application includes AI-powered recipe formatting using OpenAI API:
- Route: `/api/ai/format-recipe`
- Parses unstructured recipe text into structured format
- Extracts ingredients, steps, and metadata

## Important Notes

1. **TypeScript strict mode is OFF**: Code may not have complete type coverage
2. **No existing tests**: Be careful when refactoring
3. **Turbopack enabled**: Uses Turbopack for faster builds
4. **ESM modules**: Project uses ES modules (type: "module" in package.json)
5. **React 19**: Using the latest React version
6. **Moderate security vulnerability**: Address with `npm audit fix` if needed

## Best Practices for Contributing

1. **Minimal changes**: Make surgical, focused changes
2. **Follow existing patterns**: Match the style and structure of existing code
3. **Test locally**: Run `npm run dev` and verify changes work
4. **Lint before committing**: Run `npm run lint` to catch issues
5. **Database changes**: Create Prisma migrations for schema changes
6. **API changes**: Update related components and validation schemas
7. **Authentication**: Ensure protected routes remain secure
8. **Error handling**: Add proper error boundaries and error messages

## Common Tasks

### Adding a New API Route

1. Create file in `app/api/[route-name]/route.ts`
2. Implement HTTP method handlers (GET, POST, etc.)
3. Add request validation using Zod
4. Add authentication check if needed
5. Use Prisma for database operations
6. Return appropriate responses

### Creating a New Page

1. Create file in `app/(site)/[page-name]/page.tsx` or `app/(dashboard)/[page-name]/page.tsx`
2. Use Server Component for data fetching
3. Use Client Component only if interactivity is needed
4. Add proper metadata
5. Implement error handling
6. Style with Tailwind CSS

### Adding a New Component

1. Create component in appropriate `components/` subdirectory
2. Define props interface
3. Add 'use client' directive if needed
4. Export component
5. Import and use in pages or other components

### Modifying Database Schema

1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name descriptive-name`
3. Update TypeScript types if needed
4. Update seed data if needed
5. Update related API routes and components

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [React 19 Documentation](https://react.dev)
