# QA Checklist: Media Model Migration

## Test Environment Setup

- [ ] Environment variables configured (CLOUDINARY_*)
- [ ] Database migrations applied successfully
- [ ] Development server running without errors
- [ ] Cloudinary account accessible and configured

---

## Phase 1: Backend API Tests

### Authentication Endpoints

#### GET /api/auth (Get Current User)
- [ ] Returns user data with computed `avatarUrl`
- [ ] Returns default avatar when user has no media
- [ ] Returns Cloudinary avatar URL when user has profile media
- [ ] Handles unauthenticated requests properly (401 or authenticated: false)

#### POST /api/auth/register (User Registration)
- [ ] Creates user successfully without avatar
- [ ] Returns user data with default avatar URL
- [ ] Does NOT create Media record during registration
- [ ] Sets proper JWT token in cookies

#### POST /api/auth/login (User Login)
- [ ] Authenticates user successfully
- [ ] Returns user data with avatar from Media
- [ ] Sets proper JWT token in cookies

### User Profile Endpoints

#### PATCH /api/user/username (Update Username)
- [ ] Updates username successfully
- [ ] Returns user with computed avatar URL
- [ ] Validates username uniqueness
- [ ] Requires authentication

#### PATCH /api/user/profile (Update Profile)
- [ ] Updates bio successfully
- [ ] Does NOT accept `avatarUrl` field anymore
- [ ] Returns user with computed avatar URL from Media
- [ ] Requires authentication

### Recipe Endpoints

#### GET /api/recipes/[slug] (Get Recipe Details)
- [ ] Returns recipe with media array
- [ ] Primary image is first or flagged correctly
- [ ] Author includes media for avatar
- [ ] Falls back to default images when no media

#### GET /api/recipes/featured (Get Featured Recipe)
- [ ] Returns featured recipe with image from media
- [ ] Uses primary media or first media item
- [ ] Falls back to default image when no media exists

#### GET /api/recipes/[slug]/reviews (Get Reviews)
- [ ] Returns reviews with reviewer avatars from Media
- [ ] Reviewer avatars fallback to default when no media
- [ ] Review creation includes proper avatar in response

### User Recipe Endpoints

#### GET /api/user/recipes (Get User's Recipes)
- [ ] Returns recipes with images from Media
- [ ] Each recipe has computed `imageUrl` from primary media
- [ ] Falls back to default recipe image when no media
- [ ] Requires authentication

### Favorites Endpoint

#### GET /api/favorites (Get User Favorites)
- [ ] Returns favorite recipes with images from Media
- [ ] Returns author avatars from Media
- [ ] Falls back to default images when no media
- [ ] Requires authentication

### Chef Endpoints

#### GET /api/chefs/chefSpotlight (Get Spotlight Chef)
- [ ] Returns chef data with avatar from Media
- [ ] Falls back to default chef avatar when no media
- [ ] Calculates ratings correctly

### Media Management Endpoints

#### POST /api/cloudinary/sign (Generate Upload Signature)
- [ ] Returns valid signature for authenticated user
- [ ] Validates recipe ownership when recipeId provided
- [ ] Generates proper folder structure
- [ ] Requires authentication

#### POST /api/media (Create Media Record)
- [ ] Creates media record after Cloudinary upload
- [ ] Validates required fields from Cloudinary
- [ ] Validates recipe ownership when recipeId provided
- [ ] Sets `isProfileAvatar` flag correctly
- [ ] Sets `isPrimary` flag correctly
- [ ] Requires authentication

#### GET /api/media?recipeId=xxx (List Recipe Media)
- [ ] Returns all media for a recipe
- [ ] Orders by creation date
- [ ] Does NOT include `avatarUrl` in user select

#### PATCH /api/media/[id] (Update Media Metadata)
- [ ] Updates `isPrimary` flag
- [ ] Updates `isProfileAvatar` flag
- [ ] Updates `altText` and `caption`
- [ ] Unsets other primary images when setting new primary
- [ ] Unsets other profile avatars when setting new avatar
- [ ] Validates ownership
- [ ] Requires authentication

#### DELETE /api/media/[id] (Delete Media)
- [ ] Deletes media from Cloudinary
- [ ] Deletes media record from database
- [ ] Validates ownership (uploader or recipe owner)
- [ ] Returns error if Cloudinary deletion fails
- [ ] Requires authentication

---

## Phase 2: Frontend Component Tests

### Recipe Detail Page
- [ ] `app/(site)/recipes/[username]/[slug]/page.tsx`
  - [ ] Displays recipe image from Media (primary or first)
  - [ ] Displays author avatar from Media
  - [ ] Falls back to default images when no media
  - [ ] Related recipes show images from Media

### Profile Page
- [ ] `app/(dashboard)/profile/[userId]/page.tsx`
  - [ ] Displays user avatar from Media
  - [ ] Shows MediaUploader component (when refactored)
  - [ ] Can upload new avatar
  - [ ] Can delete avatar
  - [ ] Shows default avatar when no media

### Recipe Components

#### RecipeCard
- [ ] `components/ui/RecipeCard.tsx`
  - [ ] Displays recipe image from Media
  - [ ] Displays author avatar from Media
  - [ ] Falls back to defaults when no media

#### ChefSpotlight
- [ ] `components/ui/ChefSpotlight.tsx`
  - [ ] Displays chef avatar from Media
  - [ ] Falls back to default when no media

#### BrowseRecipeCard
- [ ] `components/browse/BrowseRecipeCard.tsx`
  - [ ] Displays recipe image from Media
  - [ ] Displays author avatar from Media
  - [ ] Falls back to defaults

#### RecipeReviews
- [ ] `components/recipe/RecipeReviews.tsx`
  - [ ] Displays reviewer avatars from Media
  - [ ] Falls back to defaults when no media
  - [ ] New reviews show correct avatar

#### RelatedRecipes
- [ ] `components/recipe/RelatedRecipes.tsx`
  - [ ] Displays recipe images from Media
  - [ ] Uses primary or first media item
  - [ ] Falls back to default recipe image

### Navigation Components

#### UserDropdown
- [ ] `components/layout/UserDropdown.tsx`
  - [ ] Displays user avatar from Media
  - [ ] Falls back to default when no media
  - [ ] Shows username initial if no avatar

---

## Phase 3: Upload Flow Tests

### Profile Avatar Upload
- [ ] User can click upload avatar button
- [ ] File selector opens
- [ ] Selected image uploads to Cloudinary
- [ ] Media record created with `isProfileAvatar: true`
- [ ] Avatar displays immediately after upload
- [ ] Old avatar automatically unset when new one uploaded
- [ ] Can delete avatar
- [ ] Deleted avatar removed from Cloudinary
- [ ] Deleted avatar record removed from database
- [ ] Default avatar shows after deletion

### Recipe Image Upload
- [ ] User can upload recipe images
- [ ] Multiple images supported (up to max)
- [ ] Images upload to Cloudinary with recipe folder
- [ ] Media records created and linked to recipe
- [ ] First uploaded image set as primary
- [ ] Can change which image is primary
- [ ] Can delete individual images
- [ ] Primary flag moves to next image when primary deleted
- [ ] Images display in correct order

### Upload Validation
- [ ] File size limit enforced (5MB default)
- [ ] File type validation (images only)
- [ ] Ownership validation for recipe uploads
- [ ] Authentication required
- [ ] Proper error messages for validation failures
- [ ] Signature expires after reasonable time
- [ ] Can't upload to other user's recipes

---

## Phase 4: Seed Data Tests

### Seed Script Execution
- [ ] `npm run seed` completes without errors (when Phase 3 complete)
- [ ] Seed images uploaded to Cloudinary
- [ ] Seed images in `recipe-website/seed` folder
- [ ] Media records created for seed data
- [ ] Seed recipes linked to media
- [ ] Seed users have avatars (optional)
- [ ] All seed data properly tagged

### Seed Cleanup
- [ ] Cleanup script identifies seed media correctly
- [ ] Cleanup script deletes only seed assets from Cloudinary
- [ ] Cleanup script deletes seed Media records
- [ ] Cleanup script is idempotent (safe to run multiple times)
- [ ] Cleanup doesn't affect non-seed media
- [ ] Can re-run seed after cleanup

---

## Security Tests

### Authentication & Authorization
- [ ] Unauthenticated users cannot upload media
- [ ] Unauthenticated users cannot delete media
- [ ] Users cannot upload to other user's recipes
- [ ] Users cannot delete other user's media
- [ ] Recipe owners can delete recipe media
- [ ] Admin users can delete any media (if implemented)

### Signature Validation
- [ ] Invalid signature rejected by Cloudinary
- [ ] Expired signature rejected
- [ ] Signature cannot be reused after expiration
- [ ] Signature tied to correct folder/preset

### Data Validation
- [ ] SQL injection attempts blocked
- [ ] XSS attempts in altText/caption sanitized
- [ ] Invalid file types rejected
- [ ] Oversized files rejected
- [ ] Invalid Cloudinary responses handled gracefully

---

## Performance Tests

### Database Queries
- [ ] Media queries use proper indexes
- [ ] No N+1 query problems
- [ ] Pagination works efficiently
- [ ] Large media collections perform well

### Image Loading
- [ ] Images load with proper priority
- [ ] Lazy loading for off-screen images
- [ ] Proper image sizes for responsive design
- [ ] Next.js Image component optimization working

### Cloudinary Performance
- [ ] Uploads complete in reasonable time (<10s for typical images)
- [ ] Deletions complete quickly
- [ ] Signature generation is fast
- [ ] No rate limit issues during normal usage

---

## Error Handling Tests

### Network Errors
- [ ] Graceful handling of Cloudinary downtime
- [ ] Retry logic for transient failures
- [ ] User-friendly error messages
- [ ] Partial uploads handled correctly

### Database Errors
- [ ] Media creation failure rolls back properly
- [ ] Orphaned Cloudinary assets minimized
- [ ] Cascade deletes work correctly
- [ ] Foreign key constraints enforced

### Client Errors
- [ ] Invalid file selection shows error
- [ ] Upload failure shows error message
- [ ] Loading states during upload
- [ ] Progress indication for large uploads

---

## Compatibility Tests

### Browsers
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Devices
- [ ] Desktop (various screen sizes)
- [ ] Tablet (iPad, Android tablets)
- [ ] Mobile (iPhone, Android phones)
- [ ] Touch interactions work properly
- [ ] File upload works on mobile

---

## Migration Tests

### Fresh Installation
- [ ] Migrations run successfully on empty database
- [ ] Seed script works correctly
- [ ] Can create users and recipes
- [ ] Can upload media

### Upgrade from Previous Version
- [ ] Existing users can log in
- [ ] Users without avatars show default
- [ ] Recipes without images show default
- [ ] Can add avatars/images to existing users/recipes
- [ ] No data corruption

---

## Documentation Tests

### Code Documentation
- [ ] All API endpoints documented
- [ ] Component props documented
- [ ] Helper functions have JSDoc comments
- [ ] Complex logic explained in comments

### User Documentation
- [ ] CHANGELOG_OR_UPGRADE.md accurate
- [ ] MEDIA_MIGRATION_SUMMARY.md complete
- [ ] docs/UPLOADS.md reflects current implementation
- [ ] Environment variables documented

---

## Test Results Summary

**Date Tested**: _________________

**Tester**: _________________

**Environment**: _________________

**Pass Rate**: _____ / _____ tests passed

### Critical Issues Found
1. 
2. 
3. 

### Minor Issues Found
1. 
2. 
3. 

### Recommendations
1. 
2. 
3. 

### Sign-off

- [ ] All critical tests passed
- [ ] All blocking issues resolved
- [ ] Documentation complete and accurate
- [ ] Ready for production deployment

**Approved by**: _________________ **Date**: _________________
