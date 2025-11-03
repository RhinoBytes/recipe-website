// Shared TypeScript types for the application

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  bio?: string | null;
  avatarUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Recipe {
  id: string;
  title: string;
  image: string;
  time: number;
  rating: number;
  author: {
    name: string;
    avatar: string; // Computed from media or default
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
  slug: string | null;
  username: string;
  title: string;
  description: string;
  image: string;
}

export interface RelatedRecipe {
  id: string;
  title: string;
  slug: string | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  difficulty: string | null;
  averageRating: number;
  media: Array<{
    url: string;
    secureUrl: string | null;
    isPrimary: boolean;
  }>;
  author: {
    username: string;
  };
}

export interface Chef {
  id: string;
  name: string;
  title: string;
  avatar: string; // Computed from media or default
  quote: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

// Filter metadata interface used in browse page
export interface FilterOption {
  id: string;
  name: string;
  count?: number;
}

// Detailed recipe interface used in recipe detail pages
export interface DetailedRecipe {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  servings: number | null;
  difficulty: string | null;
  rating: number;
  reviewCount: number;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string | null; // Computed from media or default
  };
  tags: string[];
  categories: string[];
  cuisine: string | null;
  allergens: string[];
}

// Pagination info interface
export interface PaginationInfo {
  page: number;
  perPage: number;
  totalCount: number;
  totalPages: number;
}

// Media types for Cloudinary integration
export interface Media {
  id: string;
  publicId: string;
  url: string;
  secureUrl: string | null;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  originalFilename: string | null;
  folder: string | null;
  altText: string | null;
  caption: string | null;
  resourceType: "IMAGE" | "VIDEO";
  userId: string;
  recipeId: string | null;
  isProfileAvatar: boolean;
  isPrimary: boolean;
  createdAt: Date | string;
}

export interface MediaWithUser extends Media {
  user: {
    id: string;
    username: string;
  };
}
