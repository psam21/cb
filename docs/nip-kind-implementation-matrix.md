# NIP/Kind Implementation Matrix

Reference document for Nostr protocol implementation across Culture Bridge pages and features.

## Matrix

| Page/Feature | NIP-01 | NIP-05 | NIP-07 | NIP-09 | NIP-17 | NIP-23 | NIP-33 | NIP-44 | NIP-94 | Blossom | Kind 0 | Kind 1 | Kind 5 | Kind 14 | Kind 1059 | Kind 10063 | Kind 24242 | Kind 30023 | Status |
|--------------|--------|--------|--------|--------|--------|--------|--------|--------|--------|---------|--------|--------|--------|---------|-----------|------------|------------|------------|--------|
| **Sign Up** | ✅ Basic events | ❌ | ✅ Signer auth | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Avatar upload | ✅ Profile create | ✅ Welcome note | ❌ | ❌ | ❌ | ❌ | ✅ Upload auth | ❌ | **Production** |
| **Sign In** | ✅ Basic events | ❌ | ✅ Signer auth | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Profile fetch | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **Production** |
| **Profile** | ✅ Event structure | ✅ DNS verification | ✅ Read/write | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Image upload | ✅ Profile metadata | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Upload auth | ❌ | **Production** |
| **Messages** | ✅ Event queries | ✅ Fallback names | ✅ Signing DMs | ❌ | ✅ Gift wraps | ❌ | ❌ | ✅ Encryption | ❌ | ❌ | ✅ Name resolution | ❌ | ❌ | ✅ Rumor events | ✅ Encrypted DMs | ❌ | ❌ | ❌ | **Production** |
| **Shop** | ✅ Event publishing | ❌ | ✅ Product signing | ✅ Delete products | ❌ | ✅ Product content | ✅ dTag identity | ❌ | ✅ imeta tags | ✅ Image upload | ❌ | ❌ | ✅ Product deletion | ❌ | ❌ | ✅ Server list | ✅ Upload auth | ✅ Product events | **Production** |
| **My Shop** | ✅ Event queries | ❌ | ✅ Edit/delete | ✅ Delete products | ❌ | ✅ Content updates | ✅ Replace events | ❌ | ✅ imeta tags | ✅ Image upload | ❌ | ❌ | ✅ Product deletion | ❌ | ❌ | ✅ Server list | ✅ Upload auth | ✅ Product CRUD | **Production** |
| **Heritage** | ✅ Event publishing | ❌ | ✅ Content signing | ✅ Delete content | ❌ | ✅ Story content | ✅ dTag identity | ❌ | ✅ imeta tags | ✅ Media upload | ❌ | ❌ | ✅ Content deletion | ❌ | ❌ | ✅ Server list | ✅ Upload auth | ✅ Heritage events | **Production** |
| **My Contributions** | ✅ Event queries | ❌ | ✅ Read access | ❌ | ❌ | ✅ Content fetch | ✅ Filter by dTag | ❌ | ✅ Media display | ✅ Media display | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ User content | **Production** |
| **Explore** | ✅ Event queries | ❌ | ❌ | ❌ | ❌ | ✅ Content display | ✅ Query by tags | ❌ | ✅ Media display | ✅ Media display | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Public content | **Production** |
| **Elder Voices** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **Static Data** |
| **Exhibitions** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **Static Data** |

## NIP Descriptions

### Core Protocol NIPs (Implemented)

- **NIP-01**: Basic protocol - event structure, signing, IDs, relay communication ✅
- **NIP-05**: DNS-based verification - `alice@example.com` identifiers ✅
- **NIP-07**: Browser extension signer - `window.nostr` interface (Alby, nos2x, Nos2x-Fox) ✅
- **NIP-09**: Event deletion - Kind 5 deletion events for removing content ✅
- **NIP-17**: Private DMs - gift-wrapped encrypted messages (double encryption) ✅
- **NIP-23**: Long-form content - articles, blog posts (markdown) ✅
- **NIP-33**: Parameterized replaceable events - unique dTag, update-in-place ✅
- **NIP-44**: Encrypted payloads (v2) - ChaCha20 + HMAC-SHA256 for NIP-17 encryption ✅
- **NIP-94**: File metadata - imeta tags with URL, MIME type, SHA-256, dimensions ✅

### External Protocols (Implemented)

- **Blossom**: Decentralized CDN - media hosting with Nostr auth, SHA-256 verification ✅

## Kind Descriptions (Implemented)

- **Kind 0**: User metadata - profile info (name, display_name, about, picture, banner, website, nip05, lud16, lud06, bot, birthday) ✅
- **Kind 1**: Short text note - public posts, welcome messages, status updates ✅
- **Kind 5**: Event deletion - NIP-09 deletion events that reference events to delete ✅
- **Kind 14**: Rumor - unsigned event wrapped in NIP-17 gift-wrapped messages (internal to encryption flow) ✅
- **Kind 1059**: Gift wrap - encrypted outer layer for NIP-17 DMs (double-wrapped encryption with ephemeral keys) ✅
- **Kind 10063**: User server list - Blossom CDN server discovery for file hosting ✅
- **Kind 24242**: Blossom authorization - signed auth events for Blossom file uploads ✅
- **Kind 30023**: Long-form content - parameterized replaceable articles (products, heritage, stories) ✅

## Feature Implementation Details

### Sign Up Workflow

- Generates Nostr keypair (nsec/npub) via `nostr-tools`
- Publishes **Kind 0** profile metadata to configured relays
- Publishes **Kind 1** welcome note for verification (silent)
- **Blossom** avatar upload with **Kind 24242** authorization
- Creates encrypted backup file with profile and keys
- Clears nsec from memory after backup creation
- Uses temporary signer during sign-up flow

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
- **NIP-44** encryption (ChaCha20 + HMAC-SHA256) for message payloads
- **Kind 14** rumor events (unsigned, encrypted in seal)
- **Kind 1059** gift wrap events (seal + outer wrap)
- **NIP-05** fallback for missing names
- Conversation context with image thumbnails (product/heritage references)
- Background profile refresh from cache
- IndexedDB cache with AES-GCM encryption for messages and conversations
- **ProfileCacheService** - 7-day TTL, persistent across sessions, LRU eviction at 1000 entries
- **MessageCacheService** - 30-day TTL, encrypted conversation/message storage
- **AdaptiveSync** - Dynamic polling intervals (1-10 minutes) based on message activity
- Duplicate message deduplication via processedMessageIds ref (prevents cache+subscription double processing)
- Self-message filtering (sender === recipient) to prevent invalid conversations
- Cache migration system for data cleanup (removes pre-fix invalid conversations on init)

### Shop Products

- **Kind 30023** parameterized replaceable events
- **NIP-33** dTag for product identity (`product-{timestamp}-{random}`)
- **NIP-23** markdown content structure
- **NIP-09** deletion support via **Kind 5** events
- **NIP-94** imeta tags for media metadata (URL, MIME, SHA-256, dimensions)
- **Blossom** for product images/media (sequential upload, retry logic, progress tracking)
- **Kind 24242** Blossom authorization for uploads
- **Kind 10063** server list for CDN discovery
- Multiple attachments support (up to 5 files, 100MB each, 500MB total)
- System tags: `t` tag for `culture-bridge-shop`, `price` tag, `currency` tag
- User tags: Custom product categorization

### Heritage Content

- **Kind 30023** for stories/artifacts
- **NIP-33** dTag persistence (`contribution-{timestamp}-{random}`)
- **NIP-23** markdown formatting
- **NIP-09** deletion support via **Kind 5** events
- **NIP-94** imeta tags for multi-media metadata
- **Blossom** multi-media uploads (images, video, audio)
- **Kind 24242** Blossom authorization for uploads
- **Kind 10063** server list for CDN discovery
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
- **Kind 1** events created directly for welcome notes (sign-up verification)
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

- **ProfileCacheService** - IndexedDB persistent cache with 7-day TTL
  - LRU eviction at 1000 entries (prevents unbounded growth)
  - In-memory secondary cache (Map) for instant lookups
  - Hit rate tracking (62% observed in production)
  - PBKDF2 key derivation from npub (100k iterations)
  - AES-256-GCM encryption-at-rest
- **MessageCacheService** - IndexedDB encrypted storage with 30-day TTL
  - Caches conversations (metadata, last message, unread count)
  - Caches messages (full conversation history)
  - Two-tier caching: In-memory Map + IndexedDB
  - Encryption using PBKDF2 + AES-GCM (100k iterations)
  - Migration system for schema updates and data cleanup
  - Automatic TTL-based cleanup on initialization
- **AdaptiveSync** - Background sync with exponential backoff
  - Dynamic polling interval: 1-10 minutes based on activity
  - Starts at 1 minute, increases 1.5x on empty syncs
  - Resets to 1 minute on new message detection
  - Stops on component unmount to prevent resource leaks
- 40s cache validity for conversation lists (in-memory staleness check)
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
- **NIP-44 v2** encryption (ChaCha20-Poly1305 + HKDF-SHA256)
- Ephemeral keys generated for each message (forward secrecy)
- One-time encryption keys prevent retroactive decryption
- **Kind 14** rumor (unsigned message) → **Kind 1059** seal (encrypted) → **Kind 1059** gift wrap (double-encrypted)
- Conversation-level encryption using NIP-44 sealed sender
- Self-healing: Both parties can retrieve full conversation history

### NIP-09 Event Deletion

- **Kind 5** deletion events reference event IDs to delete
- Used for shop product deletion and heritage content removal
- Deletion events published to all configured relays
- Relays honor deletion requests per NIP-09 specification
- Soft-delete pattern: Original events may remain in some relays

### Blossom Authentication

- **Kind 24242** signed upload authorization events
- **Kind 10063** user server list for CDN discovery
- User-specific file namespaces (pubkey-based organization)
- SHA-256 content verification post-upload ensures data integrity
- Server-side signature validation before accepting uploads
- Prevents unauthorized file uploads or modifications

### NIP-44 Encryption

- Modern encryption standard for Nostr (v2, audited by Cure53 Dec 2023)
- Uses ChaCha20-Poly1305 for authenticated encryption
- HKDF-SHA256 for key derivation from ECDH shared secret
- secp256k1 curve for elliptic curve Diffie-Hellman (ECDH)
- Conversation keys derived from sender private key + recipient public key
- Used internally by NIP-17 for gift-wrapped message encryption
- Implemented via nostr-tools library and NIP-07 signer extensions

### NIP-04 Legacy Support

- **NIP-04** interface available in NostrSigner type definition
- Not actively used in production features
- Maintained for potential backward compatibility with legacy DMs
- Modern features use **NIP-44** exclusively
- Extensions may provide nip04 methods, but app defaults to NIP-44

### Cache Encryption

- Uses pubkey for key derivation (not nsec, due to NIP-07 security model)
- PBKDF2 key derivation with 100k iterations for brute-force resistance
- AES-256-GCM encryption-at-rest protection for cached data
- Prevents casual browsing via browser DevTools
- Automatic cache clearing on sign-out for multi-user device security

## Future Enhancements

### Planned NIPs

- **NIP-11**: Relay capability discovery (relay metadata discovery)
- **NIP-46**: Remote signer protocol (mobile apps, Nostr Connect)
- **NIP-65**: Relay list metadata (user's preferred relay list)

### Relay Support

Current relay configurations include support for additional NIPs not yet utilized:

- **NIP-02**: Contact list and petnames
- **NIP-11**: Relay information document (metadata)
- **NIP-15**: End of stored events notice
- **NIP-22**: Event created_at limits
- **NIP-28**: Public chat
- **NIP-40**: Expiration timestamp
- **NIP-59**: Gift wrap (infrastructure present)

### Media Enhancements

- Blurhash progressive loading for images
- Video/audio streaming optimization
- IPFS fallback URLs for decentralized media hosting
- Thumbnail generation for video content

### Profile Enhancements

- ✅ **NIP-05 verification** - Real-time DNS verification with verified/unverified badges (implemented 2025-10-06)
- ✅ **Lightning addresses** - lud16 (modern) and lud06 (LNURL) support (implemented 2025-10-06)
- ✅ **Image cropping** - react-easy-crop for profile picture and banner (implemented 2025-10-06)
- ✅ **Profile cache** - ProfileCacheService with 7-day TTL, LRU eviction, 62% hit rate (implemented 2025-10-16)
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

**Last Updated**: October 16, 2025  
**Codebase Version**: Next.js 15.4.6  
**Active NIPs**: 9 implemented (NIP-01, NIP-05, NIP-07, NIP-09, NIP-17, NIP-23, NIP-33, NIP-44, NIP-94 + Blossom)  
**Active Event Kinds**: 8 kinds (Kind 0, Kind 1, Kind 5, Kind 14, Kind 1059, Kind 10063, Kind 24242, Kind 30023)  
**Recent Updates**:

- 2025-10-16: Messaging - Fixed duplicate conversation bug (useState → useRef for processedMessageIds Set)
- 2025-10-16: Messaging - Added self-message filter (prevents conversations with self where sender === recipient)
- 2025-10-16: Messaging - Implemented cache migration system (removes invalid pre-fix data on init)
- 2025-10-16: Messaging - ProfileCacheService deployed (7-day TTL, LRU eviction, 62% hit rate)
- 2025-10-16: Messaging - MessageCacheService optimization (two-tier caching, 30-day TTL)
- 2025-10-16: Messaging - AdaptiveSync background polling (1-10 min dynamic intervals)
- 2025-10-16: Performance - Reduced conversation load time from 86s → 35s → 22s (74% improvement)
- 2025-10-12: Code Quality - Completed comprehensive refactoring initiative (17/17 tasks, 100% complete)
- 2025-10-12: Architecture - Documented attachment hook patterns (decorator pattern, when-to-use guidance)
- 2025-10-12: Error Handling - Standardized error handling across 9 hooks (AppError with structured metadata)
- 2025-10-12: Documentation - Added 510+ lines of JSDoc (services, hooks, workflows, architecture patterns)
- 2025-10-12: Cleanup - Removed 270 lines of unused POC code (useMultipleAttachments)
- 2025-10-11: Documentation - Added Kind 1 (welcome note), Sign Up workflow details, NIP-04 legacy support notes
- 2025-10-11: Documentation - Updated relay configurations showing additional NIP support infrastructure
- 2025-10-11: Matrix - Added Sign Up row with full implementation details (Kind 0, Kind 1, Blossom)
- 2025-10-07: Messages - Added conversation context with image thumbnails for product/heritage references
- 2025-10-07: Documentation - Added NIP-09 (deletion), NIP-44 (encryption), Kind 5, Kind 14, Kind 10063, Kind 24242 to implementation matrix
- 2025-10-06: SOA Compliance - Refactored profile page to follow strict Service-Oriented Architecture (hook layer abstraction)
- 2025-10-06: Documentation - Updated NIP implementation matrix with verified codebase data (static vs dynamic content)
- 2025-10-06: Profile page - Added NIP-05 DNS verification, Lightning addresses (lud16/lud06), image cropping
- 2025-10-06: Profile page - Blossom integration for profile picture and banner uploads

---
