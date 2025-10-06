# NIP/Kind Implementation Matrix

Reference document for Nostr protocol implementation across Culture Bridge pages and features.

## Matrix

| Page/Feature | NIP-01 | NIP-05 | NIP-07 | NIP-17 | NIP-23 | NIP-33 | NIP-94 | Blossom | Kind 0 | Kind 1059 | Kind 30023 | Status |
|--------------|--------|--------|--------|--------|--------|--------|--------|---------|--------|-----------|------------|--------|
| **Sign In** | ✅ Basic events | ❌ | ✅ Signer auth | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Profile fetch | ❌ | ❌ | **Production** |
| **Profile** | ✅ Event structure | ✅ DNS verification | ✅ Read/write | ❌ | ❌ | ❌ | ❌ | ✅ Image upload | ✅ Profile metadata | ❌ | ❌ | **Production** |
| **Messages** | ✅ Event queries | ✅ Fallback names | ✅ Signing DMs | ✅ Gift wraps | ❌ | ❌ | ❌ | ❌ | ✅ Name resolution | ✅ Encrypted DMs | ❌ | **Production** |
| **Shop** | ✅ Event publishing | ❌ | ✅ Product signing | ❌ | ✅ Product content | ✅ dTag identity | ✅ imeta tags | ✅ Image upload | ❌ | ❌ | ✅ Product events | **Production** |
| **My Shop** | ✅ Event queries | ❌ | ✅ Edit/delete | ❌ | ✅ Content updates | ✅ Replace events | ✅ imeta tags | ✅ Image upload | ❌ | ❌ | ✅ Product CRUD | **Production** |
| **Heritage** | ✅ Event publishing | ❌ | ✅ Content signing | ❌ | ✅ Story content | ✅ dTag identity | ✅ imeta tags | ✅ Media upload | ❌ | ❌ | ✅ Heritage events | **Production** |
| **My Contributions** | ✅ Event queries | ❌ | ✅ Read access | ❌ | ✅ Content fetch | ✅ Filter by dTag | ✅ Media display | ✅ Media display | ❌ | ❌ | ✅ User content | **Production** |
| **Explore** | ✅ Event queries | ❌ | ❌ | ❌ | ✅ Content display | ✅ Query by tags | ✅ Media display | ✅ Media display | ❌ | ❌ | ✅ Public content | **Production** |
| **Elder Voices** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **Static Data** |
| **Exhibitions** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **Static Data** |

## NIP Descriptions

### Core Protocol NIPs (Implemented)

- **NIP-01**: Basic protocol - event structure, signing, IDs, relay communication ✅
- **NIP-05**: DNS-based verification - `alice@example.com` identifiers ✅
- **NIP-07**: Browser extension signer - `window.nostr` interface (Alby, nos2x, Nos2x-Fox) ✅
- **NIP-17**: Private DMs - gift-wrapped encrypted messages (double encryption) ✅
- **NIP-23**: Long-form content - articles, blog posts (markdown) ✅
- **NIP-33**: Parameterized replaceable events - unique dTag, update-in-place ✅
- **NIP-94**: File metadata - imeta tags with URL, MIME type, SHA-256, dimensions ✅

### External Protocols (Implemented)

- **Blossom**: Decentralized CDN - media hosting with Nostr auth, SHA-256 verification ✅

## Kind Descriptions (Implemented)

- **Kind 0**: User metadata - profile info (name, display_name, about, picture, banner, website, nip05, lud16, lud06, bot, birthday) ✅
- **Kind 1059**: Gift wrap - encrypted outer layer for NIP-17 DMs (double-wrapped encryption with ephemeral keys) ✅
- **Kind 30023**: Long-form content - parameterized replaceable articles (products, heritage, stories) ✅

## Feature Implementation Details

### Authentication (Sign In)
- Uses **NIP-07** browser extensions (Alby, nos2x)
- Fetches **Kind 0** profile on login
- Stores pubkey in auth state

### Profile Management
- Publishes **Kind 0** metadata events to Nostr relays
- Real-time **NIP-05** DNS verification with status badges
- **NIP-07** browser extension for signing profile updates
- **Blossom** CDN for profile picture and banner images
- Image cropping with react-easy-crop (1:1 and 3:1 aspect ratios)
- Field-level validation (display_name, about, website, birthday, lud16, lud06, nip05)
- Multi-relay publishing with success/failure tracking
- State propagation via auth store to all components

### Messaging System
- **NIP-17** gift-wrapped DMs (double-wrapped encryption)
- **Kind 1059** gift wrap events
- **NIP-05** fallback for missing names
- Background profile refresh from cache
- IndexedDB cache with AES-GCM encryption

### Shop Products
- **Kind 30023** parameterized replaceable events
- **NIP-33** dTag for product identity (`product-{timestamp}-{random}`)
- **NIP-23** markdown content structure
- **NIP-94** imeta tags for media metadata (URL, MIME, SHA-256, dimensions)
- **Blossom** for product images/media (sequential upload, retry logic, progress tracking)
- Multiple attachments support (up to 5 files, 100MB each, 500MB total)
- System tags: `t` tag for `culture-bridge-shop`, `price` tag, `currency` tag
- User tags: Custom product categorization

### Heritage Content
- **Kind 30023** for stories/artifacts
- **NIP-33** dTag persistence (`contribution-{timestamp}-{random}`)
- **NIP-23** markdown formatting
- **NIP-94** imeta tags for multi-media metadata
- **Blossom** multi-media uploads (images, video, audio)
- System tags: `t` tag for `culture-bridge-heritage`, `category` tag (e.g., Tradition, Art, Story)
- Auto-redirect after successful publication (1 second delay)
- Categories via `#t` tags

### Content Discovery (Explore/My Contributions)
- **NIP-01** relay queries with filters
- Filter by `kinds: [30023]`
- Filter by `#t` tags (categories: `culture-bridge-shop`, `culture-bridge-heritage`)
- Filter by author pubkey for user-specific content
- Public content access (no auth required for Explore)
- Authenticated queries for My Contributions

### Static Content Pages
**Elder Voices** and **Exhibitions** use static data from `/src/data/`:
- No Nostr event queries
- Pre-configured data objects
- No relay communication
- Client-side filtering and sorting only
- Static route generation at build time

## Technical Patterns

### Event Creation

- All **Kind 30023** events use `GenericEventService.createNIP23Event()`
- Consistent **NIP-33** dTag strategy (`${type}-${timestamp}-${randomHex}`)
- Event IDs change on updates, dTag persists (parameterized replaceable)
- Auto-tag with `culture-bridge-${category}` for filtering (e.g., `culture-bridge-shop`, `culture-bridge-heritage`)
- Automatic relay publishing via configured relay set
- Event signing through NIP-07 browser extensions (Alby, nos2x, etc.)

### Media Upload

- **Blossom** sequential upload with progress tracking
- Retry logic with exponential backoff (max 3 attempts per file)
- User consent dialog for multiple file uploads
- SHA-256 hashing and verification via **NIP-94** imeta tags
- Multi-file support: Up to 5 files per content piece
- File size limits: 100MB per file, 500MB total per upload session
- Supported formats: Images (JPEG, PNG, WebP, GIF), Video (MP4, WebM), Audio (MP3, OGG, WAV)
- Progress callbacks for real-time UI feedback

### Profile Resolution (3-tier fallback)

1. **Kind 0** profile metadata (display_name field from event content)
2. **NIP-05** verification identifier (e.g., `alice@example.com`)
3. Truncated npub display (UI fallback: `npub1abc...xyz`)

### Caching Strategy

- IndexedDB for conversation/message persistence
- AES-GCM encryption (PBKDF2 key derivation from npub, 100k iterations)
- 40s cache validity for conversation lists
- Background profile refresh for up-to-date user metadata
- Automatic cache clearing on sign-out for security
- Encryption-at-rest prevents casual DevTools browsing

## Security Notes

### NIP-07 Browser Extensions

- Never exposes private keys (nsec) to the application
- User confirms each signature request through extension UI
- Sandboxed execution context for secure key storage
- Supports all major extensions: Alby, nos2x, Nostore, Flamingo
- Graceful fallback prompts if no extension detected

### NIP-17 Message Encryption

- Double gift-wrap pattern: Creates two copies (sender + recipient) for message retrieval
- Ephemeral keys generated for each message (forward secrecy)
- One-time encryption keys prevent retroactive decryption
- Conversation-level encryption using NIP-44 sealed sender
- Self-healing: Both parties can retrieve full conversation history

### Blossom Authentication

- Signed upload authorization events (Kind 24242 auth events)
- User-specific file namespaces (pubkey-based organization)
- SHA-256 content verification post-upload ensures data integrity
- Server-side signature validation before accepting uploads
- Prevents unauthorized file uploads or modifications

### Cache Encryption

- Uses pubkey for key derivation (not nsec, due to NIP-07 security model)
- PBKDF2 key derivation with 100k iterations for brute-force resistance
- AES-256-GCM encryption-at-rest protection for cached data
- Prevents casual browsing via browser DevTools
- Automatic cache clearing on sign-out for multi-user device security

## Future Enhancements

### Planned NIPs

- **NIP-04**: Legacy DM encryption (backward compatibility)
- **NIP-11**: Relay capability discovery
- **NIP-44**: Modern encrypted DMs (v2 encryption)
- **NIP-46**: Remote signer protocol (mobile apps)

### Media Enhancements

- Blurhash progressive loading for images
- Video/audio streaming optimization
- IPFS fallback URLs for decentralized media hosting
- Thumbnail generation for video content

### Profile Enhancements

- ✅ **NIP-05 verification** - Real-time DNS verification with verified/unverified badges (implemented 2025-10-06)
- ✅ **Lightning addresses** - lud16 (modern) and lud06 (LNURL) support (implemented 2025-10-06)
- ✅ **Image cropping** - react-easy-crop for profile picture and banner (implemented 2025-10-06)
- Profile cache (7-day TTL) - planned
- WebSocket profile updates - planned

### Static Content Migration (Future)

- **Elder Voices**: Potential migration to Kind 30023 for user-submitted stories
- **Exhibitions**: Potential migration to Kind 30023 for community-curated exhibitions
- Currently using static data from `/src/data/` for curated content

## References

- [Nostr NIPs Repository](https://github.com/nostr-protocol/nips)
- [Blossom Protocol Spec](https://github.com/hzrd149/blossom)
- [Nostr Tools Library](https://github.com/nbd-wtf/nostr-tools)
- [Blossom Client SDK](https://github.com/hzrd149/blossom-client-sdk)

---

**Last Updated**: October 6, 2025  
**Codebase Version**: Next.js 15.4.6  
**Active NIPs**: 7 implemented (NIP-01, NIP-05, NIP-07, NIP-17, NIP-23, NIP-33, NIP-94 + Blossom)  
**Recent Updates**:

- 2025-10-06: SOA Compliance - Refactored profile page to follow strict Service-Oriented Architecture (hook layer abstraction)
- 2025-10-06: Documentation - Updated NIP implementation matrix with verified codebase data (static vs dynamic content)
- 2025-10-06: Profile page - Added NIP-05 DNS verification, Lightning addresses (lud16/lud06), image cropping
- 2025-10-06: Profile page - Blossom integration for profile picture and banner uploads

---
