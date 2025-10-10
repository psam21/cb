# Sign-Up Flow Specification

**Status**: Implementation Ready  
**Architecture**: SOA-Compliant (6-layer pattern)  
**Dependencies**: 
- Sign-in refactoring should be completed first (see `tech-debt-signin-soa-violation.md`)
- ProfileBusinessService (exists - shared with sign-in for profile operations)
- Sign-up creates AuthBusinessService (NEW) for key management orchestration

**Related**: 
- Sign-in uses ProfileBusinessService directly (fetch existing profile)
- Sign-up uses AuthBusinessService → ProfileBusinessService (publish new profile)
- ProfileBusinessService is SHARED by both authentication flows

---

## Implementation Overview

4-step sign-up flow for new Nostr users. Profile data collected first (Step 1), then keys generated and complete Kind 0 published (Step 2), backup/storage (Step 3), confirmation (Step 4).

**Key Points**:
- Name is mandatory
- Avatar and bio are optional
- Avatar held as File object until keys exist (Step 2)
- Only localStorage storage (encrypted)
- No QR codes, no NIP-05
- Complete Kind 0 published in Step 2 (not minimal)

---

## User Flow

```
Step 1: Profile Setup (SHOWN FIRST)
  - Display name (MANDATORY)
  - Avatar (OPTIONAL - held as File)
  - Bio (OPTIONAL)
  ↓
Step 2: Key Generation + Publishing
  - Generate keys using GenericNostrService
  - Store npub in Zustand state
  - **Store nsec in Zustand (in-memory, never persisted)**
  - Create temporary NostrSigner from nsec
  - Display generated nsec/npub
  ↓
Step 3: Backup + Storage
  - Download encrypted backup file
  - Automatic localStorage (encrypted)
  ↓
Step 4: Final Confirmation
  - Security acknowledgment
  - Redirect to home/profile
```

---

## Architecture & Files

### Service-Oriented Architecture (SOA) Compliance

The sign-up flow follows Culture Bridge's strict 6-layer SOA pattern:

```
Page (signup/page.tsx)
  ↓
Component (SignUpFlow.tsx)
  ↓
Hook (useNostrSignUp.ts)
  ↓
Business Service (AuthBusinessService.ts) [NEW]
  ↓
ProfileBusinessService (SHARED with sign-in) [EXISTING]
  ↓
Generic Services (GenericEventService, GenericRelayService, GenericBlossomService)
```

### Files to Create

#### 1. **Page Route**
- **Path**: `/src/app/signup/page.tsx`
- **Purpose**: Next.js route for the sign-up page
- **Responsibilities**:
  - Metadata (title, description)
  - Layout wrapper
  - Renders `SignUpFlow` component
  - NO business logic

#### 2. **Primary Component**
- **Path**: `/src/components/auth/SignUpFlow.tsx`
- **Purpose**: Multi-step sign-up wizard UI
- **Responsibilities**:
  - Step navigation: **Step 1 (Profile) → Step 2 (Keys) → Step 3 (Backup) → Step 4 (Confirm)**
  - Form validation (client-side only)
  - Calls `useNostrSignUp` hook
  - Displays security warnings at each step
  - Progress indicator (1/4, 2/4, 3/4, 4/4)
  - NO direct service calls
  - NO business logic

#### 3. **Sub-Components**

**Step 1: Profile Setup**
- **Path**: `/src/components/auth/ProfileSetupStep.tsx`
  - Display name input (MANDATORY, max 100 chars)
  - Bio textarea (OPTIONAL, max 1000 chars)
  - Avatar upload (OPTIONAL, Blossom integration)
  - Image cropping preview (1:1 aspect ratio)
  - Reuses existing `ImageUpload` + `ImageCropper` from `/src/components/profile/`
  - Avatar held as File until Step 2 (when keys are generated and signer created)
  - "Next" button validates display name before proceeding

**Step 2: Key Generation**
- **Path**: `/src/components/auth/KeyGenerationStep.tsx`
  - "Generate Keys" button (calls `AuthBusinessService.generateNostrKeys()`)
  - Display generated nsec/npub (with visibility toggle)
  - Copy-to-clipboard buttons for both keys
  - Security warning callout: "NEVER share your nsec"
  - Upload avatar (if provided in Step 1) using temporary signer
  - Publish Kind 0 event (profile + avatar URL) to relays
  - Publish Kind 1 event (welcome note) silently to verify signer works for text notes
  - "Next" button enabled after successful publishes

**Step 3: Backup Keys**
- **Path**: `/src/components/auth/KeyBackupStep.tsx`
  - Download backup button (plain text file: `{name}_culturebridge.txt`)
  - Backup confirmation checkbox: "I have securely saved my backup file"
  - Security warnings: "Without this backup, you will lose access to your account"
  - Option to import to browser extension immediately
  - "Next" button enabled only after backup confirmation

**Step 4: Final Confirmation**
- **Path**: `/src/components/auth/FinalConfirmationStep.tsx`
  - Summary display: name, npub, profile published confirmation
  - Security warnings review
  - "I understand and accept responsibility" checkbox
  - "Complete Sign-Up" button
  - On completion: Clear nsec from Zustand, redirect to sign-in page
  - Instructions: "Sign in with your browser extension"

#### 4. **State Management Hook**

- **Path**: `/src/hooks/useNostrSignUp.ts`
- **Purpose**: Orchestrate sign-up workflow and state management
- **Responsibilities**:
  - Track current step: 1 (Profile) → 2 (Keys) → 3 (Backup) → 4 (Confirm)
  - Store form data: `displayName` (required), `bio` (optional), `avatarFile` (optional)
  - Store generated keys: `npub`, `nsec` (via `useAuthStore.setNsec()`)
  - Call `AuthBusinessService` methods:
    - `generateNostrKeys()` - Step 2
    - `uploadAvatar(file, signer)` - Step 2 (if avatar provided)
    - `publishProfile(profile, signer)` - Step 2 (after avatar upload)
    - `publishWelcomeNote(signer)` - Step 2 (after profile publish, silent)
    - `createBackupFile(displayName, npub, nsec)` - Step 3
  - Handle errors and loading states for each step
  - Clear nsec from auth store on completion (Step 4)
  - Navigation: `nextStep()`, `previousStep()`, `goToStep(n)`

#### 5. **Business Service** [NEW]

- **Path**: `/src/services/business/AuthBusinessService.ts`
- **Purpose**: Authentication and key management orchestration (SOA-compliant)
- **Responsibilities**:
  - `generateNostrKeys()`: Returns `{ nsec, npub, pubkey }`
    - Delegates to `utils/keyManagement.ts` (wraps nostr-tools)
    - Stores nsec in Zustand via `useAuthStore.setNsec(nsec)`
    - Returns keys to hook for UI display
  
  - `uploadAvatar(file, signer)`: Returns blossom URL
    - Delegates to `GenericBlossomService.uploadFile(file, signer)`
    - Returns `https://cdn.satellite.earth/<hash>`
  
  - `publishProfile(profile, signer)`: Publishes Kind 0 event
    - Delegates to `ProfileBusinessService.publishProfile(profile, signer)`
    - SHARED method (same as sign-in profile updates)
    - Publishes to multiple relays on the network
  
  - `publishWelcomeNote(signer)`: Publishes Kind 1 event (silent verification)
    - Creates Kind 1 text note with welcome message
    - Verifies temporary signer works for both Kind 0 and Kind 1 events
    - Published silently (no UI notification)
    - Content: "🌍✨ Kicking off something truly beautiful — preserving our Culture and Heritage on Nostr for generations to come! 👶🌱 🚀📚 With Culture Bridge, I'm setting out to protect and share our community's timeless stories 📜🏛️ 🌈📖 Can't wait to celebrate the wisdom, traditions, and heritage that unite us all 🤝💫"
    - Tags: `#community #storytelling #traditions #culture #heritage #humanity #inclusivity #art #music #history #Culture-Bridge #CultureBridge #nostr`
  
  - `createBackupFile(displayName, npub, nsec)`: Triggers download
    - Delegates to `utils/keyExport.ts`
    - Generates `{displayName}_culturebridge.txt`
    - Plain text format with warnings
  
- **Creates temporary NostrSigner**:
  - Uses nsec from `useAuthStore.getState().nsec`
  - Implements NostrSigner interface for signing events
  - Used for avatar upload and profile publishing

- **DOES NOT**: Implement key generation, event creation, or encryption
- **ONLY**: Orchestrates calls to existing services and utilities

#### 6. **Utility Functions** [NEW]

- **Path**: `/src/utils/keyManagement.ts`
- **Purpose**: Client-side key cryptography (wraps nostr-tools)
- **Responsibilities**:
  - `generateKeys()`: Returns `{ nsec, npub, pubkey }`
    - Uses `nostr-tools` generateSecretKey() and getPublicKey()
    - Uses nip19.nsecEncode() and nip19.npubEncode()
    - Validates key lengths (nsec: 63 chars, npub: 63 chars)
  - `decodeNsec(nsec)`: Converts nsec to hex secret key
  - `decodeNpub(npub)`: Converts npub to hex pubkey
  - **NO business logic** - pure utility functions
  - **NO storage** - only generation and encoding/decoding

- **Path**: `/src/utils/keyExport.ts`
- **Purpose**: Backup file generation
- **Responsibilities**:
  - `createBackupFile(displayName, npub, nsec)`: Triggers download
    - Formats plain text with warnings
    - Filename: `{displayName}_culturebridge.txt`
    - Content: Warning message, npub, nsec, Culture Bridge URL
    - Creates download via `<a>` tag with `download` attribute
  - **NO encryption** - plain text only
  - **NO storage** - only download trigger

### Files to Modify

#### 1. **Header Component**
- **Path**: `/src/components/Header.tsx`
- **Changes**: Add "Sign Up" button next to "Sign In" (when user is NOT authenticated)
- **Conditional Rendering**: Show only if `!isAuthenticated` from auth store

#### 2. **Sign-In Page**

- **Path**: `/src/app/signin/page.tsx`
- **Changes**: Add "Sign Up" link/button to redirect to `/signup`
- **Note**: Sign-in page already refactored to SOA-compliant architecture

#### 3. **Auth Store** [MODIFIED]
- **Path**: `/src/stores/useAuthStore.ts`
- **Changes**: 
  - ✅ ALREADY ADDED: `nsec: string | null` field (in-memory only)
  - ✅ ALREADY ADDED: `setNsec(nsec)` action
  - ✅ ALREADY CONFIGURED: nsec excluded from persist (never saved to localStorage)
  - ✅ ALREADY CONFIGURED: nsec cleared on logout and reset
- **No additional changes needed** - auth store is ready for sign-up flow
  - Persist `isNewUser` temporarily (clear after first session)

---

## Technical Implementation Details

### 1. Key Generation Flow

**Using `nostr-tools` Library** (already in `package.json` v2.17.0)

```
Step 1: Generate Private Key
- Function: generateSecretKey() from nostr-tools
- Output: Uint8Array (32 bytes of cryptographically secure randomness)
- Conversion: Buffer.from(secretKey).toString('hex')

Step 2: Derive Public Key
- Function: getPublicKey(secretKey) from nostr-tools
- Input: Secret key (hex string or Uint8Array)
- Output: Public key (64-character hex string)

Step 3: Encode Keys (NIP-19)
- Private Key: nip19.nsecEncode(secretKey) → "nsec1..."
- Public Key: nip19.npubEncode(publicKey) → "npub1..."

Step 4: Validation
- Verify nsec decodes back to original secret key
- Verify npub decodes to public key
- Check key lengths (nsec: 63 chars, npub: 63 chars)
```

**Security Considerations**:

- Keys generated in browser memory (never sent to server)
- Use `crypto.getRandomValues()` for entropy (via nostr-tools)
- Clear keys from memory after storage/export
- No key derivation from weak passwords (full randomness)

### 2. Key Storage

**Storage Method**: Browser localStorage via Zustand persist middleware

**What Gets Stored (persisted to localStorage)**:
- User profile data (pubkey, npub, profile) - same as sign-in
- `isAuthenticated` flag

**What Gets Stored (in-memory only, NOT persisted)**:
- `nsec` - held in Zustand state during sign-up flow
- Used for creating temporary signer for avatar upload and profile publishing
- Cleared on page refresh or logout
- Never displayed in UI

**Implementation**:
- Use same Zustand persist middleware as sign-in (existing pattern)
- Store only non-sensitive user data in localStorage
- Store nsec in AuthState (excluded from partialize function)
- After successful sign-up, user MUST either:
  1. Download backup file (contains nsec) for manual storage, OR
  2. Import nsec into browser extension immediately
- If user loses backup file AND clears browser data, they lose access permanently

**Security**:
- No encryption needed (nsec never stored in browser)
- Same storage pattern as existing sign-in flow
- User responsible for securing backup file

### 3. Profile Creation (Kind 0 Event)

**Metadata Structure** (Nostr Kind 0):

```json
{
  "kind": 0,
  "pubkey": "<user's npub in hex>",
  "created_at": 1234567890,
  "tags": [],
  "content": JSON.stringify({
    "name": "Display Name",
    "display_name": "Display Name",
    "about": "User bio (optional)",
    "picture": "https://blossom.example.com/<hash>",
    "banner": "",
    "lud16": "",
    "website": ""
  })
}
```

**Publishing Flow**:

```
Step 2: KeyGenerationStep
  ↓
  [User clicks "Generate Keys"]
  ↓
useNostrSignUp.generateKeys()
  ↓
AuthBusinessService.generateNostrKeys()
  ↓
AuthBusinessService.publishProfile(profile) ⚡ BACKGROUND
  ↓
ProfileBusinessService.publishProfile(profile, temporarySigner)
  ↓
ProfileBusinessService.createProfileEvent() [creates Kind 0 event]
  ↓
GenericEventService.signEvent() [signs with temporarySigner]
  ↓
GenericRelayService.publishEvent() [publishes to relays]
  ↓
AuthBusinessService.publishWelcomeNote(temporarySigner) ⚡ BACKGROUND (SILENT)
  ↓
Creates Kind 1 text note with welcome message + hashtags
  ↓
GenericEventService.signEvent() [signs with temporarySigner]
  ↓
GenericRelayService.publishEvent() [publishes to relays]

Note: 
- temporarySigner is created from nsec stored in Zustand
- Implements NostrSigner interface
- ProfileBusinessService.publishProfile() is SHARED with sign-in
- No NostrEventService needed (ProfileBusinessService handles Kind 0 directly)
- Welcome note (Kind 1) verifies signer works for text notes, not shown to user
```

**Avatar Upload**:
- Reuse existing `ImageUpload` + `ImageCropper` components from `/src/components/profile/`
- 1:1 aspect ratio for profile picture
- Upload to Blossom via `GenericBlossomService.uploadFile()`
- Requires temporary signer created from nsec stored in Zustand
- AuthBusinessService orchestrates: generate keys → store nsec in Zustand → create signer → upload avatar → publish profile

### 4. Key Backup Mechanisms

#### Plain Text Backup File

**Format**: Simple text file with clear warning

```text
CULTURE BRIDGE - NOSTR IDENTITY BACKUP
=======================================

⚠️ WARNING: NEVER SHARE THIS FILE WITH ANYONE! ⚠️

This file contains your Nostr identity - think of it like your ID and password combined.
If someone gets access to this file, they can impersonate you on the Nostr network.

Keep this file safe and private!

---

Your Public Key (npub):
npub1...

Your Private Key (nsec):
nsec1...

Culture Bridge URL:
https://culturebridge.vercel.app

---

IMPORTANT SECURITY NOTES:
- Your nsec is like a password that can NEVER be changed
- Anyone with your nsec can post as you on ALL Nostr apps
- Store this file in a secure location (encrypted drive, password manager, etc.)
- Never send this file via email, chat, or upload it anywhere
- If you lose this file AND your browser data, you lose your identity permanently

For support (DO NOT share your keys):
Visit: https://culturebridge.vercel.app/support
```

**File Download**:
- Trigger via `<a>` tag with `download` attribute
- Filename: `{display_name}_culturebridge.txt`
- MIME type: `text/plain`
- No encryption (user responsible for secure storage)

---

## Security Architecture

### Threat Model

| Threat | Mitigation |
|--------|------------|
| **XSS Attack** | Never store plaintext nsec in localStorage; use encryption + HttpOnly cookies (not applicable for client-side apps) |
| **Key Logging** | Warn users about keyloggers; recommend browser extensions for key isolation |
| **Phishing** | Educate users that NO legitimate Nostr app asks for nsec via form submission |
| **Lost Keys** | Mandatory backup confirmation; display multiple warnings; no recovery mechanism |
| **Browser Extension Compromise** | Out of scope (user responsibility to vet extensions) |
| **Network Interception** | Keys never transmitted over network; all operations client-side |

### Security Best Practices

1. **Key Generation**
   - Use cryptographically secure random number generation (`crypto.getRandomValues()`)
   - Never derive keys from user passwords (full entropy required)
   - Validate key format after generation (decode/encode round-trip)

2. **Key Display**
   - Blur nsec by default (click to reveal)
   - Copy-to-clipboard with automatic clear after 30 seconds
   - Warn user to clear clipboard manually
   - Never log keys to console (even in development)

3. **Key Backup**
   - Backup file contains plain text nsec (user responsible for security)
   - Clear warnings in backup file about never sharing nsec
   - User must download and secure backup file themselves
   - No cloud storage or transmission of backup file

4. **User Education**
   - Display warning: "Your private key IS your account. There is no password reset."
   - Explain: "This key works across ALL Nostr apps (Damus, Snort, Primal, etc.)"
   - Recommend: "Install a browser extension (Alby, nos2x) for secure key management"
   - Emphasize: "Back up your key NOW. We cannot recover it for you."

---

## User Experience (UX) Guidelines

### Step-by-Step Wizard

**Progress Indicator**: 4 steps total

1. Profile Setup (Name MANDATORY, Avatar/Bio OPTIONAL - shown first)
2. Key Generation (Display nsec/npub + Upload avatar + Publish complete Kind 0)
3. Backup + Local Storage (Download encrypted file + Automatic localStorage)
4. Final Confirmation (Security acknowledgment)

**Navigation**:

- "Back" button available on steps 2-5 (returns to previous step)
- "Next" button enabled only when step requirements met:
  - Step 3: Backup confirmed via checkbox
  - Step 4: Display name entered (minimum requirement)
- "Cancel" button available on all steps (returns to `/signin` with confirmation dialog)

**Visual Design**:

- Large, clear security warnings (red background, white text)
- Green checkmarks for completed steps
- Copy-to-clipboard icons next to nsec/npub
- Download buttons with file icons
- Background publishing indicator in Step 2 (spinner or "Publishing your profile...")
- Required field indicators (asterisk) for display name in Step 1

**Key Flow Changes**:

- **Step 1**: Profile form (name mandatory, avatar/bio optional) - shown first before key generation
- **Step 2**: Keys are generated, avatar uploaded (if provided), complete Kind 0 profile published (not minimal)
- **Step 3**: Backup + automatic localStorage storage (no choice of storage method)
- **Step 4**: Final confirmation before redirect to home or profile

### Error Handling

| Error Scenario | User Message | Recovery Action |
|----------------|--------------|-----------------|
| Key generation fails | "Failed to generate keys. Please refresh and try again." | Retry button |
| Background profile publish fails (Step 2) | "Profile publishing in progress... May take a few moments." | Non-blocking - allow user to continue, retry in background |
| Backup not confirmed (Step 3) | "You must back up your keys before continuing." | Disable "Next" until checkbox checked |
| Display name missing (Step 1) | "Display name is required to continue." | Disable "Next" until name entered |
| Avatar upload fails (Step 4) | "Avatar upload failed. You can add it later in your profile." | Allow continue without avatar |
| Profile update fails (Step 4) | "Profile update failed. Your basic profile is still published." | Show error but allow continue |
| Relay publishing fails | "Profile published to {X} of {Y} relays. Some relays are unavailable." | Show partial success, allow continue |

### Accessibility (A11y)

- **Keyboard Navigation**: Full keyboard support (Tab, Enter, Escape)
- **Screen Readers**: ARIA labels for all interactive elements
- **Focus Management**: Auto-focus on "Next" button when step completes
- **Skip Links**: "Skip to profile setup" for users who don't need backup explanations
- **High Contrast**: Security warnings visible in high contrast mode
- **Large Text**: Key display uses monospace font, minimum 14px

---

## Integration Points

### Existing Components to Reuse

1. **Profile Image Upload**
   - Component: `/src/components/profile/ImageUpload.tsx`
   - Purpose: Avatar selection during profile setup
   - Modifications: None required (already compatible)

2. **Image Cropper**
   - Component: `/src/components/profile/ImageCropper.tsx`
   - Purpose: 1:1 aspect ratio cropping for avatar
   - Modifications: None required

3. **Auth Button**
   - Component: `/src/components/auth/AuthButton.tsx`
   - Purpose: Display sign-up link when not authenticated
   - Modifications: Add conditional sign-up button

4. **Loading Spinner**
   - Component: `/src/components/generic/LoadingSpinner.tsx`
   - Purpose: Display during key generation, profile publishing
   - Modifications: None required

### Existing Services to Leverage

1. **ProfileBusinessService** (SHARED with sign-in)
   - Methods: `validateProfile()`, `createProfileEvent()`, `publishProfile()`
   - Purpose: Create and publish Kind 0 metadata event
   - Modifications: None required (already compatible)
   - Usage: AuthBusinessService delegates profile publishing to ProfileBusinessService

2. **GenericBlossomService**
   - Method: `uploadFile()`
   - Purpose: Upload avatar to Blossom CDN during sign-up
   - Modifications: None required (already accepts NostrSigner)
   - Usage: AuthBusinessService creates temporary signer from generated nsec, passes to uploadFile()
   - Note: Temporary signer implements NostrSigner interface using generated keys

3. **Auth Store**
   - Methods: `setUser()`, `setAuthenticated()`
   - Purpose: Store pubkey and profile after sign-up
   - Modifications: Add `setNewUser(true)` flag
   - Usage: Called by useNostrSignUp hook after successful sign-up

---

## Post-Sign-Up Flow

### Immediate Next Steps

1. **Welcome Modal**
   - Display: "Welcome to Culture Bridge, {display_name}!"
   - Explain: "Your Nostr identity is now active across the multiple relays on the network."
   - Show: Quick tutorial (Explore, Shop, Heritage, Messages)
   - CTA: "Start exploring"

2. **First Session Recommendations**
   - Redirect to `/explore` to see public content
   - Show tooltip on "Profile" menu item: "Complete your profile"
   - Show tooltip on "Messages": "Connect with other users"
   - Show tooltip on "Contribute": "Share your heritage"

### Browser Extension Migration

**If user chose localStorage but later installs extension**:

1. Detect extension installation (check `window.nostr` on page load)
2. Show migration prompt: "We detected a Nostr extension. Move your keys for better security?"
3. If accepted:
   - Guide user to export nsec from localStorage
   - Import nsec into extension
   - Clear nsec from localStorage
   - Update auth flow to use extension
4. If declined:
   - Show "Don't ask again" option
   - Continue using localStorage

---

## Testing Strategy

### Manual Testing Checklist

- [ ] **Key Generation**
  - [ ] Generated nsec decodes correctly
  - [ ] Generated npub matches public key
  - [ ] Keys are cryptographically valid (sign test event)
  - [ ] Multiple generations produce unique keys

- [ ] **Backup Mechanisms**
  - [ ] Encrypted file downloads successfully
  - [ ] File can be decrypted with passphrase

- [ ] **Profile Creation**
  - [ ] Kind 0 event publishes to relays
  - [ ] Profile appears in user's profile page
  - [ ] Avatar uploads to Blossom
  - [ ] Profile visible to other Nostr clients

- [ ] **Key Storage**
  - [ ] localStorage encryption/decryption works
  - [ ] Extension import succeeds
  - [ ] Manual backup allows login

- [ ] **Edge Cases**
  - [ ] Network offline during publishing (graceful failure)
  - [ ] User refreshes mid-sign-up (state persists)
  - [ ] User navigates away (confirmation dialog)
  - [ ] All relays fail (error message, retry option)

### Security Testing

- [ ] nsec never appears in network requests
- [ ] nsec never appears in browser console
- [ ] localStorage encryption uses strong algorithm (AES-256-GCM)
- [ ] PBKDF2 iterations ≥ 100,000
- [ ] Keys cleared from memory after use
- [ ] No keys in browser history or autocomplete

---

## Dependencies

### NPM Packages (Already Installed)

- `nostr-tools` (2.17.0): Key generation, event signing, NIP-19 encoding
- `blossom-client-sdk` (4.1.0): Avatar upload to Blossom CDN
- `zustand` (5.0.8): Auth state management

### New NPM Packages Required

None - all required dependencies already in project.

---

## Implementation Checklist

### Core Sign-Up Flow

**Scope**: Complete 4-step sign-up with profile-first approach

- [ ] Create page route (`/src/app/signup/page.tsx`)
- [ ] Create `SignUpFlow` component with step navigation (4 steps)
- [ ] Create `ProfileSetupStep` component (Step 1, shown first)
- [ ] Create `KeyGenerationStep` component
- [ ] Create `useNostrSignUp` hook
- [ ] Create `AuthBusinessService` with:
  - Delegates to `utils/keyManagement.ts` for key generation
  - Delegates to `ProfileBusinessService.publishProfile()` for profile publishing
  - Delegates to `GenericBlossomService.uploadFile()` for avatar uploads
  - Creates temporary NostrSigner from generated nsec
  - `signUpWithProfile()` method (orchestrates: keys → avatar → profile)
- [ ] Implement background profile publishing after key generation
- [ ] Add success notification after keys generated + profile published

### Backup + Local Storage

**Scope**: Backup and localStorage storage

- [ ] Create `KeyBackupStorageStep` component
- [ ] Implement encrypted file download
- [ ] Add backup confirmation checkbox (mandatory)
- [ ] Implement localStorage storage (encrypted, automatic)
- [ ] Security warnings about localStorage limitations
- [ ] Best practices display

### Profile Form (Step 1)

**Scope**: Profile form as first step, avatar held until Step 2

- [ ] Create `ProfileSetupStep` component shown first
- [ ] Display name input (MANDATORY, validation required)
- [ ] Integrate `ImageUpload` + `ImageCropper` (OPTIONAL)
- [ ] Add bio textarea (OPTIONAL)
- [ ] Hold avatar as File object in browser memory (no upload yet)
- [ ] In Step 2: Upload avatar to Blossom after keys generated
- [ ] In Step 2: Publish complete Kind 0 event with all fields
- [ ] Form validation (name required, avatar/bio optional)

### Final Confirmation

**Scope**: Security acknowledgment and completion

- [ ] Create `FinalConfirmationStep` component
- [ ] Display configuration summary
- [ ] Security warnings review
- [ ] "I understand and accept responsibility" checkbox
- [ ] Redirect to /profile after confirmation
- [ ] Update auth store with user data

### Polish & Testing

**Scope**: UX improvements and comprehensive testing

- [ ] Add welcome modal post-sign-up
- [ ] Implement onboarding checklist
- [ ] Add keyboard navigation
- [ ] Screen reader testing
- [ ] Security audit
- [ ] Analytics tracking for each step

---

## Success Metrics

**Definition**: Feature is successful when user confirms it works.

- ✅ User can complete sign-up flow (all 4 steps)
- ✅ Keys are generated successfully
- ✅ Profile is published to relays (user confirms event ID exists)
- ✅ User can sign in after sign-up
- ✅ No errors in browser console
- ✅ User says "it's working"

**Anything else is irrelevant until the feature works.**

---

## References

- **NIP-01**: Basic Protocol - https://github.com/nostr-protocol/nips/blob/master/01.md
- **NIP-07**: Browser Extension Signer - https://github.com/nostr-protocol/nips/blob/master/07.md
- **NIP-19**: bech32-encoded entities (nsec, npub) - https://github.com/nostr-protocol/nips/blob/master/19.md
- **nostr-tools Documentation**: https://github.com/nbd-wtf/nostr-tools
- **Blossom Protocol**: https://github.com/hzrd149/blossom

---

## Notes for Developers

### Critical SOA Compliance

✅ **CORRECT Flow**:
```
Page → Component → Hook → Business Service → Event Service → Generic Service
```

❌ **FORBIDDEN**:
- Components calling services directly
- Hooks creating Nostr events
- Pages with business logic
- Key generation outside AuthBusinessService

### Security Reminders

⚠️ **NEVER**:
- Log private keys (even in development)
- Store plaintext nsec in localStorage or browser storage
- Transmit nsec over network
- Expose nsec in error messages
- Keep nsec in memory longer than necessary

✅ **ALWAYS**:
- Generate backup file with clear warnings
- Clear sensitive data from memory after use
- Validate keys after generation
- Warn users about key loss
- Use secure random generation

### Code Review Checklist

Before merging sign-up implementation:
- [ ] No nsec in console.log statements
- [ ] No nsec stored in localStorage (only user profile data)
- [ ] Backup file has security warnings
- [ ] User must download backup file before completing sign-up
- [ ] SOA layers respected
- [ ] TypeScript types complete
- [ ] Error handling comprehensive
- [ ] Accessibility tested
- [ ] Mobile responsive

---

**Document Status**: Complete specification ready for implementation  
**Implementation**: Single complete build - no phases or MVPs
