import { getRandomRecipePlaceholder } from '@/lib/placeholders';
import { getRandomProfilePhoto } from '@/lib/profilePhotos';

/**
 * Custom hook for placeholder images
 * Provides easy access to placeholder images throughout the app
 */

/**
 * Get a fallback recipe image
 * Returns a themed placeholder if the provided image is invalid or missing
 */
export function useRecipePlaceholder(imageUrl?: string | null): string {
  if (!imageUrl || imageUrl.trim() === '') {
    return getRandomRecipePlaceholder();
  }
  return imageUrl;
}

/**
 * Get a fallback profile avatar
 * Returns a default profile photo if the provided avatar is invalid or missing
 */
export function useProfileAvatar(avatarUrl?: string | null): string {
  if (!avatarUrl || avatarUrl.trim() === '') {
    return getRandomProfilePhoto();
  }
  return avatarUrl;
}

/**
 * Check if a URL is a placeholder (data URL)
 */
export function isPlaceholder(url: string): boolean {
  return url.startsWith('data:image/svg+xml');
}
