# CookBook – A Modern Recipe Sharing Platform

**A full-stack recipe discovery and management platform built with Next.js 15, showcasing modern web development practices, scalable architecture, and AI-powered features.**

---

## 🎬 Demo & Screenshots

<!-- Placeholder for animated demo - replace with actual GIF later -->
![Animated demo showing recipe browsing, creation, and AI features](demo-placeholder.gif)  
*Placeholder: Animated demo GIF will be added here to showcase the application in action*

### Key Screenshots

<!-- Placeholder screenshots - replace with actual images later -->
![Homepage with featured recipes and search](screenshot-home-placeholder.png)  
*Placeholder: Homepage screenshot showing recipe grid and search functionality*

![Recipe creation with AI-powered formatting](screenshot-create-placeholder.png)  
*Placeholder: Recipe creation interface with AI parsing capabilities*

![Recipe detail page with reviews and nutrition](screenshot-detail-placeholder.png)  
*Placeholder: Recipe detail page showing ingredients, steps, reviews, and nutritional information*

---

## ✨ Features Overview

CookBook delivers a comprehensive recipe management experience with production-ready features:

### Core Recipe Management
- **Recipe Discovery & Browsing** – Enables users to explore recipes with advanced filtering by cuisine, category, tags, difficulty, and cooking time
- **Rich Recipe Creation** – Provides structured recipe authoring with ingredients (including amounts, units, preparation notes), step-by-step instructions, and chef's notes
- **AI-Powered Recipe Parser** – Analyzes unstructured recipe text using OpenAI API to automatically extract ingredients, steps, nutritional estimates, and metadata
- **Draft & Publish Workflow** – Supports recipe drafts with DRAFT/PUBLISHED status management for iterative recipe development

### User Engagement
- **Secure User Authentication** – Implements JWT-based authentication with bcrypt password hashing and HTTP-only cookies
- **Review & Rating System** – Allows users to rate recipes and leave detailed reviews with automatic average rating calculations
- **Favorites Management** – Enables users to bookmark favorite recipes for quick access
- **User Profiles** – Features customizable bios, avatar uploads, and recipe portfolios

### Recipe Intelligence
- **Nutritional Information** – Calculates and displays calories, protein, fat, and carbohydrate content for recipes
- **Smart Search & Filtering** – Implements multi-criteria search across recipes, ingredients, and metadata
- **Allergen Tracking** – Tags recipes with common allergens for dietary awareness
- **Cuisine & Category Taxonomy** – Organizes recipes with hierarchical categories and cuisine classifications

### Technical Excellence
- **Responsive & Accessible UI** – Delivers mobile-first design with custom theming using Tailwind CSS and CSS custom properties
- **Media Management** – Supports recipe images and user avatars with optimized storage and delivery
- **Type-Safe Development** – Utilizes TypeScript with Zod validation for runtime type safety across the application
- **Modern Architecture** – Built with Next.js 15 App Router, React Server Components, and PostgreSQL with Prisma ORM

---

## 🛠️ Technologies Used

### Frontend Stack
- **Next.js 15.5.5** – React framework with App Router and Turbopack for optimized builds
- **React 19** – Latest React with Server Components and modern hooks
- **TypeScript 5.9** – Type-safe development with comprehensive type definitions
- **Tailwind CSS 4** – Utility-first CSS with custom theme system
- **Lucide React** – Modern icon library for consistent UI elements
- **next-themes** – Seamless theme switching with system preference support

### Backend & Data
- **PostgreSQL** – Robust relational database for recipe and user data
- **Prisma ORM 6.18** – Type-safe database client with migrations and schema management
- **JWT Authentication** – Secure token-based authentication with bcrypt password hashing
- **Zod 4.1** – Runtime schema validation for API requests and data integrity

### AI & Integrations
- **OpenAI API** – GPT-powered recipe parsing and nutritional estimation
- **Vercel Analytics & Speed Insights** – Performance monitoring and user analytics

### Development Tools
- **ESLint** – Code quality enforcement with Next.js best practices
- **Prisma Studio** – Visual database management and inspection
- **dotenv** – Environment configuration management

---

## 🏗️ Architectural Highlights

### Server/Client Component Separation
CookBook leverages Next.js 15's App Router architecture with strategic separation of Server and Client Components. Data fetching and authentication happen server-side for optimal performance and security, while interactive features like forms, media uploads, and dynamic UI utilize client components. This pattern reduces JavaScript bundle size and improves initial page load times.

### Database Schema Design
The application features a well-normalized PostgreSQL schema with 15+ models including Users, Recipes, Reviews, Categories, Cuisines, Tags, and Allergens. Relationships are carefully designed with cascade deletions, junction tables for many-to-many relationships, and indexed foreign keys for query performance. The schema supports hierarchical categories/cuisines and maintains referential integrity.

### Secure Authentication Flow
Authentication is implemented using JWT tokens stored in HTTP-only cookies, preventing XSS attacks. Passwords are hashed using bcrypt with automatic salt generation. The middleware layer protects dashboard routes, and the AuthContext provides client-side authentication state. API routes verify tokens before processing requests, ensuring end-to-end security.

### Scalable File Organization
The codebase follows Next.js 15 conventions with clear separation of concerns: `/app` for routes and API handlers, `/components` for reusable UI, `/lib` for utilities and shared logic, `/prisma` for database schema and migrations. Path aliases (`@/`) enable clean imports, and TypeScript interfaces are centralized in `/types` for consistency.

---

## 💡 Why This Project?

CookBook demonstrates **production-ready full-stack development** with emphasis on:

- **Code Quality** – Type-safe TypeScript, Zod validation, comprehensive error handling, and modular architecture
- **User-First Design** – Intuitive UX with responsive layouts, accessibility considerations, and thoughtful feature design
- **Modern Best Practices** – Server Components, optimistic updates, proper authentication patterns, and security-first approach
- **Scalability** – Well-designed database schema, efficient queries, and architecture that supports growth
- **Innovation** – AI integration for enhanced user experience and automated recipe parsing
- **Maintainability** – Clear code organization, consistent patterns, and comprehensive type definitions

This project showcases the ability to architect and implement a **complex, feature-rich application** using cutting-edge technologies while maintaining high standards for code quality, security, and user experience.

---

## 🔗 Links

- **Live Demo**: *Coming soon*
- **Repository**: [github.com/RhinoBytes/recipe-website](https://github.com/RhinoBytes/recipe-website)
- **Tech Stack Deep Dive**: See `AI_CONTEXT.md` for detailed architecture documentation

---

**Built with ❤️ using Next.js, React, TypeScript, and PostgreSQL**
