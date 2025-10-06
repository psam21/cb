# NIP/Kind Implementation Matrix

Reference document for Nostr protocol implementation across Culture Bridge pages and features.

## Matrix

| Page/Feature | NIP-01 | NIP-05 | NIP-07 | NIP-17 | NIP-23 | NIP-33 | NIP-94 | Blossom | Kind 0 | Kind 1059 | Kind 30023 |
|--------------|--------|--------|--------|--------|--------|--------|--------|---------|--------|-----------|------------|
| **Sign In** | Basic events | - | Signer auth | - | - | - | - | - | Profile fetch | - | - |
| **Profile** | Event structure | Display names | Read/write | - | - | - | - | - | Profile metadata | - | - |
| **Messages** | Event queries | Fallback names | Signing DMs | Gift wraps | - | - | - | - | Name resolution | Encrypted DMs | - |
| **Shop** | Event publishing | - | Product signing | - | Product content | dTag identity | - | Image upload | - | - | Product events |
| **My Shop** | Event queries | - | Edit/delete | - | Content updates | Replace events | - | Image upload | - | - | Product CRUD |
| **Heritage** | Event publishing | - | Content signing | - | Story content | dTag identity | - | Media upload | - | - | Heritage events |
| **My Contributions** | Event queries | - | Read access | - | Content fetch | Filter by dTag | - | - | - | - | User content |
| **Explore** | Event queries | - | - | - | Content display | - | - | - | - | - | Public content |
| **Elder Voices** | Event queries | - | - | - | Story display | - | - | Media display | - | - | Story content |
| **Exhibitions** | Event queries | - | - | - | Content display | - | - | Media display | - | - | Exhibition content |

## NIP Descriptions

### Core Protocol NIPs

- **NIP-01**: Basic protocol - event structure, signing, IDs, relay communication
- **NIP-05**: DNS-based verification - `alice@example.com` identifiers
- **NIP-07**: Browser extension signer - `window.nostr` interface (Alby, nos2x)
- **NIP-17**: Private DMs - gift-wrapped encrypted messages
- **NIP-23**: Long-form content - articles, blog posts (markdown)
- **NIP-33**: Parameterized replaceable events - unique dTag, update-in-place
- **NIP-94**: File metadata - SHA-256 hash, MIME type, size

### External Protocols

- **Blossom**: Decentralized CDN - media hosting with Nostr auth

## Kind Descriptions

- **Kind 0**: User metadata - profile info (name, about, picture, nip05)
- **Kind 1059**: Gift wrap - encrypted outer layer for NIP-17 DMs
- **Kind 30023**: Long-form content - parameterized replaceable articles

## Feature Implementation Details

### Authentication (Sign In)
- Uses **NIP-07** browser extensions (Alby, nos2x)
- Fetches **Kind 0** profile on login
- Stores pubkey in auth state

### Profile Management
- Displays **Kind 0** metadata
- Falls back to **NIP-05** if no display_name
- NIP-07 for profile updates

### Messaging System
- **NIP-17** gift-wrapped DMs (double-wrapped encryption)
- **Kind 1059** gift wrap events
- **NIP-05** fallback for missing names
- Background profile refresh from cache
- IndexedDB cache with AES-GCM encryption

### Shop Products
- **Kind 30023** parameterized replaceable events
- **NIP-33** dTag for product identity
- **NIP-23** markdown content structure
- **Blossom** for product images/media
- Multiple attachments support

### Heritage Content
- **Kind 30023** for stories/artifacts
- **NIP-33** dTag persistence
- **NIP-23** markdown formatting
- **Blossom** multi-media uploads
- Categories via `#t` tags

### Content Discovery
- **NIP-01** relay queries with filters
- Filter by `kinds: [30023]`
- Filter by `#t` tags (categories)
- Public content access (no auth required)

## Technical Patterns

### Event Creation
- All **Kind 30023** events use `GenericEventService.createNIP23Event()`
- Consistent **NIP-33** dTag strategy
- Event IDs change on updates, dTag persists

### Media Upload
- **Blossom** sequential upload with progress
- Retry logic with exponential backoff
- User consent for multiple files
- SHA-256 hashing via **NIP-94** pattern

### Profile Resolution (3-tier fallback)
1. **Kind 0** profile metadata (display_name)
2. **NIP-05** verification (alice@example.com)
3. Truncated npub (UI only)

### Caching Strategy
- IndexedDB for conversations
- AES-GCM encryption (PBKDF2 key from npub)
- 40s cache validity
- Background profile refresh

## Security Notes

### NIP-07 Browser Extensions
- Never exposes private keys (nsec)
- User confirms each signature
- Sandboxed execution context

### NIP-17 Message Encryption
- Double gift-wrap (sender + recipient copies)
- Ephemeral keys for each message
- Forward secrecy via one-time keys

### Blossom Authentication
- Signed upload auth events
- User-specific file namespaces
- SHA-256 content verification

### Cache Encryption
- Uses pubkey (not nsec, NIP-07 limitation)
- PBKDF2 key derivation (100k iterations)
- Encryption-at-rest protection
- Prevents DevTools casual browsing

## Future Enhancements

### Planned NIPs
- **NIP-04**: Legacy DM encryption (backward compatibility)
- **NIP-11**: Relay capability discovery
- **NIP-44**: Modern encrypted DMs (v2 encryption)
- **NIP-46**: Remote signer protocol (mobile apps)

### Media Enhancements
- **NIP-94**: Full file metadata in events
- Blurhash progressive loading
- Video/audio streaming
- IPFS fallback URLs

### Profile Enhancements
- NIP-05 verification badges
- Profile cache (7-day TTL)
- WebSocket profile updates
- Lightning addresses (LNURL)

## References

- [Nostr NIPs Repository](https://github.com/nostr-protocol/nips)
- [Blossom Protocol Spec](https://github.com/hzrd149/blossom)
- [Nostr Tools Library](https://github.com/nbd-wtf/nostr-tools)
- [Blossom Client SDK](https://github.com/hzrd149/blossom-client-sdk)

---

**Last Updated**: October 6, 2025  
**Codebase Version**: Next.js 15.4.6  
**Active NIPs**: 7 implemented, 4 planned
