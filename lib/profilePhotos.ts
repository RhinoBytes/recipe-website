/**
 * Profile Photos Utilities
 * Functions to manage default profile avatars from public/img/profile-photos
 */

/**
 * List of default profile photos available for user selection
 * These are located in public/img/profile-photos/
 */
const PROFILE_PHOTOS = [
  '/img/profile-photos/chef.jpg',
  '/img/profile-photos/chef1.jpg',
  '/img/profile-photos/chef2.jpg',
  '/img/profile-photos/chef3.jpg',
  '/img/profile-photos/chef4.jpg',
];

/**
 * Get all available profile photos
 */
export function getAllProfilePhotos(): string[] {
  return [...PROFILE_PHOTOS];
}

/**
 * Get a random profile photo
 */
export function getRandomProfilePhoto(): string {
  return PROFILE_PHOTOS[Math.floor(Math.random() * PROFILE_PHOTOS.length)];
}

/**
 * Get a specific profile photo by index
 */
export function getProfilePhoto(index: number): string {
  return PROFILE_PHOTOS[index % PROFILE_PHOTOS.length];
}
