# Technical Debt: Sign-In SOA Violation

**Created**: October 8, 2025  
**Priority**: Medium  
**Effort**: Small (2-4 hours)  
**Impact**: Architecture Compliance, Maintainability

---

## Problem Statement

The current sign-in implementation (`/src/app/signin/page.tsx`) violates Culture Bridge's strict 6-layer Service-Oriented Architecture (SOA) pattern by having the Page component directly call Business Services, skipping the Component and Hook layers.

### Current Architecture (VIOLATED)

```
signin/page.tsx (Page)
  ↓ DIRECTLY calls Business Services (VIOLATION - skips 2 layers)
ProfileBusinessService.getUserProfile()
ProfileBusinessService.pubkeyToNpub()
MessagingBusinessService.initializeCache()
```

### Required Architecture (SOA Compliant)

```
Page (signin/page.tsx)
  ↓
Component (SignInFlow.tsx)
  ↓
Hook (useNostrSignIn.ts)
  ↓
Business Service (AuthBusinessService.ts)
  ↓
Event Service (NostrEventService.ts)
  ↓
Generic Service (GenericRelayService.ts)
```

---

## Code Review: Current Violations

### File: `/src/app/signin/page.tsx`

**Violations Identified**:

1. **Direct Business Service Calls** (Lines 40-42):
   ```typescript
   const { profileService } = await import('@/services/business/ProfileBusinessService');
   const npub = profileService.pubkeyToNpub(pubkey);
   ```
   ❌ Page should not import Business Services

2. **Direct Business Service Calls** (Line 53):
   ```typescript
   const fetchedProfile = await profileService.getUserProfile(pubkey);
   ```
   ❌ Page should not call Business Service methods

3. **Direct Business Service Calls** (Lines 93-95):
   ```typescript
   const { messagingBusinessService } = await import('@/services/business/MessagingBusinessService');
   await messagingBusinessService.initializeCache(pubkey);
   ```
   ❌ Page should not import/call Business Services

4. **Business Logic in Page** (Lines 18-132):
   - Authentication orchestration logic
   - Profile fetching logic
   - Error handling logic
   - State management logic
   
   ❌ All business logic should be in Hook layer

5. **Direct Store Access** (Lines 6, 12, 87-88):
   ```typescript
   const { setUser, setAuthenticated } = useAuthStore();
   setUser(userData);
   setAuthenticated(true);
   ```
   ❌ Page should not directly manage auth state (Hook should do this)

---

## Refactoring Plan

### Phase 1: Extract Hook Layer

**Create**: `/src/hooks/useNostrSignIn.ts`

**Purpose**: Orchestrate sign-in logic, call Business Services

**Responsibilities**:
- Call `useNostrSigner()` for signer detection
- Orchestrate authentication flow
- Call ProfileBusinessService.signInWithExtension()
- Manage sign-in state (loading, error)
- Update auth store with user data
- Initialize message cache (via MessagingBusinessService)
- Handle error cases

**Interface**:
```typescript
interface UseNostrSignInReturn {
  signIn: () => Promise<void>;
  isSigningIn: boolean;
  signinError: string | null;
  isAvailable: boolean;
  isLoading: boolean;
}

export function useNostrSignIn(): UseNostrSignInReturn {
  // Implementation calls AuthBusinessService
}
```

**Estimated Time**: 1-2 hours

---

### Phase 2: Extend ProfileBusinessService

**DECISION: Use Existing ProfileBusinessService** ✅

ProfileBusinessService already exists and handles all profile/user operations:
- ✅ `pubkeyToNpub()` - already implemented
- ✅ `getUserProfile()` - already implemented  
- ✅ Profile validation and parsing - already implemented

**Add Single Method**:
```typescript
class ProfileBusinessService {
  // ... existing methods ...
  
  /**
   * Sign in existing user with NIP-07 extension
   * Orchestrates authentication flow using existing methods
   */
  async signInWithExtension(signer: NostrSigner): Promise<{
    success: boolean;
    user?: User;
    error?: string;
  }> {
    // 1. Get pubkey from signer
    // 2. Convert to npub (use existing pubkeyToNpub())
    // 3. Fetch profile (use existing getUserProfile())
    // 4. Format profile with defaults (use existing formatProfileForDisplay())
    // 5. Return User object { pubkey, npub, profile }
  }
}
```

**Why ProfileBusinessService (not AuthBusinessService)**:
- Profile operations are already centralized here
- Avoid creating duplicate services for user/profile concerns
- Sign-in is fundamentally about fetching a user's profile
- Sign-up will also need profile operations (can use same service)
- Follows single responsibility: ProfileBusinessService = all user/profile operations

**Estimated Time**: 30 minutes

---

### Phase 3: Extract Component Layer

**Create**: `/src/components/auth/SignInFlow.tsx`

**Purpose**: UI rendering and hook orchestration

**Responsibilities**:
- Render sign-in UI
- Call `useNostrSignIn()` hook
- Handle user interactions (button clicks)
- Display loading/error states
- Navigation after successful sign-in

**Interface**:
```typescript
interface SignInFlowProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SignInFlow({ onSuccess, onCancel }: SignInFlowProps) {
  const { signIn, isSigningIn, signinError, isAvailable, isLoading } = useNostrSignIn();
  
  // Render UI, no business logic
}
```

**Estimated Time**: 30 minutes

---

### Phase 4: Refactor Page to Render Component

**Update**: `/src/app/signin/page.tsx`

**New Implementation**:
```typescript
'use client';

import { useRouter } from 'next/navigation';
import { SignInFlow } from '@/components/auth/SignInFlow';

export default function SigninPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/');
  };

  const handleCancel = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen hero-section">
      <div className="max-w-md w-full mx-4">
        <SignInFlow 
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
```

**Estimated Time**: 15 minutes

---

## Implementation Checklist

### Pre-Implementation
- [x] ~~Review sign-up flow implementation~~ Decision: Use ProfileBusinessService
- [x] ~~Decide: Extend AuthBusinessService or create SignInBusinessService~~ Decision: Extend ProfileBusinessService
- [x] Review existing ProfileBusinessService capabilities ✅

### Phase 1: Hook Layer
- [ ] Create `/src/hooks/useNostrSignIn.ts`
- [ ] Implement sign-in orchestration logic
- [ ] Add error handling
- [ ] Add TypeScript types
- [ ] Unit test the hook

### Phase 2: Business Service
- [ ] Add `signInWithExtension()` to ProfileBusinessService
- [ ] Method should use existing `pubkeyToNpub()` and `getUserProfile()`
- [ ] Method should use existing `formatProfileForDisplay()` for defaults
- [ ] Return standardized User object { pubkey, npub, profile }
- [ ] Add JSDoc comments
- [ ] Unit test new method

### Phase 3: Component Layer
- [ ] Create `/src/components/auth/SignInFlow.tsx`
- [ ] Move all UI from page to component
- [ ] Call `useNostrSignIn()` hook
- [ ] Handle callbacks (onSuccess, onCancel)
- [ ] Ensure no business logic in component

### Phase 4: Page Layer
- [ ] Refactor `/src/app/signin/page.tsx`
- [ ] Remove all business logic
- [ ] Remove direct service imports
- [ ] Render `<SignInFlow />` component only
- [ ] Handle routing callbacks

### Testing
- [ ] Test sign-in flow works end-to-end
- [ ] Test signer detection
- [ ] Test error cases (no extension, profile fetch fails)
- [ ] Test message cache initialization
- [ ] Verify SOA compliance (no layer violations)
- [ ] Test navigation after sign-in

### Documentation
- [ ] Update sign-in flow documentation (if exists)
- [ ] Document AuthBusinessService methods
- [ ] Add comments to hook
- [ ] Update architecture diagrams

---

## File Structure After Refactoring

```
src/
├── app/
│   └── signin/
│       └── page.tsx                    (Page - renders component only)
├── components/
│   └── auth/
│       └── SignInFlow.tsx              (Component - UI + hook calls)
├── hooks/
│   └── useNostrSignIn.ts               (Hook - orchestration)
└── services/
    └── business/
        └── ProfileBusinessService.ts   (Business - extended with signInWithExtension)
```

---

## Benefits of Refactoring

1. **Architecture Compliance**: Follows strict 6-layer SOA pattern
2. **Testability**: Each layer can be unit tested independently
3. **Reusability**: Hook and component can be reused elsewhere
4. **Maintainability**: Clear separation of concerns
5. **Consistency**: Matches sign-up flow architecture
6. **Type Safety**: Proper TypeScript interfaces at each layer

---

## Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking existing sign-in flow | Thorough testing before deployment |
| AuthBusinessService doesn't exist yet | Create it as part of sign-up implementation first |
| Message cache initialization fails | Maintain non-blocking error handling |
| Profile fetch fails | Keep default profile fallback |
| Multiple signer extensions installed | Use existing useNostrSigner hook logic |

---

## Dependencies

- **Blocks**: None (can be done independently)
- **Blocked By**: None (ProfileBusinessService already exists)
- **Related**: Sign-up flow implementation (will also use ProfileBusinessService for profile operations)

---

## Success Criteria

✅ Sign-in page only renders component (no business logic)  
✅ SignInFlow component only renders UI and calls hook  
✅ useNostrSignIn hook orchestrates authentication  
✅ ProfileBusinessService.signInWithExtension() handles auth logic  
✅ No direct Business Service calls from Page/Component layers  
✅ All existing sign-in functionality works  
✅ Tests pass  
✅ Documentation updated  

---

## Related Documents

- `/docs/sign-up.md` - Sign-up flow specification (SOA compliant)
- `/docs/critical-guidelines.md` - SOA architecture rules
- `/docs/implementation-protocol.md` - Layer responsibilities

---

## Notes

- **ProfileBusinessService is the right choice** - it already handles all user/profile operations
- Sign-up flow will also use ProfileBusinessService for profile creation/publishing
- This refactoring can be done independently (doesn't depend on sign-up implementation)
- The refactored sign-in will be much simpler than sign-up (just authentication, no key generation/backup)
- Consider creating a unified `/docs/authentication.md` document covering both sign-in and sign-up flows after both are implemented
