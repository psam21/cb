# Dead Code Analysis - Shop Feature

## Analysis Method
1. Start with shop entry point: `src/app/shop/page.tsx`
2. Trace all imports recursively
3. Identify files that are NOT in the dependency tree
4. Verify files are truly unused (not imported anywhere)

## Shop Dependency Tree

### Entry Point
- `src/app/shop/page.tsx`

### Direct Dependencies (Level 1)
- `src/services/core/LoggingService.ts`
- `src/hooks/useShopProducts.ts`
- `src/components/shop/ProductCreationForm.tsx`
- `src/components/shop/ProductGrid.tsx`
- `src/services/business/ShopBusinessService.ts`

### Level 2 Dependencies
**useShopProducts.ts**:
- `src/stores/useShopStore.ts`

**ProductCreationForm.tsx**:
- `src/hooks/useShopPublishing.ts`
- `src/services/nostr/NostrEventService.ts`
- `src/services/generic/GenericRelayService.ts`

**ProductGrid.tsx**:
- `src/components/shop/ProductCard.tsx`

**ProductCard.tsx**:
- `next/image` (external)
- `src/services/core/LoggingService.ts`
- `src/services/business/ShopBusinessService.ts`

**ShopBusinessService.ts**:
- `src/services/core/LoggingService.ts`
- `src/types/nostr.ts`
- `src/services/generic/GenericBlossomService.ts`
- `src/services/nostr/NostrEventService.ts`
- `src/stores/ProductStore.ts`
- `src/services/generic/GenericEventService.ts`
- `src/services/generic/GenericRelayService.ts`

### Level 3 Dependencies
**useShopStore.ts**:
- `zustand` (external)
- `src/services/business/ShopBusinessService.ts`
- `src/services/generic/GenericRelayService.ts`

**useShopPublishing.ts**:
- `src/hooks/useNostrSigner.ts`
- `src/stores/useShopStore.ts`
- `src/services/business/ShopBusinessService.ts`
- `src/services/nostr/NostrEventService.ts`
- `src/services/generic/GenericRelayService.ts`

**NostrEventService.ts**:
- `src/services/core/LoggingService.ts`
- `src/types/nostr.ts`
- `src/errors/AppError.ts`
- `src/errors/ErrorTypes.ts`
- `src/services/generic/GenericEventService.ts`
- `src/services/generic/GenericRelayService.ts`

**GenericRelayService.ts**:
- `src/services/core/LoggingService.ts`
- `src/errors/AppError.ts`
- `src/errors/ErrorTypes.ts`
- `src/types/nostr.ts`
- `src/config/relays.ts`

**GenericBlossomService.ts**:
- `src/services/core/LoggingService.ts`
- `src/types/nostr.ts`
- `blossom-client-sdk` (external)

**GenericEventService.ts**:
- `src/services/core/LoggingService.ts`
- `src/types/nostr.ts`

**ProductStore.ts**:
- `src/services/business/ShopBusinessService.ts`
- `src/services/core/LoggingService.ts`

**useNostrSigner.ts**:
- `src/services/core/LoggingService.ts`
- `src/types/nostr.ts`
- `src/stores/useAuthStore.ts`
- `src/services/generic/GenericAuthService.ts`

### Level 4 Dependencies
**useAuthStore.ts**:
- `zustand` (external)
- `src/types/nostr.ts`

**GenericAuthService.ts**:
- `src/services/core/LoggingService.ts`
- `src/errors/AppError.ts`
- `src/errors/ErrorTypes.ts`
- `src/types/nostr.ts`
- `nostr-tools` (external)

**AppError.ts**:
- `src/errors/ErrorTypes.ts`

**LoggingService.ts**:
- `src/errors/ErrorTypes.ts`

**relays.ts**:
- No dependencies (config file)

## Files Used by Shop (Complete List)

### Core Shop Files
- `src/app/shop/page.tsx`
- `src/components/shop/ProductCreationForm.tsx`
- `src/components/shop/ProductGrid.tsx`
- `src/components/shop/ProductCard.tsx`

### Hooks
- `src/hooks/useShopProducts.ts`
- `src/hooks/useShopPublishing.ts`
- `src/hooks/useNostrSigner.ts`

### Services
- `src/services/business/ShopBusinessService.ts`
- `src/services/core/LoggingService.ts`
- `src/services/generic/GenericBlossomService.ts`
- `src/services/generic/GenericEventService.ts`
- `src/services/generic/GenericRelayService.ts`
- `src/services/generic/GenericAuthService.ts`
- `src/services/nostr/NostrEventService.ts`

### Stores
- `src/stores/useShopStore.ts`
- `src/stores/useAuthStore.ts`
- `src/stores/ProductStore.ts`

### Types
- `src/types/nostr.ts`

### Config
- `src/config/relays.ts`

### Errors
- `src/errors/ErrorTypes.ts`
- `src/errors/AppError.ts`

## Files NOT Used by Shop

### /data (6 files) - Static content data
- `src/data/about.ts` - About page content
- `src/data/elderStories.ts` - Elder stories data
- `src/data/exhibitions.ts` - Exhibitions data
- `src/data/explore.ts` - Explore page data
- `src/data/home.ts` - Home page data
- `src/data/resources.ts` - Resources data

### /lib (1 file) - Utility functions
- `src/lib/blur.ts` - Image blur utility

### /types (1 file) - Type definitions
- `src/types/content.ts` - Content type definitions

### /components (Multiple files) - UI components
- `src/components/Footer.tsx` - Site footer
- `src/components/Header.tsx` - Site header
- `src/components/pages/*` - All page content components
- `src/components/primitives/*` - UI primitive components
- `src/components/auth/SignerStatusIndicator.tsx` - Signer status (used by home page)

### /app (Multiple files) - App pages
- All pages except `src/app/shop/page.tsx`
- All test pages (`src/app/test-*`)

## Verification: Are These Files Used Elsewhere?

Let me check if the "unused" files are imported by other parts of the application:

### /data files
These are imported by:
- `src/components/pages/AboutContent.tsx` - uses `about.ts`
- `src/components/pages/ElderVoicesContent.tsx` - uses `elderStories.ts`
- `src/components/pages/ExhibitionsContent.tsx` - uses `exhibitions.ts`
- `src/components/pages/ExploreContent.tsx` - uses `explore.ts`
- `src/app/home-content.tsx` - uses `home.ts`
- `src/components/pages/DownloadsContent.tsx` - uses `resources.ts`

### /lib files
- `src/lib/blur.ts` - Not imported anywhere (confirmed dead code)

### /types files
- `src/types/content.ts` - Used by all `/data` files and page components

### /components files
- All components are used by their respective pages

## DEAD CODE IDENTIFIED

**Only 1 file is truly dead code:**
- `src/lib/blur.ts` - Not imported or used anywhere

## RECOMMENDATION

**Safe to delete:**
- `src/lib/blur.ts` - Confirmed unused

**DO NOT DELETE:**
- All `/data` files - Used by other pages
- All `/types` files - Used by other pages  
- All `/components` files - Used by other pages
- All `/app` files - Used by other pages

## CONCLUSION

The shop implementation is very clean with minimal dead code. Only 1 file (`src/lib/blur.ts`) can be safely removed as it's not used anywhere in the codebase.
