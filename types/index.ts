// Shared TypeScript types for the application

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  bio?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Recipe {
  id: string;
  title: string;
  image: string;
  time: number;
  rating: number;
  author: {
    name: string;
    avatar: string;
    username?: string;
  };
}

export interface Category {
  slug: string;
  name: string;
  image: string;
}

export interface FeaturedRecipe {
  id: string;
  title: string;
  description: string;
  image: string;
}

export interface Chef {
  id: string;
  name: string;
  title: string;
  avatar: string;
  quote: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}
