# Recipe Website - CookBook

A Next.js-based recipe sharing platform where users can discover, create, share, and review recipes. Built with Next.js 15, TypeScript, Prisma, PostgreSQL, and Supabase Storage.

## Features

- 🍳 Create and share recipes with images
- 👤 User authentication and profiles
- ⭐ Recipe reviews and ratings
- ❤️ Favorite recipes
- 🏷️ Categories, tags, and cuisines
- 🤖 AI-powered recipe formatting
- 📱 Responsive design
- 🌙 Dark mode support
- 📸 Image upload with Supabase Storage

## Tech Stack

- **Framework**: Next.js 15.5.5 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Storage**: Supabase Storage
- **Styling**: Tailwind CSS 4
- **Authentication**: JWT with bcrypt

## Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- PostgreSQL database
- Supabase account and project
- npm or yarn package manager

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd recipe-website
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

The project includes a `.env` file with the Supabase URL already configured. You need to add your Supabase API keys:

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project (or create a new one)
3. Navigate to **Project Settings** → **API**
4. Copy your API keys:
   - **Project URL**: Already set in `.env` as `https://zhbvoocgkifbrmqpcjpo.supabase.co`
   - **anon public key**: Copy and paste into `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key**: Copy and paste into `SUPABASE_SERVICE_KEY` (keep this secret!)

5. Update the `.env` file with your keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://zhbvoocgkifbrmqpcjpo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

Also configure other environment variables:
- `DATABASE_URL`: Your PostgreSQL connection string
- `JWT_SECRET`: A secure random string for JWT tokens
- `OPENAI_API_KEY`: (Optional) For AI recipe formatting features

### 4. Set Up Supabase Storage

The application requires a Supabase Storage bucket for file uploads. Follow the detailed setup guide:

📖 **[Complete Supabase Setup Guide](./docs/SUPABASE_SETUP.md)**

Quick setup steps:
1. Create a bucket named `recipe-builder` in your Supabase project
2. Enable public access for the bucket
3. Configure storage policies (see setup guide)

### 5. Set Up the Database

```bash
# Run Prisma migrations
npx prisma migrate dev

# Seed the database with sample data
npm run seed
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Important Notes

### Supabase API Keys

- **NEXT_PUBLIC_SUPABASE_URL**: Your Supabase project URL (public, safe to expose)
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: The anon/public API key
  - Has the `NEXT_PUBLIC_` prefix, which means it's exposed to the browser
  - Used for client-side operations
  - Respects Row Level Security (RLS) policies
- **SUPABASE_SERVICE_KEY**: The service role key
  - **PRIVATE** - never expose to client-side code
  - No `NEXT_PUBLIC_` prefix keeps it server-side only
  - Used for admin operations and bypasses RLS
  - Only use in API routes and server-side scripts

### File Storage

All media uploads are stored in Supabase Storage in the `recipe-builder` bucket:
- Recipe images: `recipes/{recipeId}/{filename}`
- User avatars: `avatars/{userId}/{filename}`
- General uploads: `uploads/{filename}`

## Available Scripts

```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run seed         # Seed database with sample data
```

## Project Structure

```
/app                 # Next.js App Router pages and API routes
/components          # React components
/lib                 # Utility libraries and helpers
  /supabase          # Supabase client configurations
/prisma              # Database schema and migrations
/public              # Static assets
/docs                # Documentation
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
