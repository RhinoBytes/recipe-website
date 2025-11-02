# Cloudinary Media Upload System

## Overview

This document describes the Cloudinary-based media upload system for the Recipe Website. **Breaking change: `Recipe.imageUrl` and `User.avatarUrl` fields have been removed** and replaced with a Media model.

## Environment Variables

Required (add to `.env` or CI secrets):

```bash
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
CLOUDINARY_UPLOAD_PRESET="recipe-website"
```

## API Endpoints

- **POST /api/cloudinary/sign** - Generate upload signature
- **POST /api/media** - Persist media after Cloudinary upload
- **GET /api/media?recipeId=xxx** - List recipe media
- **PATCH /api/media/[id]** - Update media metadata (isPrimary, altText, etc.)
- **DELETE /api/media/[id]** - Delete from Cloudinary + DB

## Usage

### MediaUploader Component

```tsx
import MediaUploader from "@/components/MediaUploader";

<MediaUploader
  recipeId={recipe.id}
  existingMedia={media}
  onMediaUploaded={(media) => console.log('Uploaded')}
  onMediaDeleted={(id) => console.log('Deleted')}
  maxFiles={5}
/>
```

### Querying Recipe with Media

```tsx
const recipe = await prisma.recipe.findUnique({
  where: { slug },
  include: {
    media: {
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'asc' },
      ],
    },
  },
});

const primaryImage = recipe.media?.find(m => m.isPrimary) || recipe.media?.[0];
const imageUrl = primaryImage?.secureUrl || primaryImage?.url || DEFAULT_IMAGE;
```

## Migrations

Run database migrations:

```bash
npx prisma migrate deploy
```

Migrations included:
1. `20251102172700_add_media_model` - Adds Media table
2. `20251102173000_remove_image_url_avatar_url` - Removes old fields

## Key Changes

- ❌ Removed: `Recipe.imageUrl` field
- ❌ Removed: `User.avatarUrl` field  
- ✅ Added: `Media` model with relations
- ✅ Added: `isPrimary` flag for recipe main images
- ✅ Added: `isProfileAvatar` flag for user avatars
- ✅ Direct client-to-Cloudinary uploads
- ✅ Automatic deletion cascade

## Security

- Never expose `CLOUDINARY_API_SECRET` to client
- Server generates signed upload signatures
- Owner/recipe-owner validation enforced
- File size limits (5MB default)
