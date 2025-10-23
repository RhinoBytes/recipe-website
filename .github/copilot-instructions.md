# GitHub Copilot Instructions for Recipe Website

## Project Overview

This is a recipe website built with Next.js 15, TypeScript, Prisma, and PostgreSQL. The application allows users to create, share, and discover recipes with features including authentication, recipe creation with AI-powered formatting, categorization, allergen tracking, and nutrition information.

## Tech Stack

- **Framework**: Next.js 15.5.5 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based with bcrypt
- **Icons**: Lucide React
- **Theme**: next-themes for dark/light mode support

## Project Structure

```
/app                    # Next.js App Router pages and API routes
  /(site)              # Public pages (with layout)
  /api                 # API endpoints
  /recipes             # Recipe-related pages
/components            # React components
  /layout              # Layout components (Navbar, Footer, etc.)
  /ui                  # Reusable UI components
/lib                   # Utility functions and shared code
/prisma                # Database schema and migrations
/context               # React context providers
/hooks                 # Custom React hooks
/utils                 # Helper utilities
/types                 # TypeScript type definitions
```

## Code Style and Conventions

### TypeScript
- Use TypeScript for all new files
- Prefer interfaces over types for object shapes
- Use explicit return types for functions
- Avoid using `any` - prefer `unknown` or specific types
- Keep `strict: false` in tsconfig.json as configured

### React Components
- Use functional components with hooks
- Prefer named exports for components
- Use `"use client"` directive only when necessary (client interactivity, hooks, browser APIs)
- Keep server components as default for better performance
- Component file names should match the component name (PascalCase)

### File Naming
- Components: PascalCase (e.g., `RecipeCard.tsx`)
- Utilities: camelCase (e.g., `formatDate.ts`)
- API routes: lowercase with hyphens (e.g., `format-recipe`)
- Pages: lowercase (e.g., `page.tsx`, `[slug]`)

### Imports
- Use absolute imports with `@/` prefix (configured in tsconfig.json)
- Group imports: React, third-party, local components, utilities
- Prefer named imports over default imports

### Styling
- Use Tailwind CSS utility classes
- Follow responsive-first approach (mobile → desktop)
- Use the theme system for dark mode support
- Avoid inline styles unless absolutely necessary

## Database and Prisma

### Models
Key models in the schema:
- `User`: User accounts with authentication
- `Recipe`: Recipe information with nutrition data
- `RecipeIngredient`: Individual ingredients for recipes
- `Tag`: Recipe tags (many-to-many)
- `Category`: Recipe categories (many-to-many)
- `Allergen`: Allergen warnings (many-to-many)

### Best Practices
- Always use Prisma Client for database operations
- Use transactions for multi-model operations
- Include necessary relations in queries with `include`
- Use `select` when you only need specific fields
- Order query results when order matters (e.g., ingredients by `displayOrder`)

### Running Migrations
```bash
npx prisma migrate dev        # Create and apply migration
npx prisma db push            # Push schema without migration
npx prisma generate           # Regenerate Prisma Client
npx prisma db seed            # Seed the database
```

## Authentication

- JWT tokens stored in HTTP-only cookies
- Use `getCurrentUser()` from `@/lib/auth` for server-side auth
- Use `useAuth()` hook for client-side auth state
- Wrap protected pages with `ProtectedPage` component
- API routes should validate auth with `getCurrentUser()`

## API Routes

### Structure
- Place in `/app/api/[resource]/route.ts`
- Export named functions: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`
- Return `NextResponse.json()` for JSON responses
- Use proper HTTP status codes

### Error Handling
```typescript
return NextResponse.json(
  { error: 'Error message' },
  { status: 400 }
)
```

### Authentication in API Routes
```typescript
const user = await getCurrentUser()
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

## Common Patterns

### Server Components (Default)
```typescript
export default async function Page() {
  const data = await fetchData() // Can use async/await
  return <div>{data}</div>
}
```

### Client Components
```typescript
'use client'

import { useState } from 'react'

export default function InteractiveComponent() {
  const [state, setState] = useState()
  // Can use hooks and browser APIs
}
```

### Protected Pages
```typescript
import ProtectedPage from '@/components/auth/ProtectedPage'

export default function ProtectedRoute() {
  return (
    <ProtectedPage>
      {/* Content only visible to authenticated users */}
    </ProtectedPage>
  )
}
```

### Data Fetching in Server Components
```typescript
import { prisma } from '@/lib/prisma'

export default async function RecipePage({ params }) {
  const recipe = await prisma.recipe.findUnique({
    where: { slug: params.slug },
    include: {
      author: true,
      ingredients: { orderBy: { displayOrder: 'asc' } },
      tags: true,
      categories: true
    }
  })
  
  if (!recipe) {
    notFound() // Shows 404 page
  }
  
  return <div>{/* Render recipe */}</div>
}
```

## Testing

### Manual Testing
- Follow the checklist in `TESTING.md`
- Test credentials are seeded in the database (see `TESTING.md`)
- Use `npm run dev` to start the development server
- Ensure DATABASE_URL and JWT_SECRET are set in `.env`

### Testing Changes
1. Build: `npm run build`
2. Lint: `npm run lint`
3. Manual testing: Follow relevant sections in `TESTING.md`

## Environment Variables

Required environment variables (create `.env` file):
```
DATABASE_URL="postgresql://user:password@localhost:5432/recipe_db"
JWT_SECRET="your-secret-key-here"
```

## Common Tasks

### Creating a New Page
1. Create file in `/app/[route]/page.tsx`
2. Decide if it needs to be a client component (`'use client'`)
3. Add authentication if needed (`ProtectedPage` wrapper)
4. Implement the page component

### Creating a New API Endpoint
1. Create file in `/app/api/[resource]/route.ts`
2. Export handler functions (`GET`, `POST`, etc.)
3. Add authentication check if needed
4. Use Prisma for database operations
5. Return `NextResponse.json()`

### Adding a New Component
1. Create in `/components/[category]/ComponentName.tsx`
2. Use TypeScript with proper prop types
3. Make it a client component only if needed
4. Use Tailwind for styling
5. Export as named export

### Database Schema Changes
1. Update `/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name description_of_change`
3. Update TypeScript types if needed
4. Update seed file if necessary

## Security Considerations

- Never expose sensitive data (JWT_SECRET, database credentials)
- Always validate and sanitize user input
- Use parameterized queries (Prisma does this automatically)
- Avoid ReDoS vulnerabilities in regex patterns (limit repetitions)
- Use HTTP-only cookies for authentication tokens
- Validate authentication on all protected routes

## Performance Best Practices

- Use Server Components by default (faster, better SEO)
- Only use Client Components when necessary
- Optimize images with Next.js Image component
- Use proper loading states and error boundaries
- Cache database queries when appropriate
- Use Prisma select to fetch only needed fields

## Debugging Tips

- Check browser console for client-side errors
- Check terminal/server logs for server-side errors
- Use `console.log` sparingly; remove before committing
- Use Prisma Studio to inspect database: `npx prisma studio`
- Check network tab for API request/response issues

## Build and Deployment

### Build Commands
```bash
npm run dev        # Development server with hot reload
npm run build      # Production build
npm start          # Start production server
npm run lint       # Run ESLint
```

### Before Committing
1. Run `npm run lint` and fix any errors
2. Ensure `npm run build` succeeds
3. Test changed functionality manually
4. Remove any console.logs or debug code

## Additional Resources

- Next.js Documentation: https://nextjs.org/docs
- Prisma Documentation: https://www.prisma.io/docs
- Tailwind CSS Documentation: https://tailwindcss.com/docs
- TypeScript Handbook: https://www.typescriptlang.org/docs

## Notes for Copilot

- Follow the existing code patterns in the repository
- Maintain consistency with the established file structure
- Respect the authentication flow and protected routes pattern
- Use Prisma for all database operations
- Keep components focused and reusable
- Write type-safe code with proper TypeScript types
- Consider performance implications (server vs client components)
