# Media Model Migration Summary

## Overview

This document provides a human-readable summary of the migration from direct URL fields (`imageUrl`, `avatarUrl`) to the Media model with Cloudinary integration.

## Migration Status: ✅ Phase 1 Complete, Phase 2 In Progress

### Completed Work

#### Database Layer (✅ Complete)
- **Media Model**: Fully defined in `prisma/schema.prisma` with all required fields
- **Migrations**: Two migrations created and applied
  - `20251102172700_add_media_model`: Creates Media table with proper indexes
  - `20251102173000_remove_image_url_avatar_url`: Removes old fields, adds `isProfileAvatar` and `isPrimary` flags

#### Backend APIs (✅ Complete - Phase 1)
All backend API endpoints have been updated to use the Media model:

1. **Authentication & User Management**
   - `app/api/auth/route.ts`: Returns user with avatar from Media
   - `app/api/auth/register/route.ts`: Users created without default avatar (add via Media API later)
   - `app/api/user/username/route.ts`: Returns avatar from Media
   - `app/api/user/profile/route.ts`: Deprecated avatar updates (use Media API directly)
   - `lib/auth.ts`: Removed `avatarUrl` from JWT payload

2. **Recipe Endpoints**
   - `app/api/recipes/[slug]/reviews/route.ts`: Uses Media for reviewer avatars
   - `app/api/recipes/featured/route.ts`: Uses Media for recipe images
   - `app/api/user/recipes/route.ts`: Returns recipe images from Media
   - `app/api/favorites/route.ts`: Uses Media for recipe images and author avatars

3. **Chef/User Endpoints**
   - `app/api/chefs/chefSpotlight/route.ts`: Uses Media for chef avatars

4. **Media Management**
   - `app/api/media/route.ts`: Fixed stale `avatarUrl` reference
   - `app/api/media/[id]/route.ts`: Already properly implemented
   - `app/api/cloudinary/sign/route.ts`: Already properly implemented

#### Frontend Components (🔄 In Progress - Phase 2)

**Completed:**
- `app/(site)/recipes/[username]/[slug]/page.tsx`: Recipe detail page updated
- `components/recipe/RelatedRecipes.tsx`: Accepts Media objects

**Remaining:**
- `app/(dashboard)/profile/[userId]/page.tsx`: Needs MediaUploader integration
- `components/ui/RecipeCard.tsx`: Needs Media object support
- `components/ui/ChefSpotlight.tsx`: Needs Media object support
- `components/browse/BrowseRecipeCard.tsx`: Needs Media object support
- `components/recipe/RecipeReviews.tsx`: Needs Media object support
- `components/layout/UserDropdown.tsx`: Needs Media object support
- `components/user/AvatarPicker.tsx`: Should be deprecated/refactored
- `types/index.ts`: Type definitions need updating

### Key Implementation Patterns

#### Querying User Avatars
```typescript
// In Prisma query
author: {
  select: {
    id: true,
    username: true,
    media: {
      where: { isProfileAvatar: true },
      select: {
        url: true,
        secureUrl: true,
      },
      take: 1,
    },
  },
}

// Extracting URL
const avatarMedia = user.media[0];
const avatarUrl = avatarMedia?.secureUrl || avatarMedia?.url || DEFAULT_USER_AVATAR;
```

#### Querying Recipe Images
```typescript
// In Prisma query
recipe: {
  select: {
    id: true,
    title: true,
    media: {
      select: {
        url: true,
        secureUrl: true,
        isPrimary: true,
      },
      orderBy: [
        { isPrimary: "desc" },
        { createdAt: "asc" },
      ],
    },
  },
}

// Extracting URL
const primaryMedia = recipe.media.find(m => m.isPrimary) || recipe.media[0];
const imageUrl = primaryMedia?.secureUrl || primaryMedia?.url || DEFAULT_RECIPE_IMAGE;
```

#### Setting Profile Avatar
```typescript
// 1. Upload to Cloudinary via /api/cloudinary/sign
// 2. Create Media record via /api/media with:
{
  isProfileAvatar: true,
  // ... other Cloudinary response fields
}
// This automatically unsets other profile avatars for the same user
```

#### Setting Recipe Primary Image
```typescript
// 1. Upload to Cloudinary via /api/cloudinary/sign with recipeId
// 2. Create Media record via /api/media with:
{
  recipeId: "recipe-id",
  isPrimary: true,
  // ... other Cloudinary response fields
}
// Use PATCH /api/media/[id] to change which image is primary
```

## Pending Work

### Phase 2: Frontend Components (Remaining)
Priority items:
1. **Profile Page**: `app/(dashboard)/profile/[userId]/page.tsx`
   - Remove AvatarPicker usage
   - Integrate MediaUploader component
   - Update avatar display logic

2. **Recipe Components**:
   - Update all recipe card components to use Media objects
   - Update type definitions
   - Ensure proper fallback to default images

### Phase 3: Seed Data Migration (Critical)
**Status**: Not started
**Priority**: High

The seed script currently:
- Copies images to local `public/uploads/` directory
- Assigns random placeholder avatars using `getRandomProfileAvatar()`
- Creates recipes with `imageUrl` field (which no longer exists in schema)

Required changes:
1. Upload seed images to Cloudinary with `folder: "recipe-website/seed"`
2. Create Media records for uploaded images
3. Link Media records to recipes/users
4. Tag all seed media for safe deletion
5. Create cleanup script to delete seed media

### Phase 4: Documentation & Testing
1. Complete CHANGELOG_OR_UPGRADE.md
2. Create QA checklist
3. Test all API endpoints
4. Test frontend components
5. Run security scan (CodeQL)
6. Final code review

## Breaking Changes

### API Response Changes

#### Before (Old Format)
```json
{
  "user": {
    "id": "123",
    "username": "john",
    "avatarUrl": "/img/users/avatar1.png"
  }
}
```

#### After (New Format)
```json
{
  "user": {
    "id": "123",
    "username": "john",
    "avatarUrl": "https://res.cloudinary.com/.../avatar.png",
    // Note: avatarUrl is computed from media relationship
    "media": [
      {
        "url": "http://res.cloudinary.com/.../avatar.png",
        "secureUrl": "https://res.cloudinary.com/.../avatar.png"
      }
    ]
  }
}
```

### Database Schema Changes

**Removed Fields:**
- `User.avatarUrl` - replaced by `User.media` relationship
- `Recipe.imageUrl` - replaced by `Recipe.media` relationship

**Added Model:**
- `Media` model with `isProfileAvatar` and `isPrimary` flags

## Environment Variables

Required for production:
```bash
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
CLOUDINARY_UPLOAD_PRESET="recipe-website"
```

## CI/CD Considerations

For testing environments:
1. Use a separate Cloudinary account or folder
2. Configure cleanup scripts to run after tests
3. Consider mocking Cloudinary uploads in unit tests
4. Ensure test data is tagged with `test` or environment name

## Migration Checklist for Deployment

- [ ] Ensure all environment variables are configured
- [ ] Run database migrations
- [ ] Update any deployment scripts
- [ ] Clear any cached API responses
- [ ] Test file upload functionality
- [ ] Verify old images/avatars display defaults properly
- [ ] Monitor Cloudinary usage and quotas

## Support and Troubleshooting

### Common Issues

1. **Missing avatar/image displays as broken**
   - Solution: Ensure DEFAULT_USER_AVATAR and DEFAULT_RECIPE_IMAGE constants are correct
   - Check that fallback logic is in place

2. **Upload fails with signature error**
   - Solution: Verify CLOUDINARY_API_SECRET is correct
   - Check timestamp synchronization

3. **Old data shows default images**
   - Expected behavior: Migration does not retroactively upload old images
   - Solution: Users must re-upload their avatars/images

4. **Seed script fails**
   - Solution: Implement Phase 3 seed migration before running seeds

## References

- `docs/UPLOADS.md`: Complete upload system documentation
- `prisma/schema.prisma`: Database schema with Media model
- `/tmp/media_migration_analysis.json`: Machine-readable analysis of all occurrences
