# User Management & Authentication Capabilities

## Overview

This document outlines the comprehensive capabilities needed to implement user authentication and profile management in the Culture Bridge Nostr Shop. The implementation follows our established Service-Oriented Architecture (SOA) patterns and integrates with existing authentication infrastructure.

**New Pages:**
- `/signin` - Sign-in page with NIP-07 authentication
- `/profile` - User profile page with NIP-24 metadata fields

**Header Integration:**
- Shows "Sign In" button when not authenticated
- Shows user's name with dropdown when authenticated
- Dropdown contains: "My Profile" and "My Shop" links

## Current State Analysis

### ✅ What's Already Built
- **NIP-07 Authentication**: `GenericAuthService` and `useNostrSigner` hook
- **Authentication State**: `useAuthStore` for user state management
- **Signer Detection**: NIP-07 browser extension detection
- **Event Signing**: Complete signing workflow via `GenericEventService`

### ❌ What's Missing
- **Sign-in Page**: Dedicated `/signin` page with UI/UX patterns from cbc3
- **Profile Page**: User profile display with NIP-24 metadata fields
- **Header Integration**: Authentication-aware header button
- **Profile Data Management**: NIP-24 metadata parsing and display
- **User Experience**: Seamless authentication flow

## Required Capabilities

### 1. **Sign-in Page Infrastructure**

#### 1.1 New Page Route
```typescript
// New page: src/app/signin/page.tsx
export default function SigninPage() {
  return (
    <div className="min-h-screen bg-primary-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <SigninForm />
      </div>
    </div>
  );
}
```

#### 1.2 Signin Form Component
```typescript
// New component: src/components/auth/SigninForm.tsx
interface SigninFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export const SigninForm = ({ onSuccess, redirectTo }: SigninFormProps) => {
  const { isAvailable, isLoading, error, getSigner } = useNostrSigner();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signinError, setSigninError] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setSigninError(null);
      
      const signer = await getSigner();
      // Authentication happens automatically via useNostrSigner
      
      onSuccess?.();
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.push('/profile');
      }
    } catch (err) {
      setSigninError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-serif font-bold text-primary-800">Sign In</h1>
        <p className="text-gray-600 mt-2">Connect your Nostr account to continue</p>
      </div>

      {!isAvailable && !isLoading && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Nostr Extension Required</h3>
          <p className="text-yellow-700 text-sm mb-3">
            Please install a Nostr browser extension to sign in:
          </p>
          <div className="space-y-2">
            <a href="https://getalby.com" target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:text-blue-800 text-sm">
              • Alby (recommended)
            </a>
            <a href="https://github.com/fiatjaf/nos2x" target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:text-blue-800 text-sm">
              • nos2x
            </a>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Detecting Nostr extension...</p>
        </div>
      )}

      {isAvailable && (
        <div className="space-y-4">
          <button
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="w-full btn-primary py-3"
          >
            {isSigningIn ? 'Signing In...' : 'Sign In with Nostr'}
          </button>
          
          {signinError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{signinError}</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};
```

### 2. **Profile Page Infrastructure**

#### 2.1 New Page Route
```typescript
// New page: src/app/profile/page.tsx
export default function ProfilePage() {
  const { isAuthenticated, npub } = useNostrSigner();
  
  if (!isAuthenticated) {
    return <AuthenticationRequired />;
  }
  
  return (
    <div className="min-h-screen bg-primary-50">
      <ProfileContent npub={npub} />
    </div>
  );
}
```

#### 2.2 Profile Content Component
```typescript
// New component: src/components/auth/ProfileContent.tsx
interface ProfileContentProps {
  npub: string;
}

export const ProfileContent = ({ npub }: ProfileContentProps) => {
  const { profile, isLoading, error } = useUserProfile(npub);
  
  if (isLoading) {
    return (
      <div className="container-width py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-width py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800">Error Loading Profile</h3>
          <p className="text-red-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-width py-8">
      <div className="max-w-4xl mx-auto">
        <ProfileHeader profile={profile} />
        <ProfileDetails profile={profile} />
        <ProfileStats npub={npub} />
      </div>
    </div>
  );
};
```

#### 2.3 Profile Data Management
```typescript
// New hook: src/hooks/useUserProfile.ts
export const useUserProfile = (npub: string) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!npub) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await profileService.getUserProfile(npub);
      if (result.success) {
        setProfile(result.profile);
      } else {
        setError(result.error || 'Failed to load profile');
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [npub]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return { profile, isLoading, error, refreshProfile: loadProfile };
};
```

### 3. **Profile Service (SOA)**

#### 3.1 Profile Business Service
```typescript
// New service: src/services/business/ProfileBusinessService.ts
export interface UserProfile {
  npub: string;
  pubkey: string;
  name?: string;
  display_name?: string;
  about?: string;
  picture?: string;
  banner?: string;
  website?: string;
  bot?: boolean;
  birthday?: {
    year?: number;
    month?: number;
    day?: number;
  };
  // Shop-specific stats
  productsCreated?: number;
  lastActive?: number;
}

export class ProfileBusinessService {
  private static instance: ProfileBusinessService;

  public static getInstance(): ProfileBusinessService {
    if (!ProfileBusinessService.instance) {
      ProfileBusinessService.instance = new ProfileBusinessService();
    }
    return ProfileBusinessService.instance;
  }

  /**
   * Get user profile from Nostr metadata events
   */
  public async getUserProfile(npub: string): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
    try {
      // 1. Get pubkey from npub
      const pubkey = this.npubToPubkey(npub);
      if (!pubkey) {
        return { success: false, error: 'Invalid npub' };
      }

      // 2. Query Kind 0 metadata events
      const metadataResult = await this.queryUserMetadata(pubkey);
      if (!metadataResult.success) {
        return { success: false, error: metadataResult.error };
      }

      // 3. Parse NIP-24 metadata fields
      const profile = this.parseProfileFromMetadata(metadataResult.metadata);

      // 4. Get shop-specific stats
      const shopStats = await this.getShopStats(pubkey);
      
      return {
        success: true,
        profile: {
          ...profile,
          npub,
          pubkey,
          ...shopStats,
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load profile'
      };
    }
  }

  private async queryUserMetadata(pubkey: string): Promise<{ success: boolean; metadata?: any; error?: string }> {
    const filters = [
      {
        kinds: [0], // Metadata events
        authors: [pubkey],
        limit: 1,
      }
    ];

    const result = await queryEvents(filters);
    if (!result.success || result.events.length === 0) {
      return { success: false, error: 'No metadata found' };
    }

    try {
      const metadata = JSON.parse(result.events[0].content);
      return { success: true, metadata };
    } catch (error) {
      return { success: false, error: 'Invalid metadata format' };
    }
  }

  private parseProfileFromMetadata(metadata: any): Partial<UserProfile> {
    return {
      name: metadata.name,
      display_name: metadata.display_name,
      about: metadata.about,
      picture: metadata.picture,
      banner: metadata.banner,
      website: metadata.website,
      bot: metadata.bot,
      birthday: metadata.birthday,
    };
  }

  private async getShopStats(pubkey: string): Promise<{ productsCreated: number; lastActive: number }> {
    // Query user's shop products to get stats
    const result = await shopBusinessService.queryProductsByAuthor(pubkey);
    const products = result.success ? result.products : [];
    
    return {
      productsCreated: products.length,
      lastActive: products.length > 0 ? Math.max(...products.map(p => p.publishedAt)) : 0,
    };
  }

  private npubToPubkey(npub: string): string | null {
    try {
      if (!npub.startsWith('npub1')) {
        return null;
      }
      const { data } = bech32.decode(npub, 1000);
      const pubkey = Buffer.from(bech32.fromWords(data)).toString('hex');
      return pubkey.length === 64 ? pubkey : null; // Validate hex length
    } catch {
      return null;
    }
  }
}

export const profileService = ProfileBusinessService.getInstance();
```

### 4. **Header Integration**

#### 4.1 Authentication Button Component
```typescript
// New component: src/components/auth/AuthButton.tsx
export const AuthButton = () => {
  const { isAuthenticated, isLoading, npub, name } = useNostrSigner();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  if (isLoading) {
    return (
      <button className="btn-outline" disabled>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
        Loading...
      </button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Link href="/signin" className="btn-primary">
        Sign In
      </Link>
    );
  }

  return (
    <div className="relative" onKeyDown={handleKeyDown}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="btn-outline flex items-center gap-2"
        aria-expanded={showDropdown}
        aria-haspopup="menu"
      >
        <span>{name || npub?.substring(0, 16) + '...'}</span>
        <svg className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {showDropdown && (
        <div 
          className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
            Signed in via Nostr
          </div>
          <Link
            href="/profile"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setShowDropdown(false)}
            role="menuitem"
          >
            My Profile
          </Link>
          <Link
            href="/my-shop"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setShowDropdown(false)}
            role="menuitem"
          >
            My Shop
          </Link>
        </div>
      )}
    </div>
  );
};
```

#### 4.2 Header Integration
```typescript
// Update: src/components/Header.tsx
import { AuthButton } from './auth/AuthButton';

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container-width">
        <div className="flex items-center justify-between h-16">
          {/* Logo and navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-2xl font-bold text-primary-800">
              Culture Bridge
            </Link>
            {/* Navigation links */}
          </div>
          
          {/* Authentication button */}
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
```

### 5. **Data Model & Types**

#### 5.1 User Profile Types
```typescript
// Update: src/types/nostr.ts
export interface UserProfile {
  npub: string;
  pubkey: string;
  name?: string;
  display_name?: string;
  about?: string;
  picture?: string;
  banner?: string;
  website?: string;
  bot?: boolean;
  birthday?: {
    year?: number;
    month?: number;
    day?: number;
  };
  // Shop-specific stats
  productsCreated?: number;
  lastActive?: number;
}

export interface ProfileMetadata {
  name?: string;
  display_name?: string;
  about?: string;
  picture?: string;
  banner?: string;
  website?: string;
  bot?: boolean;
  birthday?: {
    year?: number;
    month?: number;
    day?: number;
  };
}
```

### 6. **Implementation Phases**

#### Phase 1: Authentication Infrastructure
1. **Sign-in Page**: Create `/signin` route and SigninForm component
2. **Profile Page**: Create `/profile` route and ProfileContent component
3. **Profile Service**: Implement ProfileBusinessService with NIP-24 parsing
4. **Header Integration**: Add AuthButton to header

#### Phase 2: Profile Data Management
1. **Profile Hook**: Create useUserProfile hook
2. **Metadata Parsing**: Implement NIP-24 metadata field parsing
3. **Shop Stats**: Integrate shop statistics into profile
4. **Error Handling**: Comprehensive error handling and loading states

#### Phase 3: UI/UX Polish
1. **Profile Display**: Create ProfileHeader and ProfileDetails components
2. **Responsive Design**: Mobile-friendly profile layout
3. **Loading States**: Skeleton loading and error states
4. **Accessibility**: WCAG compliant components

### 7. **File Structure**

```
src/
├── app/
│   ├── signin/
│   │   └── page.tsx               # NEW - Sign-in page
│   └── profile/
│       └── page.tsx               # NEW - Profile page
├── components/auth/
│   ├── SigninForm.tsx             # NEW - Sign-in form
│   ├── ProfileContent.tsx         # NEW - Profile content
│   ├── ProfileHeader.tsx          # NEW - Profile header
│   ├── ProfileDetails.tsx         # NEW - Profile details
│   └── AuthButton.tsx             # NEW - Header auth button
├── hooks/
│   └── useUserProfile.ts          # NEW - Profile data hook
├── services/business/
│   └── ProfileBusinessService.ts  # NEW - Profile business logic
└── types/
    └── nostr.ts                   # ENHANCED - User profile types
```

### 8. **Success Criteria**

#### 8.1 Functional Requirements
- ✅ **Sign-in Page**: Users can sign in via NIP-07
- ✅ **Profile Page**: Users can view their profile with NIP-24 fields
- ✅ **Header Integration**: Authentication-aware header button
- ✅ **NIP-24 Compliance**: Display all standard metadata fields
- ✅ **Shop Integration**: Show shop-specific statistics

#### 8.2 User Experience Requirements
- ✅ **Intuitive Flow**: Clear sign-in to profile navigation
- ✅ **Responsive Design**: Mobile-friendly interface
- ✅ **Loading States**: Proper loading and error feedback
- ✅ **Accessibility**: WCAG compliant components

#### 8.3 Technical Requirements
- ✅ **SOA Compliance**: Follows existing service architecture
- ✅ **Nostr Integration**: Uses existing authentication infrastructure
- ✅ **Performance**: Efficient profile data loading
- ✅ **Error Handling**: Comprehensive error management

## Conclusion

The user management system provides a complete authentication and profile experience following Nostr standards and our established SOA patterns. The implementation leverages existing authentication infrastructure while adding dedicated sign-in and profile pages.

**Key Benefits:**
- **NIP-24 Compliance**: Standard metadata field support
- **SOA Integration**: Reuses existing authentication services
- **Clean UX**: Dedicated pages for authentication and profile management
- **Shop Integration**: Profile includes shop-specific statistics

**Estimated Development Time**: 1-2 weeks for full implementation
**Complexity**: Medium (UI/UX work with existing service integration)
**Risk Level**: Low (builds on existing authentication infrastructure)
