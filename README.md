# Recipe Website - CookBook MVP

A modern recipe sharing platform built with Next.js 15, TypeScript, Prisma, and PostgreSQL. Share, discover, and create amazing recipes with a passionate community of home cooks.

## ✨ Features

- 🔐 **User Authentication** - Secure JWT-based authentication with bcrypt password hashing
- 📝 **Recipe Creation** - Manual entry or AI-powered recipe formatting from pasted text
- 🏷️ **Categorization** - Organize recipes by categories, tags, and allergen warnings
- 📊 **Nutrition Tracking** - Automatic nutrition information (calories, protein, fat, carbs)
- 🖼️ **Image Support** - Recipe images from URLs (Unsplash CDN supported)
- 🎨 **Modern UI** - Responsive design with Tailwind CSS and dark mode support
- 🔍 **Browse & Search** - (In Development) Find recipes by category, tags, or ingredients

## 🛠️ Tech Stack

- **Framework**: [Next.js 15.5.5](https://nextjs.org) (App Router with Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com)
- **Database**: [PostgreSQL](https://www.postgresql.org) with [Prisma ORM](https://www.prisma.io)
- **Authentication**: JWT tokens with bcrypt
- **Icons**: [Lucide React](https://lucide.dev)
- **Theme**: [next-themes](https://github.com/pacocoursey/next-themes)

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** 20.x or higher
- **npm** or **yarn** or **pnpm**
- **PostgreSQL** 14.x or higher (running locally or remote)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/RhinoBytes/recipe-website.git
cd recipe-website
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Database Connection
DATABASE_URL="postgresql://username:password@localhost:5432/recipe_db"

# JWT Secret (use a strong random string in production)
JWT_SECRET="your-secure-random-secret-change-this-in-production"

# Node Environment
NODE_ENV="development"
```

**⚠️ Security Note**: Always use a strong, randomly generated `JWT_SECRET` in production. Generate one with:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Set Up the Database

Create the PostgreSQL database:

```bash
# Using psql
createdb recipe_db

# Or using PostgreSQL client
psql -U postgres
CREATE DATABASE recipe_db;
\q
```

Run Prisma migrations:

```bash
npx prisma migrate dev
```

Seed the database with initial data (categories, allergens, sample recipes):

```bash
npx prisma db seed
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 🧪 Test Credentials

The seed script creates the following test users:

| Username    | Email                | Password     |
|-------------|----------------------|--------------|
| chef_alice  | alice@example.com    | password123  |
| baker_bob   | bob@example.com      | password123  |
| admin       | admin@example.com    | password123  |

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── (site)/            # Public pages with layout
│   ├── api/               # API endpoints
│   ├── recipes/           # Recipe pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── layout/           # Navigation, footer, etc.
│   └── ui/               # Reusable UI components
├── context/              # React context providers
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Database seed file
├── types/                # TypeScript type definitions
└── utils/                # Helper utilities
```

## 🗂️ Available Scripts

```bash
npm run dev          # Start development server (with Turbopack)
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

## 🗄️ Database Management

```bash
# View database in Prisma Studio
npx prisma studio

# Create a new migration
npx prisma migrate dev --name migration_name

# Deploy migrations to production
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Generate Prisma Client (after schema changes)
npx prisma generate
```

## 🔑 Key Features & Usage

### Creating a Recipe

1. **Log in** to your account
2. Click **"Create Recipe"** in the user dropdown
3. Choose between:
   - **Manual Entry**: Fill in all fields manually
   - **Paste & Format**: Paste unstructured recipe text for AI parsing
4. Click **"Format & Validate with AI"** to add nutrition data
5. Click **"Publish Recipe"** to make it live

### Browsing Recipes

- **Homepage**: View popular and recent recipes
- **Categories**: Browse by meal type (breakfast, lunch, dinner, etc.)
- **Recipe Detail**: View full recipe with ingredients, instructions, and nutrition

### API Endpoints

| Endpoint                      | Method | Description                    |
|-------------------------------|--------|--------------------------------|
| `/api/recipes`                | GET    | List all recipes               |
| `/api/recipes`                | POST   | Create a new recipe (auth)     |
| `/api/recipes/[slug]`         | GET    | Get recipe by slug             |
| `/api/categories`             | GET    | List all categories            |
| `/api/allergens`              | GET    | List all allergens             |
| `/api/ai/format-recipe`       | POST   | AI recipe formatting (auth)    |
| `/api/auth/login`             | POST   | User login                     |
| `/api/auth/register`          | POST   | User registration              |
| `/api/auth/logout`            | POST   | User logout                    |

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

4. **Set Environment Variables** in Vercel Dashboard:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `JWT_SECRET` - Strong random secret

5. **Run Migrations**:
   ```bash
   vercel env pull .env.production
   npx prisma migrate deploy
   ```

### Other Deployment Options

- **Railway**: One-click deploy with managed PostgreSQL
- **DigitalOcean App Platform**: Simple deployment with database
- **AWS**: Deploy to Amplify or EC2 with RDS PostgreSQL

See [BUILD_AND_DEPLOYMENT_REVIEW.md](./BUILD_AND_DEPLOYMENT_REVIEW.md) for detailed deployment instructions.

## 📚 Documentation

- [Testing Guide](./TESTING.md) - Manual testing procedures
- [Code Review Report](./CODE_REVIEW_REPORT.md) - Comprehensive code review
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - Feature implementation details
- [Build & Deployment Review](./BUILD_AND_DEPLOYMENT_REVIEW.md) - Deployment guide and analysis

## 🔒 Security Features

- Input sanitization for all user inputs
- Secure HTTP-only cookies for authentication
- bcrypt password hashing with salt
- Security headers (X-Frame-Options, CSP, etc.)
- ReDoS vulnerability protection
- SQL injection protection via Prisma

## 🛣️ Roadmap

### Completed ✅
- User authentication (register, login, logout)
- Recipe creation with manual entry
- AI-powered recipe formatting
- Recipe detail pages
- Category and allergen management
- Nutrition tracking
- Responsive design

### In Progress 🚧
- Search and filtering functionality
- Rating and review system
- User favorites/bookmarks

### Planned 📋
- Recipe editing and deletion
- User profile pages
- Image upload (not just URLs)
- Recipe print view
- Shopping list generation
- Meal planning
- Social sharing

## 🐛 Known Issues

See [BUILD_AND_DEPLOYMENT_REVIEW.md](./BUILD_AND_DEPLOYMENT_REVIEW.md) for a complete list of known issues and recommendations.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and not licensed for public use.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org)
- Database management by [Prisma](https://www.prisma.io)
- Icons from [Lucide](https://lucide.dev)
- Images from [Unsplash](https://unsplash.com)

## 📞 Support

For questions or issues, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ by the CookBook Team**
