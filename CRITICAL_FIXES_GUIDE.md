# CRITICAL ISSUES - QUICK FIX GUIDE

## Issue #1: Cookie Name Inconsistency (BREAKS AUTH)

**Problem:** Three different cookie names used across the app:
- `auth_token` in lib/auth.ts
- `auth-token` in middleware.ts  
- `cookbook_token` in page files

**Impact:** Authentication completely broken, users cannot login/logout

**Quick Fix:**
1. Choose one name: `auth_token`
2. Update all 9 files:

```typescript
// middleware.ts (line 18)
- const authCookie = request.cookies.get("auth-token");
+ const authCookie = request.cookies.get("auth_token");

// app/(site)/auth/page.tsx (line 7)
- const token = (await cookies()).get("cookbook_token")?.value;
+ const token = (await cookies()).get("auth_token")?.value;

// app/(site)/browse/page.tsx
// app/(site)/[recipe]/page.tsx  
// app/(site)/new-recipe/page.tsx
// app/(site)/page.tsx
(Same change as above in each file)
```

---

## Issue #2: Empty Logout Endpoint (SECURITY)

**Problem:** File `app/api/auth/logout/route.ts` is completely empty

**Impact:** Users cannot logout, sessions cannot be terminated

**Quick Fix:**
Create the file with this content:

```typescript
import { NextResponse } from "next/server";
import { removeAuthCookie } from "@/lib/auth";

export async function POST() {
  try {
    await removeAuthCookie();
    return NextResponse.json({ 
      message: "Logged out successfully" 
    });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}
```

---

## Issue #3: Build Failure - Google Fonts

**Problem:** Build fails trying to fetch fonts from Google

**Quick Fix Option A (Disable fonts temporarily):**
```typescript
// app/layout.tsx
import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google"; // COMMENT OUT
import "./globals.css";
// ... rest of imports

// COMMENT OUT font declarations
// const geistSans = Geist({ ... });
// const geistMono = Geist_Mono({ ... });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body 
        // className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        className="antialiased" // Use system fonts
      >
        {children}
      </body>
    </html>
  );
}
```

**Quick Fix Option B (Use system fonts in CSS):**
Update `globals.css`:
```css
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
    'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 
    'Helvetica Neue', sans-serif;
}
```

---

## Issue #4: Weak JWT Secret (SECURITY)

**Problem:** Insecure fallback secret if env var missing

**Quick Fix:**
```typescript
// lib/auth.ts (line 5)
- const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";
+ const JWT_SECRET = process.env.JWT_SECRET;
+ if (!JWT_SECRET) {
+   throw new Error("JWT_SECRET environment variable is required");
+ }
```

**Don't forget to set in .env:**
```
JWT_SECRET=your-super-secret-key-min-32-chars-long-random-string
```

---

## Issue #5: Missing Server-Side Email Validation (SECURITY)

**Problem:** Register endpoint doesn't validate email format

**Quick Fix:**
```typescript
// app/api/auth/register/route.ts (after line 16)

if (!email || !password) {
  return NextResponse.json(
    { error: "Email and password are required" },
    { status: 400 }
  );
}

+ // Validate email format
+ const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
+ if (!emailRegex.test(email)) {
+   return NextResponse.json(
+     { error: "Invalid email format" },
+     { status: 400 }
+   );
+ }

if (password.length < 8) {
  // ... rest of code
```

---

## Issue #6: Production Logging of Queries (SECURITY)

**Problem:** Prisma logs all queries including sensitive data

**Quick Fix:**
```typescript
// lib/prisma.ts (line 7-9)
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
-   log: ["query", "error", "warn"],
+   log: process.env.NODE_ENV === "production" 
+     ? ["error"] 
+     : ["query", "error", "warn"],
  });
```

---

## Quick Fix Priority Order

1. **Cookie names** - Breaks auth completely
2. **Logout endpoint** - Security issue
3. **JWT secret validation** - Security issue  
4. **Build failure** - Can't deploy
5. **Email validation** - Security issue
6. **Query logging** - Security/compliance

---

## Testing After Fixes

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
echo 'DATABASE_URL="postgresql://..."' > .env
echo 'JWT_SECRET="your-random-32-char-secret"' >> .env

# 3. Run database migrations
npx prisma migrate dev

# 4. Try to build
npm run build

# 5. If build succeeds, test locally
npm run dev

# 6. Test authentication flow:
# - Register new user
# - Login
# - Access protected route
# - Logout
# - Verify cannot access protected route
```

---

## Files to Modify Summary

**Must change:**
1. `middleware.ts` - cookie name
2. `app/(site)/auth/page.tsx` - cookie name
3. `app/(site)/browse/page.tsx` - cookie name
4. `app/(site)/[recipe]/page.tsx` - cookie name
5. `app/(site)/new-recipe/page.tsx` - cookie name
6. `app/(site)/page.tsx` - cookie name
7. `app/api/auth/logout/route.ts` - implement endpoint
8. `lib/auth.ts` - JWT secret validation
9. `app/api/auth/register/route.ts` - email validation
10. `lib/prisma.ts` - conditional logging

**Optional (for build):**
11. `app/layout.tsx` - fix fonts

**Total files to change: 10-11 files**

---

## Estimated Time

- Cookie name fixes: 10 minutes
- Logout endpoint: 5 minutes
- JWT secret: 2 minutes
- Email validation: 5 minutes
- Prisma logging: 2 minutes
- Font fix: 5 minutes
- Testing: 15 minutes

**Total: ~45 minutes to fix all critical issues**
