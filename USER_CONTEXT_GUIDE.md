# UserContext Implementation Guide

## Executive Summary

This guide documents the implementation of a centralized user state management system for the Recipe Website application. Rather than creating a new UserContext from scratch, we enhanced the existing AuthContext/useAuth system to provide instant user updates across all components.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Implementation Details](#implementation-details)
3. [Component Integration](#component-integration)
4. [API Integration](#api-integration)
5. [Testing Guide](#testing-guide)
6. [Migration Examples](#migration-examples)

## Architecture Overview

### Current System

The application uses a well-designed authentication system:

```
┌─────────────────────────────────────────────────────┐
│                   Root Layout                        │
│  ┌───────────────────────────────────────────────┐  │
│  │           AuthProvider (Context)               │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │         useAuth Hook                     │  │  │
│  │  │  - useState (user, loading)              │  │  │
│  │  │  - useEffect (fetch from /api/auth)      │  │  │
│  │  │  - localStorage cache                    │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
         │              │              │
         ▼              ▼              ▼
    [Navbar]     [UserDropdown]   [Profile Page]
    useAuth()      useAuth()       useAuth()
```

### Enhanced Features

We added an `updateUser` function that enables instant, optimistic updates:

**Before:**
```typescript
// Update avatar -> API call -> refreshUser -> fetch /api/auth -> update all components
await fetch('/api/user/profile', { ... })
await refreshUser() // Full API roundtrip
```

**After:**
```typescript
// Update avatar -> API call -> updateUser -> instant UI update
await fetch('/api/user/profile', { ... })
updateUser({ avatarUrl: newUrl }) // Instant update everywhere
```

## Implementation Details

### Type Definitions

**File:** `types/index.ts`

```typescript
export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  bio?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void; // ✨ New!
}
```

### Hook Implementation

**File:** `hooks/useAuth.ts`

Key features:
- ✅ Client-side state management with React hooks
- ✅ localStorage persistence for offline/reload support
- ✅ Automatic API sync on mount
- ✅ Optimistic updates with `updateUser`

```typescript
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load from localStorage on mount (prevents hydration issues)
  useEffect(() => {
    const cached = localStorage.getItem('cookbook-user-cache');
    if (cached) setUser(JSON.parse(cached));
    setMounted(true);
  }, []);

  // Sync with server
  const loadUser = useCallback(async () => {
    const res = await fetch('/api/auth');
    const data = await res.json();
    if (data.authenticated) {
      setUser(data.user);
      localStorage.setItem('cookbook-user-cache', JSON.stringify(data.user));
    }
  }, []);

  // ✨ New: Instant optimistic updates
  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      const updatedUser = { ...prevUser, ...updates };
      localStorage.setItem('cookbook-user-cache', JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    logout,
    refreshUser: loadUser,
    updateUser, // ✨ Exported for components
  };
}
```

### Context Provider

**File:** `context/AuthContext.tsx`

```typescript
export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const auth = useAuth();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

## Component Integration

### High Priority: Profile Page

**File:** `app/profile/[userId]/page.tsx`

The profile page is the primary location for user data updates.

**Pattern:**
1. User makes a change (avatar or username)
2. Send API request
3. On success, call `updateUser` immediately
4. UI updates instantly across all components

```typescript
export default function ProfilePage({ params }) {
  const { user: currentUser, logout, updateUser } = useAuth();

  const handleAvatarSelect = async (avatarUrl: string) => {
    const response = await fetch('/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify({ avatarUrl }),
    });

    if (response.ok) {
      // ✨ Instant update - no need to wait for refreshUser
      updateUser({ avatarUrl });
      setShowAvatarModal(false);
    }
  };

  const handleUsernameUpdate = async () => {
    const response = await fetch('/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify({ username: newUsername }),
    });

    if (response.ok) {
      // ✨ Instant update across Navbar, UserDropdown, etc.
      updateUser({ username: newUsername });
      setEditingUsername(false);
    }
  };
}
```

### High Priority: Navbar Components

These components automatically receive updates through the context:

**UserDropdown.tsx** - Displays user avatar and username
```typescript
export default function UserDropdown() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  
  // Automatically re-renders when updateUser is called
  return (
    <button>
      {user?.avatarUrl && (
        <Image src={user.avatarUrl} alt={user.username} />
      )}
      <span>{user?.username || 'Account'}</span>
    </button>
  );
}
```

**MobileMenu.tsx** - Mobile navigation with user info
```typescript
export default function MobileMenu() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  
  // Also automatically updates when context changes
  return (
    <div>
      {isAuthenticated && user?.username && (
        <div>Welcome, {user.username}</div>
      )}
    </div>
  );
}
```

### Medium Priority: Other Components

These components work correctly as-is and don't need changes:

- **AuthForm.tsx** - Uses `refreshUser` after login (appropriate for full data load)
- **RecipeReviews.tsx** - Only checks `isAuthenticated` and `user.id`
- **ProtectedPage.tsx** - Only checks `isAuthenticated` and `loading`
- **FavoriteButton.tsx** - Only checks `isAuthenticated`

## API Integration

### User Profile Update Endpoint

**File:** `app/api/user/profile/route.ts`

This endpoint handles both avatar and username updates:

```typescript
export async function PATCH(request: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { avatarUrl, username } = await request.json();
  
  // Update database
  const updatedUser = await prisma.user.update({
    where: { id: currentUser.userId },
    data: { avatarUrl, username },
  });

  return NextResponse.json({
    message: "Profile updated successfully",
    user: updatedUser,
  });
}
```

**Client-side Integration Pattern:**
```typescript
// 1. Make API call
const response = await fetch('/api/user/profile', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ avatarUrl: newUrl }),
});

// 2. Update context on success
if (response.ok) {
  updateUser({ avatarUrl: newUrl }); // Instant UI update
}

// 3. Optional: Handle errors
if (!response.ok) {
  // Potentially rollback optimistic update
  refreshUser(); // Sync with server state
}
```

## Testing Guide

### Manual Testing Checklist

#### 1. Avatar Update Test
- [ ] Navigate to profile page
- [ ] Click on avatar to open picker
- [ ] Select a new avatar
- [ ] **Verify:** Avatar updates instantly in:
  - [ ] Profile page header
  - [ ] Navbar UserDropdown (top right)
  - [ ] Mobile menu (if on mobile)
- [ ] Refresh page
- [ ] **Verify:** Avatar persists after refresh

#### 2. Username Update Test
- [ ] Navigate to profile settings tab
- [ ] Click edit button next to username
- [ ] Enter new username
- [ ] Click save
- [ ] **Verify:** Username updates instantly in:
  - [ ] Profile page header
  - [ ] Navbar UserDropdown
  - [ ] Mobile menu
  - [ ] Settings tab
- [ ] Refresh page
- [ ] **Verify:** Username persists after refresh

#### 3. Login/Logout Test
- [ ] Log out
- [ ] Log back in
- [ ] **Verify:** User data loads correctly
- [ ] **Verify:** No hydration errors in console
- [ ] Make a profile update
- [ ] **Verify:** Updates still work

#### 4. localStorage Sync Test
- [ ] Make a profile update
- [ ] Open browser DevTools → Application → Local Storage
- [ ] Find `cookbook-user-cache` key
- [ ] **Verify:** Updated data is stored
- [ ] Close and reopen browser
- [ ] **Verify:** User still logged in with correct data

#### 5. Multi-Tab Test
- [ ] Open app in two browser tabs
- [ ] In Tab 1: Update avatar
- [ ] Switch to Tab 2
- [ ] Refresh Tab 2
- [ ] **Verify:** New avatar appears

### Browser Testing

Test in these browsers to ensure compatibility:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### Performance Testing

- [ ] Update avatar 5 times rapidly
- [ ] **Verify:** No lag or UI freezing
- [ ] **Verify:** No unnecessary re-renders (use React DevTools)
- [ ] **Verify:** No console errors

### Error Handling

- [ ] Disconnect network
- [ ] Attempt profile update
- [ ] **Verify:** Error message shown
- [ ] Reconnect network
- [ ] **Verify:** Can make updates again

## Migration Examples

### Example 1: Converting a Component to Use updateUser

**Before:**
```typescript
const handleUpdate = async (newData) => {
  const response = await fetch('/api/user/profile', {
    method: 'PATCH',
    body: JSON.stringify(newData),
  });
  
  if (response.ok) {
    await refreshUser(); // Wait for full API fetch
  }
};
```

**After:**
```typescript
const handleUpdate = async (newData) => {
  const response = await fetch('/api/user/profile', {
    method: 'PATCH',
    body: JSON.stringify(newData),
  });
  
  if (response.ok) {
    updateUser(newData); // Instant update
  }
};
```

### Example 2: Handling Partial Updates

```typescript
// Update just the bio
updateUser({ bio: 'Food enthusiast and home chef' });

// Update just the avatar
updateUser({ avatarUrl: '/images/avatar.jpg' });

// Update multiple fields
updateUser({
  username: 'newusername',
  bio: 'Updated bio',
});
```

### Example 3: Error Handling with Rollback

```typescript
const [originalUser, setOriginalUser] = useState(user);

const handleOptimisticUpdate = async (updates) => {
  // Save original state
  setOriginalUser(user);
  
  // Optimistic update
  updateUser(updates);
  
  try {
    const response = await fetch('/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      // Rollback on error
      updateUser(originalUser);
      alert('Update failed');
    }
  } catch (error) {
    // Rollback on network error
    updateUser(originalUser);
    alert('Network error');
  }
};
```

## Benefits of This Approach

### ✅ User Experience
- **Instant feedback** - UI updates immediately without waiting
- **Smooth interactions** - No loading spinners for updates
- **Consistent state** - All components show the same data

### ✅ Developer Experience
- **Simple API** - Just call `updateUser(changes)`
- **Type-safe** - TypeScript ensures correct usage
- **Familiar pattern** - Uses existing React hooks
- **Backward compatible** - `refreshUser` still available

### ✅ Performance
- **Reduced API calls** - Don't need to refetch entire user object
- **localStorage caching** - Fast initial loads
- **Automatic re-renders** - Only components using useAuth update

### ✅ Maintainability
- **Centralized logic** - All user state in one place
- **No prop drilling** - Direct hook access in any component
- **Easy to extend** - Can add more update functions as needed

## Future Enhancements

### Potential Improvements

1. **Server-Side Hydration**
   - Fetch user data in root layout (server component)
   - Pass as `initialUser` prop to AuthProvider
   - Eliminates initial client-side fetch
   
2. **Optimistic Update Queue**
   - Queue multiple updates
   - Batch API calls
   - Automatic retry on failure

3. **Real-time Updates**
   - WebSocket integration
   - Push updates from server
   - Multi-device sync

4. **Enhanced Error Handling**
   - Automatic rollback on API errors
   - Offline queue for updates
   - Conflict resolution

## Troubleshooting

### Issue: Updates don't appear in other components

**Cause:** Component not using `useAuth` hook or not wrapped in `AuthProvider`

**Solution:**
```typescript
// Make sure component uses the hook
import { useAuth } from '@/context/AuthContext';

function MyComponent() {
  const { user } = useAuth(); // ✅ Correct
  // const user = ...; // ❌ Wrong - not using context
}
```

### Issue: Hydration errors in console

**Cause:** Server and client render different content

**Solution:** Already handled by loading cached user only in `useEffect` (client-side only)

### Issue: Updates don't persist after refresh

**Cause:** localStorage not being updated

**Solution:** The `updateUser` function automatically updates localStorage. Check browser settings allow localStorage.

### Issue: "useAuth must be used within AuthProvider" error

**Cause:** Component rendered outside AuthProvider tree

**Solution:** Ensure root layout wraps children with `<AuthProvider>`

## Conclusion

The enhanced AuthContext system provides a robust, performant solution for user state management. By adding the `updateUser` function, we've enabled instant UI updates across all components while maintaining backward compatibility and keeping the codebase clean and maintainable.

Key takeaways:
- ✅ No new context needed - enhanced existing system
- ✅ Instant optimistic updates with `updateUser`
- ✅ Automatic propagation to all components
- ✅ localStorage persistence
- ✅ Type-safe and developer-friendly

For questions or issues, refer to the testing guide above or examine the implementation in:
- `hooks/useAuth.ts` - Core logic
- `context/AuthContext.tsx` - Context provider
- `app/profile/[userId]/page.tsx` - Usage example
