# Changelog and Upgrade Guide: Media Model Migration

## Version: Breaking Change - Media Model Migration
**Date**: November 2, 2025
**Type**: Major - Breaking Changes

---

## 🔥 Breaking Changes

### Database Schema

#### Removed Fields
- **`Recipe.imageUrl`** (String) - Removed completely
- **`User.avatarUrl`** (String) - Removed completely

#### Added Model
```prisma
model Media {
  id               String              @id @default(uuid())
  publicId         String              @unique
  url              String
  secureUrl        String?
  mimeType         String
  size             Int
  width            Int?
  height           Int?
  originalFilename String?
  folder           String?
  altText          String?
  caption          String?
  resourceType     MediaResourceType   @default(IMAGE)
  userId           String
  recipeId         String?
  isProfileAvatar  Boolean             @default(false)
  isPrimary        Boolean             @default(false)
  createdAt        DateTime            @default(now())

  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  recipe Recipe? @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([recipeId])
  @@index([publicId])
  @@index([userId, isProfileAvatar])
  @@index([recipeId, isPrimary])
}

enum MediaResourceType {
  IMAGE
  VIDEO
}
```

### API Response Changes

#### Authentication Endpoints

**`GET /api/auth`** (Get current user)

Before:
```json
{
  "authenticated": true,
  "user": {
    "id": "user-123",
    "username": "johndoe",
    "email": "john@example.com",
    "avatarUrl": "/img/users/avatar1.png"
  }
}
```

After:
```json
{
  "authenticated": true,
  "user": {
    "id": "user-123",
    "username": "johndoe",
    "email": "john@example.com",
    "avatarUrl": "https://res.cloudinary.com/.../avatar.png",
    // Note: avatarUrl now computed from media relationship
    "media": [...]
  }
}
```

**`POST /api/auth/register`** (Register new user)

Before:
- Users automatically assigned a random placeholder avatar
- Avatar stored in `avatarUrl` field

After:
- Users created without avatar
- Avatar must be added via Media API: `POST /api/media` with `isProfileAvatar: true`

#### Recipe Endpoints

**`GET /api/recipes/[slug]`**

Before:
```json
{
  "recipe": {
    "id": "recipe-123",
    "title": "Chocolate Cake",
    "imageUrl": "/uploads/recipes/recipe-123/image.jpg",
    "author": {
      "username": "johndoe",
      "avatarUrl": "/img/users/avatar1.png"
    }
  }
}
```

After:
```json
{
  "recipe": {
    "id": "recipe-123",
    "title": "Chocolate Cake",
    "media": [
      {
        "id": "media-123",
        "url": "http://res.cloudinary.com/.../image.jpg",
        "secureUrl": "https://res.cloudinary.com/.../image.jpg",
        "isPrimary": true
      }
    ],
    "author": {
      "username": "johndoe",
      "media": [
        {
          "url": "...",
          "secureUrl": "...",
          "isProfileAvatar": true
        }
      ]
    }
  }
}
```

#### Profile Update Endpoint

**`PATCH /api/user/profile`**

Before:
- Accepted `avatarUrl` field for updating avatar
- Could directly set avatar URL

After:
- `avatarUrl` field no longer accepted
- Avatar updates must use Media API:
  1. Upload to Cloudinary: `POST /api/cloudinary/sign`
  2. Create Media record: `POST /api/media` with `isProfileAvatar: true`
  3. Or delete old avatar: `DELETE /api/media/[id]`

---

## 📋 Upgrade Steps

### Step 1: Update Environment Variables

Add these to your `.env` file:

```bash
# Cloudinary Configuration (Required)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
CLOUDINARY_UPLOAD_PRESET="recipe-website"
```

**How to get these values:**
1. Create a Cloudinary account at https://cloudinary.com
2. Go to Dashboard → Settings → Account
3. Copy Cloud Name, API Key, and API Secret
4. Create an upload preset named "recipe-website" (Settings → Upload → Upload presets)

### Step 2: Run Database Migrations

```bash
# Install dependencies (if not already done)
npm install

# Run migrations
npx prisma migrate deploy

# Or for development:
npx prisma migrate dev
```

**Migrations applied:**
1. `20251102172700_add_media_model` - Creates Media table
2. `20251102173000_remove_image_url_avatar_url` - Removes old fields

**⚠️ WARNING**: These migrations are destructive:
- All existing `imageUrl` and `avatarUrl` data will be lost
- Users will need to re-upload avatars
- Recipe images will need to be re-uploaded
- Consider data backup before running

### Step 3: Update Frontend Code

#### A. Uploading Profile Avatar (New Flow)

Before:
```typescript
// Old way - direct avatar URL
const response = await fetch('/api/user/profile', {
  method: 'PATCH',
  body: JSON.stringify({
    avatarUrl: selectedAvatarUrl
  })
});
```

After:
```typescript
// New way - use Media API
// 1. Get upload signature
const signResponse = await fetch('/api/cloudinary/sign', {
  method: 'POST',
  body: JSON.stringify({})
});
const { signature, timestamp, apiKey, cloudName, folder } = await signResponse.json();

// 2. Upload to Cloudinary
const formData = new FormData();
formData.append('file', avatarFile);
formData.append('signature', signature);
formData.append('timestamp', timestamp);
formData.append('api_key', apiKey);
formData.append('folder', folder);

const cloudinaryResponse = await fetch(
  `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
  { method: 'POST', body: formData }
);
const uploadData = await cloudinaryResponse.json();

// 3. Save Media record
const mediaResponse = await fetch('/api/media', {
  method: 'POST',
  body: JSON.stringify({
    public_id: uploadData.public_id,
    secure_url: uploadData.secure_url,
    url: uploadData.url,
    bytes: uploadData.bytes,
    width: uploadData.width,
    height: uploadData.height,
    format: uploadData.format,
    isProfileAvatar: true, // Important!
  })
});
```

**Or use the MediaUploader component:**
```tsx
import MediaUploader from '@/components/MediaUploader';

<MediaUploader
  userId={user.id}
  existingMedia={user.media}
  onMediaUploaded={(media) => {
    // Handle successful upload
    console.log('Avatar uploaded:', media);
  }}
  maxFiles={1}
  isProfileAvatar={true}
/>
```

#### B. Uploading Recipe Images

```tsx
import MediaUploader from '@/components/MediaUploader';

<MediaUploader
  recipeId={recipe.id}
  existingMedia={recipe.media}
  onMediaUploaded={(media) => {
    console.log('Recipe image uploaded:', media);
  }}
  onMediaDeleted={(id) => {
    console.log('Image deleted:', id);
  }}
  maxFiles={5}
/>
```

#### C. Displaying Images/Avatars

Before:
```tsx
<Image
  src={user.avatarUrl || '/img/users/default-avatar.png'}
  alt={user.username}
  width={48}
  height={48}
/>
```

After:
```tsx
import { DEFAULT_USER_AVATAR } from '@/lib/constants';

const avatarMedia = user.media?.find(m => m.isProfileAvatar);
const avatarUrl = avatarMedia?.secureUrl || avatarMedia?.url || DEFAULT_USER_AVATAR;

<Image
  src={avatarUrl}
  alt={user.username}
  width={48}
  height={48}
/>
```

### Step 4: Update Backend Queries

#### Querying Users with Avatars

Before:
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    username: true,
    avatarUrl: true, // ❌ No longer exists
  },
});
```

After:
```typescript
import { DEFAULT_USER_AVATAR } from '@/lib/constants';

const user = await prisma.user.findUnique({
  where: { id: userId },
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
});

// Extract avatar URL
const avatarMedia = user.media[0];
const avatarUrl = avatarMedia?.secureUrl || avatarMedia?.url || DEFAULT_USER_AVATAR;

// Return to client
return {
  ...user,
  avatarUrl, // Computed field for backwards compatibility
};
```

#### Querying Recipes with Images

Before:
```typescript
const recipe = await prisma.recipe.findUnique({
  where: { id: recipeId },
  select: {
    id: true,
    title: true,
    imageUrl: true, // ❌ No longer exists
  },
});
```

After:
```typescript
import { DEFAULT_RECIPE_IMAGE } from '@/lib/constants';

const recipe = await prisma.recipe.findUnique({
  where: { id: recipeId },
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
        { isPrimary: 'desc' },
        { createdAt: 'asc' },
      ],
    },
  },
});

// Extract primary image URL
const primaryMedia = recipe.media.find(m => m.isPrimary) || recipe.media[0];
const imageUrl = primaryMedia?.secureUrl || primaryMedia?.url || DEFAULT_RECIPE_IMAGE;

// Return to client
return {
  ...recipe,
  imageUrl, // Computed field for backwards compatibility
};
```

### Step 5: Update Seed Scripts

The seed script needs major updates to upload to Cloudinary. See `prisma/seed.ts`.

**Required changes:**
1. Upload seed images to Cloudinary with `folder: "recipe-website/seed"`
2. Create Media records instead of setting `imageUrl`/`avatarUrl`
3. Tag all seed assets for cleanup

**Example seed update:**
```typescript
// Before
const user = await prisma.user.create({
  data: {
    username: 'johndoe',
    email: 'john@example.com',
    passwordHash: await bcrypt.hash('password', 10),
    avatarUrl: getRandomProfileAvatar(), // ❌ Field doesn't exist
  },
});

// After
const user = await prisma.user.create({
  data: {
    username: 'johndoe',
    email: 'john@example.com',
    passwordHash: await bcrypt.hash('password', 10),
    // No avatar - will be added via Media
  },
});

// Optionally upload seed avatar
if (process.env.NODE_ENV === 'development') {
  // Upload to Cloudinary with folder "recipe-website/seed"
  // Create Media record with isProfileAvatar: true
}
```

---

## 🧪 Testing Checklist

- [ ] Users can register successfully without errors
- [ ] Existing users can log in
- [ ] Default avatar displays for users without avatar
- [ ] Users can upload profile avatar via Media API
- [ ] Users can delete their avatar
- [ ] Only one avatar per user is marked as `isProfileAvatar`
- [ ] Recipe images upload successfully
- [ ] Multiple images per recipe supported
- [ ] Primary recipe image displays correctly
- [ ] Can change which image is primary
- [ ] Delete recipe image works
- [ ] Cloudinary assets are deleted when Media record deleted
- [ ] Seed script runs without errors
- [ ] Seed cleanup script works (when implemented)
- [ ] Default images display when no media exists
- [ ] API returns computed `avatarUrl`/`imageUrl` for compatibility

---

## 🐛 Troubleshooting

### Issue: Migration fails with foreign key errors

**Solution**: Ensure all related data is cleaned up:
```bash
npx prisma migrate reset  # WARNING: Deletes all data
npx prisma migrate deploy
npm run seed
```

### Issue: Upload fails with "signature invalid"

**Cause**: Incorrect `CLOUDINARY_API_SECRET` or timestamp issues

**Solution**:
1. Verify environment variable is correct
2. Check server time is synchronized
3. Regenerate signature

### Issue: Images don't display

**Possible causes:**
1. Missing default image constants
2. Incorrect Media query
3. Cloudinary URLs expired/invalid

**Solution**:
1. Verify DEFAULT_USER_AVATAR and DEFAULT_RECIPE_IMAGE constants exist
2. Check Media records exist in database
3. Test Cloudinary URLs directly in browser

### Issue: Seed script fails

**Solution**: The seed script needs to be updated for Phase 3. For now:
```bash
# Option 1: Skip seeds temporarily
# Don't run npm run seed until Phase 3 complete

# Option 2: Manually create test data
# Use the UI to upload images and create recipes
```

---

## 📚 Additional Resources

- **Upload Documentation**: `docs/UPLOADS.md`
- **Migration Summary**: `MEDIA_MIGRATION_SUMMARY.md`
- **Media Model Schema**: `prisma/schema.prisma`
- **Cloudinary Docs**: https://cloudinary.com/documentation
- **Prisma Docs**: https://www.prisma.io/docs

---

## 🔐 Security Considerations

1. **Never expose `CLOUDINARY_API_SECRET` to client**
   - Use server-side signature generation: `/api/cloudinary/sign`

2. **Validate file uploads**
   - Check file size (default: 5MB max)
   - Check file type (images/videos only)
   - Validate ownership before creating Media records

3. **Authentication required**
   - All Media operations require authentication
   - Recipe ownership verified before allowing media uploads

4. **Automatic cleanup**
   - Media records cascade delete with User/Recipe
   - Cloudinary assets deleted when Media record deleted

---

## 📞 Support

For issues or questions:
1. Check this upgrade guide
2. Review `MEDIA_MIGRATION_SUMMARY.md`
3. Check `docs/UPLOADS.md`
4. Open an issue on GitHub
