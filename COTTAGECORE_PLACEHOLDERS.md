# Cottagecore Placeholder Images & Profile Avatars

This document describes the cottagecore-themed placeholder images and profile avatars available in the application.

## Overview

The application provides SVG-based, cottagecore-themed placeholder images for recipes and profile avatars. These are inline data URLs that require no external image hosting and match the application's aesthetic.

## Recipe Placeholders

Six different cottagecore-themed recipe placeholder designs are available:

1. **Wildflower Meadow** - Soft florals with pastel colors
2. **Rustic Kitchen** - Warm kitchen scene with utensils
3. **Garden Harvest** - Fresh vegetables and herbs
4. **Cozy Teatime** - Tea service with steam and warmth
5. **Vintage Recipe Book** - Classic recipe card aesthetic
6. **Pastoral Scene** - Countryside cottage scene

### Usage

```typescript
import { getRandomRecipePlaceholder, getRecipePlaceholder } from '@/lib/cottagecorePlaceholders';

// Get a random placeholder
const placeholder = getRandomRecipePlaceholder();

// Get a specific placeholder by index (0-5)
const placeholder = getRecipePlaceholder(2); // Gets the Garden Harvest placeholder
```

### With Custom Hook

```typescript
import { useRecipePlaceholder } from '@/hooks/useCottagecorePlaceholders';

// Returns the imageUrl if valid, otherwise returns a random placeholder
const recipeImage = useRecipePlaceholder(recipe.imageUrl);
```

## Profile Avatars

Ten cottagecore-themed profile avatars are available:

1. **Sage Green with Flower** - Circular flower design
2. **Blush Pink with Heart** - Romantic heart motif
3. **Earthy Brown with Leaf** - Natural leaf design
4. **Butter Yellow with Sun** - Cheerful sun rays
5. **Sage with Mushroom** - Whimsical mushroom
6. **Rose with Butterfly** - Delicate butterfly wings
7. **Mint with Botanical** - Botanical leaf pattern
8. **Lavender with Moon** - Crescent moon design
9. **Cream with Teacup** - Cozy teacup scene
10. **Peach with Berry** - Berry cluster design

### Usage

```typescript
import { 
  getRandomProfileAvatar, 
  getProfileAvatar,
  getAllProfileAvatars 
} from '@/lib/cottagecorePlaceholders';

// Get a random avatar
const avatar = getRandomProfileAvatar();

// Get a specific avatar by index (0-9)
const avatar = getProfileAvatar(3); // Gets the Butter Yellow with Sun avatar

// Get all avatars (useful for avatar picker)
const allAvatars = getAllProfileAvatars();
```

### With Custom Hook

```typescript
import { useProfileAvatar } from '@/hooks/useCottagecorePlaceholders';

// Returns the avatarUrl if valid, otherwise returns a random avatar
const userAvatar = useProfileAvatar(user.avatarUrl);
```

## Avatar Picker Component

A dedicated component for selecting profile avatars:

```tsx
import AvatarPicker from '@/components/AvatarPicker';

function ProfileSettings() {
  const [selectedAvatar, setSelectedAvatar] = useState('');
  
  return (
    <AvatarPicker
      currentAvatar={selectedAvatar}
      onSelect={(avatar) => setSelectedAvatar(avatar)}
    />
  );
}
```

## Image Component Usage

When using with Next.js Image component, add `unoptimized` prop for data URLs:

```tsx
<Image
  src={placeholder}
  alt="Recipe"
  fill
  unoptimized={placeholder.startsWith('data:')}
/>
```

## Benefits

- **No External Dependencies**: All images are inline SVG data URLs
- **Theme Consistency**: Matches the cottagecore color palette
- **Performance**: Small file sizes, no HTTP requests
- **Responsive**: SVG scales perfectly at any size
- **Accessibility**: Semantic alt text support
- **Deterministic**: Same placeholder for same index (useful for consistency)

## Color Palette Used

All placeholders use the cottagecore theme colors:

- `#FAF8F5` - Light cream background
- `#A8BBA0` - Sage green (primary accent)
- `#EBC8C0` - Blush pink (secondary accent)
- `#F2E2B9` - Butter yellow (highlight)
- `#8C6B56` - Earthy brown (muted)
- `#E5E1DA` - Warm border
- `#C5D4BE` - Light sage

## Future Enhancements

Potential additions:
- Seasonal variations (autumn, winter, spring themes)
- User-uploadable custom avatars
- More recipe category-specific placeholders
- Animated SVG placeholders
