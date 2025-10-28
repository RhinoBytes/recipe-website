# Deployment Guide

This guide explains how to deploy the avatar and styling updates to production.

## Pre-Deployment Checklist

### 1. Database Verification
✅ No schema changes required
✅ No new migrations needed
✅ Existing `User.avatarUrl` field will be used

### 2. Environment Variables
No new environment variables required. Ensure existing variables are set:
```bash
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
```

### 3. Build Verification
```bash
npm run build
```
Expected result: ✅ Build successful (1 pre-existing warning is OK)

## Deployment Steps

### Step 1: Deploy Code
```bash
# Pull latest changes
git pull origin copilot/update-user-avatar-functionality

# Install dependencies (if needed)
npm install

# Build for production
npm run build

# Start production server
npm start
```

### Step 2: Update Seed Data (Optional but Recommended)
If you want to update existing users with cottagecore avatars:

```bash
# This will reset ALL data and reseed with new avatars
npm run seed
```

⚠️ **Warning**: This will delete all existing data. Only run in development or with a backup.

### Step 3: Migrate Existing Users (Safer Alternative)
If you don't want to reset data, create a migration script:

```javascript
// scripts/migrate-avatars.ts
import { PrismaClient } from "@prisma/client";
import { getRandomProfileAvatar } from "./lib/cottagecorePlaceholders";

const prisma = new PrismaClient();

async function migrateAvatars() {
  // Update users without avatars
  const usersWithoutAvatars = await prisma.user.findMany({
    where: {
      OR: [
        { avatarUrl: null },
        { avatarUrl: "" },
        { avatarUrl: { startsWith: "/users/" } } // old hardcoded paths
      ]
    }
  });

  console.log(`Updating ${usersWithoutAvatars.length} users...`);

  for (const user of usersWithoutAvatars) {
    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: getRandomProfileAvatar() }
    });
  }

  console.log("Migration complete!");
}

migrateAvatars()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run with:
```bash
npx tsx scripts/migrate-avatars.ts
```

## Post-Deployment Verification

### 1. Test New User Registration
1. Visit `/auth?tab=register`
2. Register a new account
3. ✅ Verify avatar appears in navbar immediately
4. ✅ Verify no 404 or errors

### 2. Test Login Flow
1. Login with existing account
2. ✅ Verify avatar appears in navbar
3. ✅ Verify no page reload needed

### 3. Test Logout Flow
1. Click logout
2. ✅ Verify redirect to `/auth` (not `/login`)
3. ✅ Verify no 404 error

### 4. Test Profile Page
1. Navigate to `/profile`
2. ✅ Verify avatar displays in header
3. Click avatar
4. ✅ Verify modal opens with avatar grid
5. Select new avatar
6. ✅ Verify avatar updates immediately
7. Go to Settings tab
8. Click edit on username
9. Try changing to "ab" (2 chars)
10. ✅ Verify error message appears
11. Change to "newusername123"
12. Click Save
13. ✅ Verify username updates

### 5. Test Main Page Categories
1. Visit home page
2. Scroll to "Browse by Category"
3. ✅ Verify 6 unique category images
4. ✅ Verify categories: Dessert, Lunch, Dinner, Breakfast, Snack, Appetizer

### 6. Test Recipe Pages
1. Visit any recipe detail page
2. ✅ Verify color scheme matches theme
3. ✅ Check ingredients section uses theme colors
4. ✅ Check instructions use theme colors
5. Toggle dark mode
6. ✅ Verify colors adapt properly

### 7. Test Browse Page
1. Visit `/browse`
2. ✅ Verify color scheme is consistent
3. ✅ Check search bar styling
4. ✅ Check filter sections
5. ✅ Check recipe cards

## Rollback Plan

If issues occur, rollback is simple:

```bash
# Rollback to previous commit
git revert HEAD~2..HEAD

# Or checkout previous stable version
git checkout <previous-commit-hash>

# Rebuild and restart
npm run build
npm start
```

**Data Rollback**: If you ran the seed script and need to restore data, use your database backup:
```bash
# Example with PostgreSQL
psql -U username -d recipe_db < backup.sql
```

## Monitoring

After deployment, monitor:

1. **Error Logs**: Check for any JavaScript errors in browser console
2. **API Errors**: Monitor `/api/user/profile` endpoint
3. **Database**: Check for failed updates on User table
4. **Performance**: Avatar images are small (~1-2KB), should not impact load times

## Common Issues and Solutions

### Issue: Avatars not displaying
**Solution**: Check that `unoptimized` prop is set on Image components for data: URLs

### Issue: Username update fails
**Solution**: Verify sanitizeInput function is working correctly and database connection is stable

### Issue: 404 on logout
**Solution**: Clear browser cache and verify `/auth` route exists

### Issue: Theme colors not applying
**Solution**: Check that `app/theme.css` is imported in the layout

## Success Criteria

✅ New users get random avatars
✅ Avatar displays in navbar
✅ Avatar updates without page reload
✅ Profile page shows avatar and allows selection
✅ Username can be edited
✅ Logout redirects to `/auth`
✅ Categories have unique images
✅ Recipe pages use theme colors
✅ No security vulnerabilities
✅ Build passes successfully

## Support

For issues or questions:
1. Check `IMPLEMENTATION_SUMMARY.md` for technical details
2. Check `VISUAL_CHANGES.md` for expected UI changes
3. Review code comments in changed files
4. Check commit history for context

## Performance Metrics

Expected metrics after deployment:
- Page load time: No significant change (avatars are tiny)
- Initial render: Faster (no HTTP requests for images)
- Category page: Improved (unique images enhance UX)
- Profile updates: <500ms for avatar/username changes
