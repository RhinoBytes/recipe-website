/**
 * Application-wide constants and configuration
 */

// Authentication
export const AUTH_COOKIE_NAME = "auth_token";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
export const PASSWORD_MIN_LENGTH = 8;
export const JWT_EXPIRES_IN = "7d";

// Validation
export const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

// API Routes
export const API_ROUTES = {
  AUTH: "/api/auth",
  LOGIN: "/api/auth/login",
  REGISTER: "/api/auth/register",
  LOGOUT: "/api/auth/logout",
  RECIPES: "/api/recipes",
  USER: "/api/user",
} as const;

// Page Routes
export const PAGE_ROUTES = {
  HOME: "/",
  AUTH: "/auth",
  BROWSE: "/browse",
  PROFILE: "/profile",
  NEW_RECIPE: "/new-recipe",
} as const;

// Protected Routes (for middleware)
export const PROTECTED_ROUTES = ["/new-recipe", "/dashboard", "/profile"];

// UI Constants
export const THEME_COLORS = {
  PRIMARY: "#d4735a",
  PRIMARY_DARK: "#b85c42",
  SECONDARY: "#fef9f7",
  ACCENT: "#f0d5cf",
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 100;
