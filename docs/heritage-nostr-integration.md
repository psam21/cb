# Heritage Contribution - Nostr Integration Strategy

## Decision: Use Kind 30023 (Same as Shop)

### Rationale

Heritage contributions will use **Kind 30023** (parameterized replaceable long-form content) - the same event kind used by shop products. This decision enables:

1. **Maximum Code Reuse**
   - Leverage existing NostrEventService
   - Reuse ShopBusinessService patterns
   - Share MediaBusinessService workflows
   - Common query and filtering logic

2. **Unified Content Model**
   - Both shop and heritage are cultural contributions
   - Similar metadata structure (title, category, media, tags)
   - Both support revisions via replaceable events
   - Both use `d` tag for unique identity

3. **Differentiation via Tags**
   - Use `["content-type", "heritage"]` vs `["content-type", "shop"]`
   - Filter queries by content-type tag
   - Enables future "browse all contributions" features

## Event Structure

### Heritage Contribution Event (Kind 30023)

```javascript
{
  "kind": 30023,
  "tags": [
    ["d", "unique-heritage-id-123"],
    ["content-type", "heritage"],        // Differentiates from shop
    ["title", "Navajo Weaving Technique"],
    ["category", "textiles"],            // Shared categories with shop
    ["heritage-type", "craft"],          // Heritage-specific
    ["time-period", "living-tradition"], // Heritage-specific
    ["source-type", "elder-teaching"],   // Heritage-specific
    ["region", "north-america"],         // From regions config
    ["country", "united-states"],        // From countries config
    ["language", "Navajo (Diné bizaad)"],
    ["community", "Diné (Navajo)"],
    ["contributor-role", "practitioner"],
    ["knowledge-keeper", "Elder Mary Begay"],
    ["t", "culture-bridge-heritage-contribution"], // System tag (hidden from users)
    ["t", "weaving"],                    // User tags (visible)
    ["t", "navajo"],
    ["t", "textile"],
    ["image", "https://blossom.server/abc123.jpg"],
    ["video", "https://blossom.server/def456.mp4"]
  ],
  "content": JSON.stringify({
    description: "Traditional Navajo weaving technique..."
  }),
  "created_at": 1727654400,
  "pubkey": "npub1abc...",
  "sig": "..."
}
```

### Shop Product Event (Kind 30023) - For Comparison

```javascript
{
  "kind": 30023,
  "tags": [
    ["d", "unique-product-id-456"],
    ["content-type", "shop"],            // Differentiates from heritage
    ["title", "Hand-woven Navajo Rug"],
    ["category", "textiles"],
    ["price", "500000"],                 // Shop-specific (sats)
    ["currency", "USD"],                 // Shop-specific
    ["t", "navajo"],
    ["t", "rug"],
    ["image", "https://blossom.server/xyz789.jpg"]
  ],
  "content": JSON.stringify({
    description: "Beautiful hand-woven rug..."
  }),
  "created_at": 1727654400,
  "pubkey": "npub1abc...",
  "sig": "..."
}
```

## Tag Mapping

### System Tags (Auto-added, Hidden from Users)
- `["t", "culture-bridge-heritage-contribution"]` - System identifier tag
  - Automatically added to all heritage events
  - Used for querying/filtering heritage contributions
  - Hidden from users in the UI (filtered in tagFilter.ts)
  - Similar to `culture-bridge-shop` for shop products

### Heritage-Specific Tags
- `["content-type", "heritage"]` - Always present, identifies as heritage
- `["heritage-type", "craft|oral-tradition|ceremony|..."]` - Type of heritage
- `["time-period", "ancient|living-tradition|..."]` - Historical context
- `["source-type", "elder-teaching|family|..."]` - Source of knowledge
- `["contributor-role", "practitioner|elder|..."]` - User's relationship
- `["knowledge-keeper", "name"]` - Original knowledge keeper (optional)

### Shared Tags (Same as Shop)
- `["d", "unique-id"]` - Unique identifier
- `["title", "..."]` - Title of contribution
- `["category", "art|textiles|..."]` - From shared categories
- `["language", "..."]` - Language (optional)
- `["community", "..."]` - Community/group (optional)
- `["region", "africa|asia|..."]` - Geographic region
- `["country", "kenya|japan|..."]` - Country
- `["t", "tag"]` - User-added searchable keywords (visible)
- `["image", "url"]` - Image attachments
- `["video", "url"]` - Video attachments
- `["audio", "url"]` - Audio attachments

### Shop-Specific Tags (Not used in Heritage)
- `["price", "sats"]` - Price in satoshis
- `["currency", "USD|EUR|..."]` - Display currency
- `["shipping", "..."]` - Shipping info
- `["location", "..."]` - Physical location

## Query Patterns

### Fetch All Heritage Contributions
```typescript
const filter = {
  kinds: [30023],
  "#t": ["culture-bridge-heritage-contribution"], // Primary filter using system tag
  "#content-type": ["heritage"]  // Secondary verification
};
```

### Fetch User's Heritage Contributions
```typescript
const filter = {
  kinds: [30023],
  authors: [userPubkey],
  "#t": ["culture-bridge-heritage-contribution"]
};
```

### Fetch by Heritage Type
```typescript
const filter = {
  kinds: [30023],
  "#t": ["culture-bridge-heritage-contribution"],
  "#heritage-type": ["craft"]
};
```

### Fetch by Region/Country
```typescript
const filter = {
  kinds: [30023],
  "#t": ["culture-bridge-heritage-contribution"],
  "#region": ["africa"],
  "#country": ["kenya"]
};
```

### Fetch All Contributions (Shop + Heritage)
```typescript
const filter = {
  kinds: [30023],
  "#t": ["culture-bridge-shop", "culture-bridge-heritage-contribution"] // Both system tags
};
```

## Code Reuse Strategy

### Services to Reuse As-Is
1. **NostrEventService**
   - `createEvent()` - Generic event creation
   - `signEvent()` - Event signing
   - `publishToRelays()` - Relay publishing
   - ✅ Already generic, works for any kind 30023

2. **MediaBusinessService**
   - `uploadToBlossomServer()` - File uploads
   - `getMediaUrls()` - URL generation
   - ✅ Already works for all media types

3. **GenericRelayService**
   - `connect()` - Relay connections
   - `publish()` - Event publishing
   - `subscribe()` - Event subscriptions
   - ✅ Protocol-level, kind-agnostic

### Services to Adapt (Copy Pattern)
1. **ShopBusinessService → HeritageBusinessService**
   - Copy query patterns
   - Change filter to include `"#content-type": ["heritage"]`
   - Adapt event parsing for heritage fields
   - Keep same revision/deletion logic

2. **useShopPublishing → useHeritagePublishing**
   - Copy hook structure
   - Modify form data → event tag mapping
   - Add heritage-specific validation
   - Keep same upload/publish workflow

### New Components Needed
1. **Heritage Types** (`/src/types/heritage.ts`)
   ```typescript
   export interface HeritageContributionData {
     title: string;
     category: string;
     heritageType: string;
     description: string;
     language?: string;
     community?: string;
     region: string;
     country: string;
     timePeriod: string;
     sourceType: string;
     contributorRole: string;
     knowledgeKeeperContact?: string;
     attachments: MediaAttachment[];
     tags: string[];
   }
   ```

2. **Heritage Service** (`/src/services/business/HeritageBusinessService.ts`)
   - Based on ShopBusinessService pattern
   - Heritage-specific queries
   - Event parsing for heritage fields

3. **Heritage Hook** (`/src/hooks/useHeritagePublishing.ts`)
   - Based on useShopPublishing pattern
   - Heritage form validation
   - Tag mapping for heritage fields

## Implementation Phases

### Phase 1: Publishing (Current Focus)
- [x] Heritage form UI complete
- [ ] Create heritage TypeScript types
- [ ] Create useHeritagePublishing hook
- [ ] Integrate hook into HeritageContributionForm
- [ ] Test full submission workflow

### Phase 2: My Contributions
- [ ] Create HeritageBusinessService
- [ ] Fetch user's heritage contributions
- [ ] Display in grid layout
- [ ] Add edit/delete actions

### Phase 3: Browse & Explore
- [ ] Create heritage explore page
- [ ] Filter by heritage type, region, period
- [ ] Search functionality
- [ ] Detail view page

### Phase 4: Advanced Features
- [ ] Combined shop + heritage browse
- [ ] Cross-content search
- [ ] Related contributions
- [ ] Community features

## Benefits of This Approach

✅ **Code Efficiency**
- Reuse 80% of existing Nostr infrastructure
- Single event type to maintain
- Shared query optimization

✅ **User Experience**
- Consistent contribution workflow
- Separate but familiar interfaces (/my-shop vs /my-contributions)
- Familiar edit/delete patterns
- Clear separation of shop products and heritage content

✅ **Flexibility**
- Easy to add new content types
- Logically separate in UI, technically unified in Nostr
- Future-proof for new features

✅ **Nostr Compatibility**
- Standard replaceable events (NIP-33)
- Works with existing relay infrastructure
- Compatible with other Nostr clients

## Next Steps

1. Create `/src/types/heritage.ts` with TypeScript interfaces
2. Create `/src/hooks/useHeritagePublishing.ts` based on shop pattern
3. Update HeritageContributionForm to use the publishing hook
4. Test full workflow: form → validation → media upload → event creation → relay publishing
5. Verify events appear correctly in Nostr relays

---

*Document Version: 1.0*  
*Last Updated: September 30, 2025*  
*Decision: Use Kind 30023 with content-type differentiation*
