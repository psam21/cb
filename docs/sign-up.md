# Sign-Up Flow Documentation

**Document Version**: 2.0  
**Last Updated**: October 8, 2025  
**Status**: Specification - Implementation Pending

- **Path**: `/src/components/auth/KeyBackupStorageStep.tsx` (COMBINED)
  - Download encrypted backup button
  - QR code generation (nsec + npub)
  - Backup confirmation checkbox
  - "I understand I'll lose my account if I lose my keys" acknowledgment
  - localStorage storage (encrypted, automatic)
  - Confirmation checkbox for understanding storage method
  - Security warnings and best practices

- **Path**: `/src/components/auth/ProfileSetupStep.tsx` (FORM WITH MANDATORY/OPTIONAL FIELDS)
  - Display name input (MANDATORY, max 100 chars)
  - Avatar upload (OPTIONAL - Blossom integration)
  - Bio textarea (OPTIONAL, max 1000 chars)
  - NIP-05 identifier (OPTIONAL)
  - All fields displayed in single form
  - Image cropping preview (1:1 aspect ratio) for avatar
  - UPDATES existing Kind 0 event from Step 2
  - Cannot proceed without display name
The Culture Bridge sign-up flow enables first-time users to create a Nostr identity and immediately join the decentralized network. This is a **100% self-sovereign authentication system** with no centralized account creation, email verification, or password management.

### UX Optimization (v2.0)

**Key Change**: This version auto-publishes a minimal Kind 0 profile immediately after key generation to ensure **every user has a profile**, even if they skip optional enrichment steps.

**Rationale**:

- **Problem**: Previous flow assumed users would manually create profiles in Step 4, risking skipped profiles
- **Solution**: Auto-publish basic Kind 0 in Step 2 (background), then allow optional enrichment in Step 4
- **Benefits**:
  - Guarantees all users have discoverable profiles
  - Reduces friction by combining backup + storage into single step
  - Makes profile enrichment explicitly optional (better UX clarity)
  - Faster onboarding with fewer mandatory steps

### Core Principles

1. **Self-Sovereign Identity**: Users generate and control their own Nostr keys (private/public key pairs)
2. **Zero Server-Side Storage**: The application NEVER stores, transmits, or has access to private keys
3. **Interoperability**: Keys work across ALL Nostr applications (Damus, Snort, Primal, etc.)
4. **Client-Side Key Management**: All cryptographic operations happen in the browser
5. **No Recovery Mechanism**: Lost keys = lost identity (user responsibility)

### Distinction from Sign-In

- **Sign-In** (`/signin`): For users with existing Nostr keys (NIP-07 browser extensions like Alby, nos2x)
- **Sign-Up** (`/signup`): For new users without keys (generates fresh key pair)

---

## User Flow Overview

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User lands on /signup                                    │
│    "Create Your Nostr Identity"                             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ├─ Option A: "Generate New Keys"
                 │  └─> Key Generation Flow
                 │
                 └─ Option B: "I already have Nostr keys"
                    └─> Import Flow (redirects to /signin)
                    
┌─────────────────────────────────────────────────────────────┐
│ 2. Key Generation (Client-Side Only)                        │
│    - Generate private key (nsec1...)                        │
│    - Derive public key (npub1...)                           │
│    - Display keys to user with security warning             │
│    ⚡ AUTO-PUBLISH: Basic Kind 0 profile in background      │
│       (ensures every user has a profile, even if minimal)   │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│ 3. Backup + Local Storage Confirmation                      │
│    A) Backup Keys (MANDATORY)                               │
│       - Download keys as encrypted text file                │
│       - Display QR codes for mobile backup                  │
│       - User confirms backup via checkbox                   │
│                                                              │
│    B) Local Storage (AUTOMATIC)                             │
│       - Keys stored in browser localStorage (encrypted)     │
│       - User confirms understanding of storage method       │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│ 4. Profile Enrichment Form                                  │
│    - Display name (MANDATORY)                               │
│    - Avatar image (OPTIONAL)                                │
│    - Bio/About (OPTIONAL)                                   │
│    - NIP-05 identifier (OPTIONAL)                           │
│    - UPDATES existing Kind 0 event from Step 2              │
│    - All fields shown in single form                        │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│ 5. Final Confirmation                                       │
│    - Review key security warnings                           │
│    - "I understand and accept responsibility" checkbox      │
│    - Redirect to /profile after confirmation                │
└─────────────────────────────────────────────────────────────┘
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
Nostr Event Service (NostrEventService.ts) [EXISTING]
  ↓
Generic Services (GenericEventService, GenericRelayService, EncryptionService)
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
  - Step navigation (Key Generation → Backup → Profile → Storage)
  - Form validation (client-side only)
  - Calls `useNostrSignUp` hook
  - Displays security warnings
  - Progress indicator
  - NO direct service calls

#### 3. **Sub-Components**
- **Path**: `/src/components/auth/KeyGenerationStep.tsx`
  - Generate keys button
  - Display generated nsec/npub
  - Security warning callout
  - Copy-to-clipboard functionality
  - ⚡ Triggers background Kind 0 publish after generation

- **Path**: `/src/components/auth/KeyBackupStorageStep.tsx` (COMBINED)
  - Download encrypted backup button
  - QR code generation (nsec + npub)
  - Backup confirmation checkbox
  - "I understand I'll lose my account if I lose my keys" acknowledgment
  - Storage option selector (localStorage vs extension vs manual)
  - Browser extension detection (check for `window.nostr`)
  - Security comparison table
  - Recommendations based on detected capabilities

- **Path**: `/src/components/auth/ProfileSetupStep.tsx` (NOW OPTIONAL)
  - Display name input (max 100 chars)
  - Avatar upload (Blossom integration)
  - Bio textarea (max 1000 chars)
  - "Skip for now" button (prominent)
  - Image cropping preview (1:1 aspect ratio)
  - UPDATES existing Kind 0 event from Step 2

- **Path**: `/src/components/auth/FinalConfirmationStep.tsx` (NEW)
  - Security warnings review
  - "I understand and accept responsibility" checkbox
  - Configuration summary display
  - Redirect to /profile on confirmation

#### 4. **State Management Hook**

- **Path**: `/src/hooks/useNostrSignUp.ts`
- **Purpose**: Orchestrate sign-up workflow, state management
- **Responsibilities**:
  - Track current step (1-5)
  - Store form data (display name, bio, avatar)
  - Store generated keys (TEMPORARILY, until backup confirmed)
  - Call `AuthBusinessService` methods
  - Trigger background Kind 0 publish after key generation
  - Handle errors and loading states
  - Clear sensitive data after completion

#### 5. **Business Service** [NEW]

- **Path**: `/src/services/business/AuthBusinessService.ts`
- **Purpose**: Authentication and identity management orchestration
- **Responsibilities**:
  - `generateNostrKeys()`: Create nsec/npub pair
  - `publishBasicProfile(pubkey: string)`: Auto-publish minimal Kind 0 after key generation
  - `updateProfile(data)`: Update existing Kind 0 with enriched profile data
  - `validateNIP05(identifier)`: Verify NIP-05 identifiers
  - `encryptPrivateKey(nsec, passphrase)`: Encrypt keys for storage
  - Delegates to `GenericEventService.createEvent()` for Kind 0 creation
  - Delegates to `GenericBlossomService.upload()` for avatar uploads

#### 6. **Utility Functions** [NEW]

- **Path**: `/src/utils/keyManagement.ts`
- **Purpose**: Client-side key cryptography utilities
- **Responsibilities**:
  - Wrapper around `nostr-tools` key generation
  - nsec/npub encoding/decoding (nip19)
  - Key format validation
  - Secure random generation
  - No business logic (pure utility functions)

- **Path**: `/src/utils/keyExport.ts`
- **Purpose**: Key backup and export utilities
- **Responsibilities**:
  - Generate encrypted text files (AES-256-GCM)
  - Create QR codes (using `qrcode` library)
  - Format backup files (JSON structure with metadata)
  - Download trigger functions

### Files to Modify

#### 1. **Header Component**
- **Path**: `/src/components/Header.tsx`
- **Changes**: Add "Sign Up" button next to "Sign In" (when user is NOT authenticated)
- **Conditional Rendering**: Show only if `!isAuthenticated` from auth store

#### 2. **Sign-In Page** (optional enhancement)
- **Path**: `/src/app/signin/page.tsx`
- **Changes**: Add "Don't have keys? Sign Up" link to redirect to `/signup`

#### 3. **Auth Store**
- **Path**: `/src/stores/useAuthStore.ts`
- **Changes**: 
  - Add `isNewUser` flag (true if just completed sign-up)
  - Add `signUpProgress` state (track completion percentage)
  - Add `setNewUser()` action
  - Persist `isNewUser` temporarily (clear after first session)

#### 4. **Generic Event Service** (minor addition)
- **Path**: `/src/services/generic/GenericEventService.ts`
- **Changes**: Add `createKind0FromLocalKeys()` method
  - Accepts nsec string instead of NostrSigner
  - Used ONLY during sign-up before user has signer
  - Removed after profile is published and user switches to signer

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

### 2. Key Storage (localStorage Only)

**Storage Method**: Browser localStorage with encryption

- **Encryption**: User-provided passphrase (AES-256-GCM)
- **Pros**: Auto-login, seamless UX
- **Cons**: Vulnerable to XSS, browser data clearing
- **User Confirmation Required**: User must acknowledge understanding of localStorage limitations

**Implementation**:

- Prompt user for strong passphrase (min 12 chars)
- Derive encryption key with PBKDF2 (100k iterations)
- Store encrypted nsec in `localStorage` under key `encrypted_nostr_key`
- Store salt and IV separately
- Store pubkey in plaintext (safe to expose)
- User confirms via checkbox: "I understand my keys are stored locally in this browser"

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
    "nip05": "",
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
AuthBusinessService.publishBasicProfile(pubkey) ⚡ BACKGROUND
  ↓
NostrEventService.createKind0Event() [minimal profile]
  ↓
GenericEventService.signEvent() [with generated nsec]
  ↓
GenericRelayService.publishEvent()
  
[THEN LATER, if user enriches profile in Step 4...]

Step 4: ProfileSetupStep (optional enrichment)
  ↓
useNostrSignUp.updateProfile()
  ↓
AuthBusinessService.updateProfile()
  ↓
NostrEventService.createKind0Event() [UPDATED profile]
  ↓
GenericEventService.signEvent()
  ↓
GenericRelayService.publishEvent()
  ↓
Auth Store updates (user profile, isAuthenticated: true)
```

**Avatar Upload**:
- Reuse existing `ImageUpload` + `ImageCropper` components from `/src/components/profile/`
- 1:1 aspect ratio for profile picture
- Upload to Blossom via `GenericBlossomService.uploadFile()`
- Requires temporary signer created from generated nsec (before user has extension)

### 4. Key Backup Mechanisms

#### Encrypted Backup File
**Format**: JSON structure
```json
{
  "version": "1.0",
  "created_at": "2025-10-08T12:34:56Z",
  "encryption": "AES-256-GCM",
  "kdf": "PBKDF2",
  "iterations": 100000,
  "salt": "<base64>",
  "iv": "<base64>",
  "encrypted_nsec": "<base64>",
  "npub": "npub1...",
  "app": "Culture Bridge",
  "warning": "Store this file securely. Losing it means losing your Nostr identity."
}
```

**File Download**:
- Trigger via `<a>` tag with `download` attribute
- Filename: `nostr-backup-{npub-first-8-chars}-{timestamp}.json`
- MIME type: `application/json`

#### QR Code Generation
**Two QR Codes**:
1. **Private Key QR** (nsec) - Red border, security warning
   - Contains full `nsec1...` string
   - High error correction level (L = 7%)
   - User scans with mobile Nostr wallet

2. **Public Key QR** (npub) - Green border
   - Contains full `npub1...` string
   - For sharing profile with others

**Library**: `qrcode` npm package (already compatible with Next.js)
- Generate data URLs for inline display
- Option to download PNG files

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

3. **Key Storage**
   - If localStorage: MUST be encrypted with user passphrase
   - Use PBKDF2 with 100k+ iterations for key derivation
   - Store salt and IV separately from encrypted data
   - Clear encryption passphrase from memory after use

4. **User Education**
   - Display warning: "Your private key IS your account. There is no password reset."
   - Explain: "This key works across ALL Nostr apps (Damus, Snort, Primal, etc.)"
   - Recommend: "Install a browser extension (Alby, nos2x) for secure key management"
   - Emphasize: "Back up your key NOW. We cannot recover it for you."

---

## User Experience (UX) Guidelines

### Step-by-Step Wizard

**Progress Indicator**: 5 steps total

1. Welcome & Options (Generate vs Import)
2. Key Generation (Display nsec/npub + Auto-publish basic Kind 0)
3. Backup + Local Storage Confirmation (Download QR codes + Confirm localStorage)
4. Profile Enrichment Form (Name MANDATORY, Avatar/Bio/NIP-05 OPTIONAL)
5. Final Confirmation (Security acknowledgment)

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
- QR codes displayed side-by-side (private/public)
- Download buttons with file icons
- Background publishing indicator in Step 2 (spinner or "Publishing your profile...")
- Required field indicators (asterisk) for display name in Step 4

**Key Flow Changes**:

- **Step 2**: After keys are generated, a minimal Kind 0 profile is automatically published in the background (ensures every user has a profile)
- **Step 3**: Backup + automatic localStorage storage (no choice of storage method, just confirmation)
- **Step 4**: Single form with all profile fields - only display name is mandatory, all other fields optional
- **Step 5**: Final confirmation before redirect to /profile

### Error Handling

| Error Scenario | User Message | Recovery Action |
|----------------|--------------|-----------------|
| Key generation fails | "Failed to generate keys. Please refresh and try again." | Retry button |
| Background profile publish fails (Step 2) | "Profile publishing in progress... May take a few moments." | Non-blocking - allow user to continue, retry in background |
| Backup not confirmed (Step 3) | "You must back up your keys before continuing." | Disable "Next" until checkbox checked |
| Storage confirmation not checked (Step 3) | "Please confirm you understand the localStorage storage method." | Disable "Next" until checkbox checked |
| Display name missing (Step 4) | "Display name is required to continue." | Disable "Next" until name entered |
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

1. **ProfileBusinessService**
   - Method: `updateUserProfile()` (modify to support initial profile creation)
   - Purpose: Publish Kind 0 metadata event
   - Modifications: Add `createFromLocalKeys(nsec, profileData)` method

2. **GenericBlossomService**
   - Method: `uploadFile()` (for avatar upload)
   - Purpose: Upload avatar to Blossom CDN
   - Modifications: Support temporary signer (created from nsec during sign-up)

3. **GenericEventService**
   - Method: `signEvent()` (modify to accept nsec string)
   - Purpose: Sign Kind 0 event during sign-up
   - Modifications: Add overload for nsec-based signing (pre-extension)

4. **Auth Store**
   - Methods: `setUser()`, `setAuthenticated()`
   - Purpose: Store pubkey and profile after sign-up
   - Modifications: Add `setNewUser(true)` flag

---

## Post-Sign-Up Flow

### Immediate Next Steps

1. **Welcome Modal**
   - Display: "Welcome to Culture Bridge, {display_name}!"
   - Explain: "Your Nostr identity is now active across the entire network"
   - Show: Quick tutorial (Explore, Shop, Heritage, Messages)
   - CTA: "Complete your profile" or "Start exploring"

2. **Onboarding Checklist** (Optional)
   - [ ] Add a profile banner
   - [ ] Write a detailed bio
   - [ ] Add NIP-05 verification
   - [ ] Add Lightning address (lud16)
   - [ ] Create your first shop product
   - [ ] Contribute a heritage story

3. **First Session Recommendations**
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
  - [ ] QR codes scan correctly with mobile wallets
  - [ ] QR codes contain correct nsec/npub

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

- `qrcode` (^1.5.3): QR code generation for key backup
  - Install: `npm install qrcode @types/qrcode`
  - Usage: Generate data URLs for nsec/npub QR codes

---

## Implementation Phases

### Phase 1: Core Sign-Up Flow (MVP)

**Scope**: Basic key generation and automatic profile publishing

- [ ] Create page route (`/src/app/signup/page.tsx`)
- [ ] Create `SignUpFlow` component with step navigation (5 steps)
- [ ] Create `KeyGenerationStep` component
- [ ] Create `useNostrSignUp` hook
- [ ] Create `AuthBusinessService` with:
  - `generateNostrKeys()` method
  - `publishBasicProfile()` method (auto-publish minimal Kind 0)
- [ ] Implement background Kind 0 publishing after key generation
- [ ] Add success notification after keys generated + profile published

### Phase 2: Backup + Local Storage Confirmation

**Scope**: Backup and localStorage confirmation step

- [ ] Create `KeyBackupStorageStep` component
- [ ] Implement encrypted file download
- [ ] Generate QR codes for keys
- [ ] Add backup confirmation checkbox (mandatory)
- [ ] Implement localStorage storage (encrypted, automatic)
- [ ] Add localStorage understanding confirmation checkbox
- [ ] Security warnings about localStorage limitations
- [ ] Best practices display

### Phase 3: Profile Enrichment Form

**Scope**: Single form with mandatory name + optional fields

- [ ] Create `ProfileSetupStep` component with full form
- [ ] Display name input (MANDATORY, validation required)
- [ ] Integrate `ImageUpload` + `ImageCropper` (OPTIONAL)
- [ ] Add bio textarea (OPTIONAL)
- [ ] Add NIP-05 identifier field (OPTIONAL)
- [ ] Upload avatar to Blossom (if provided)
- [ ] Implement `updateProfile()` method in `AuthBusinessService`
- [ ] Update existing Kind 0 event (not create new one)
- [ ] Form validation (name required, others optional)

### Phase 4: Final Confirmation

**Scope**: Security acknowledgment and completion

- [ ] Create `FinalConfirmationStep` component
- [ ] Display configuration summary
- [ ] Security warnings review
- [ ] "I understand and accept responsibility" checkbox
- [ ] Redirect to /profile after confirmation
- [ ] Update auth store with user data

### Phase 5: Polish & Testing

**Scope**: UX improvements and comprehensive testing

- [ ] Add welcome modal post-sign-up
- [ ] Implement onboarding checklist
- [ ] Add keyboard navigation
- [ ] Screen reader testing
- [ ] Security audit
- [ ] Analytics tracking for each step

---

## Success Metrics

### Completion Rate
- **Target**: >80% of users who start sign-up complete all steps
- **Measure**: Track step completion in analytics
- **Failure Points**: Identify where users drop off (likely backup step)

### Key Backup Rate
- **Target**: >95% of users download backup or save to extension
- **Measure**: Track backup confirmation checkbox
- **Risk**: Users who skip backup will lose accounts

### Profile Completion

- **Target**: 100% of users have display name (mandatory field)
- **Target**: >30% of users add avatar
- **Target**: >40% of users add bio
- **Measure**: Kind 0 event content analysis

### Extension Adoption

- **Target**: >40% of users migrate to browser extension within 30 days
- **Measure**: Track localStorage vs extension usage

---

## Open Questions / Future Enhancements

1. **Multi-Device Sync**
   - How do users access same identity on multiple devices?
   - Solution: QR code transfer or encrypted cloud backup (future NIP)

2. **Account Recovery**
   - Can we implement social recovery (NIP-26 delegation)?
   - Trade-off: Complexity vs security vs UX

3. **Key Rotation**
   - Should we support key rotation (change nsec, keep npub)?
   - Nostr limitation: No native key rotation support

4. **Passphrase Strength**
   - Should we enforce minimum passphrase entropy?
   - Solution: zxcvbn library for password strength estimation

5. **Biometric Unlock**
   - Can we use WebAuthn for biometric localStorage decryption?
   - Benefit: Strong security + great UX

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
- Store plaintext nsec in localStorage
- Transmit nsec over network
- Expose nsec in error messages
- Keep nsec in memory longer than necessary

✅ **ALWAYS**:
- Encrypt before localStorage storage
- Clear sensitive data after use
- Validate keys after generation
- Warn users about key loss
- Use secure random generation

### Code Review Checklist

Before merging sign-up implementation:
- [ ] No nsec in console.log statements
- [ ] localStorage values are encrypted
- [ ] PBKDF2 iterations ≥ 100k
- [ ] QR codes generate correctly
- [ ] Backup file is encrypted
- [ ] SOA layers respected
- [ ] TypeScript types complete
- [ ] Error handling comprehensive
- [ ] Accessibility tested
- [ ] Mobile responsive

---

**Document Status**: Ready for implementation planning  
**Next Steps**: Break down Phase 1 into development tasks, assign to sprint
