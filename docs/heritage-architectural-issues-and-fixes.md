# Heritage System: Architectural Issues & Required Fixes

## Document Purpose
This document identifies critical architectural violations in the heritage contribution system implementation and provides a comprehensive remediation plan to align it with the established shop system patterns and SOA principles.

---

## Executive Summary

### Critical Issues Identified
1. **Tag System Inconsistency** - Heritage used different tag discovery pattern than shop
2. **SOA Violation** - Heritage bypasses business/event service layers entirely
3. **Code Duplication** - Event creation logic duplicated instead of reusing GenericEventService
4. **Dead Code** - createRevisionEvent() function exists but is never used
5. **Orphaned Utilities** - revisionFilter.ts looks for tags that are never created

### Impact
- ❌ Architectural inconsistency across content types
- ❌ Violation of DRY principles
- ❌ Maintenance burden from duplicated logic
- ❌ Potential for bugs from manual event creation
- ❌ Confusion from unused/dead code

### Resolution Status
- ✅ Tag system aligned (completed)
- ⏳ SOA violations (needs refactoring)
- ⏳ Dead code removal (planned)
- ⏳ Service layer creation (planned)

---

## Issue 1: Tag Discovery System Inconsistency

### Problem
Heritage initially used a different tag discovery pattern than the established shop system.

**Shop Pattern (Correct):**
```typescript
// Event creation
['t', 'culture-bridge-shop']

// Query filter
filters: [{ kinds: [30023], '#t': ['culture-bridge-shop'] }]
```

**Heritage Pattern (Initially Wrong):**
```typescript
// Event creation
['content-type', 'heritage']          // ❌ Different pattern
['t', 'culture-bridge-heritage-contribution']

// Query filter
filters: [{ kinds: [30023], '#content-type': ['heritage'] }]  // ❌ Different filter
```

### Root Cause
Heritage was implemented without reviewing shop's established tagging pattern. The `content-type` tag approach was invented separately, creating inconsistency.

### Fix Applied ✅
**Commit:** `fc4caa9` - "refactor(heritage): align tag system with shop pattern"

**Changes Made:**
1. **Removed** `['content-type', 'heritage']` tag from publishing
2. **Kept** `['t', 'culture-bridge-heritage-contribution']` as primary identifier
3. **Updated** all fetch queries to use `#t` filter instead of `#content-type`

**Files Modified:**
- `src/hooks/useHeritagePublishing.ts` - Removed content-type tag (line 303)
- `src/services/business/HeritageContentService.ts` - Updated filters in:
  - `fetchAllHeritage()` - Changed to `#t: ['culture-bridge-heritage-contribution']`
  - `fetchHeritageByAuthor()` - Changed to `#t: ['culture-bridge-heritage-contribution']`
  - `fetchHeritageById()` - Changed to `#t: ['culture-bridge-heritage-contribution']`
  - `deleteHeritageContribution()` - Updated deletion tag

**Result:**
```typescript
// Heritage now matches shop pattern
// Event creation
['t', 'culture-bridge-heritage-contribution']

// Query filter
filters: [{ kinds: [30023], '#t': ['culture-bridge-heritage-contribution'] }]
```

---

## Issue 2: Service-Oriented Architecture Violations

### Problem
Heritage completely bypasses the established SOA pattern that shop follows correctly.

### Shop Architecture (Correct ✅)

```
Layer 1: UI/Hook Layer
├─ useShopPublishing.ts
   └─ Calls: shopBusinessService.createProduct()
   
Layer 2: Business Service Layer
├─ ShopBusinessService.ts
   └─ Orchestrates: validation, media upload, event creation
   └─ Calls: nostrEventService.createProductEvent()
   
Layer 3: Event Service Layer
├─ NostrEventService.ts
   └─ Prepares: NIP-23 content, custom tags
   └─ Calls: GenericEventService.createNIP23Event()
   
Layer 4: Generic Service Layer
├─ GenericEventService.ts
   └─ Creates: Standardized Kind 30023 event structure
   └─ Returns: Unsigned event
```

**Files & Flow:**
1. `useShopPublishing.ts` (line 52) → `shopBusinessService.createProduct()`
2. `ShopBusinessService.ts` (line 195) → `nostrEventService.createProductEvent()`
3. `NostrEventService.ts` (line 102) → `createNIP23Event(nip23Content, pubkey, { tags, dTag })`
4. `GenericEventService.ts` (line 64) → Builds event with `options.tags`

### Heritage Architecture (WRONG ❌)

```
Layer 1: UI/Hook Layer
├─ useHeritagePublishing.ts
   ├─ ❌ Manually builds tags array (lines 301-338)
   ├─ ❌ Manually creates event object (lines 358-368)
   ├─ ❌ Bypasses all service layers
   └─ ❌ Directly signs and publishes
   
Layer 2: Business Service Layer
├─ HeritageContentService.ts
   └─ ❌ Only has fetch methods, NO create methods
   
Layer 3: Event Service Layer
└─ ❌ MISSING - No heritage event service exists
   
Layer 4: Generic Service Layer
└─ ❌ UNUSED - GenericEventService.createNIP23Event() is bypassed
```

**Current Heritage Flow (lines 280-380 in useHeritagePublishing.ts):**
```typescript
// ❌ WRONG: Hook directly builds event
const tags: string[][] = [
  ['d', dTag],
  ['t', 'culture-bridge-heritage-contribution'],
  ['title', data.title],
  // ... 30+ lines of manual tag building
];

const unsignedEvent: Omit<NostrEvent, 'id' | 'sig'> = {
  kind: 30023,
  pubkey,
  created_at: Math.floor(Date.now() / 1000),
  tags,
  content: markdownContent,
};

// Sign and publish directly
const signedEvent = await signEventWithSigner(unsignedEvent, signer);
await publishEvent(signedEvent);
```

### Why This Is Wrong

1. **Violates Separation of Concerns**
   - UI hook contains business logic
   - Event structure mixed with UI logic
   - No clear boundaries between layers

2. **Code Duplication**
   - Reimplements event creation that exists in GenericEventService
   - Duplicates Kind 30023 structure, timestamp generation, event shape

3. **Bypasses Centralized Validation**
   - GenericEventService has `validateEventForSigning()`
   - Heritage events skip this validation
   - Risk of invalid events being published

4. **Not Reusable**
   - If another component needs to create heritage events, must duplicate logic
   - Business services should encapsulate creation for reuse

5. **Maintenance Burden**
   - Changes to event structure require updating multiple places
   - Risk of shop and heritage diverging over time

### Required Fix ⏳

**Create proper service layers:**

1. **Add to HeritageContentService.ts:**
```typescript
public async createHeritageContribution(
  data: HeritageContributionData,
  uploadedMedia: UploadedMedia[],
  signer: NostrSigner,
  existingDTag?: string
): Promise<CreateHeritageResult> {
  // Business logic orchestration
  // 1. Validate data
  // 2. Prepare heritage-specific tags
  // 3. Call event service
  // 4. Sign event
  // 5. Publish event
  // 6. Return result
}
```

2. **Option A: Create HeritageEventService.ts** (if heritage-specific logic needed)
```typescript
export class HeritageEventService {
  public createHeritageEvent(
    content: HeritageContent,
    userPubkey: string,
    options: HeritageEventOptions
  ): NostrEvent {
    // Prepare NIP-23 content
    const nip23Content = this.prepareNIP23Content(content);
    
    // Build heritage-specific tags
    const heritageTags = this.buildHeritageTags(content, options);
    
    // Call generic service
    return createNIP23Event(nip23Content, userPubkey, {
      dTag: options.dTag,
      tags: heritageTags
    });
  }
}
```

3. **Option B: Reuse NostrEventService.ts** (simpler, recommended)
```typescript
// Add to NostrEventService.ts
export async createHeritageEvent(
  heritageData: HeritageEventData,
  signer: NostrSigner,
  dTag?: string
): Promise<NIP23Event> {
  const pubkey = await signer.getPublicKey();
  
  // Prepare NIP-23 content
  const nip23Content: NIP23Content = {
    title: heritageData.title,
    summary: heritageData.description.substring(0, 200),
    content: heritageData.description,
    // ... other NIP-23 fields
  };
  
  // Build heritage tags
  const heritageTags = [
    ['t', 'culture-bridge-heritage-contribution'],
    ['title', heritageData.title],
    ['category', heritageData.category],
    // ... all heritage tags
  ];
  
  // Use generic service
  const eventResult = createNIP23Event(nip23Content, pubkey, {
    dTag,
    tags: heritageTags
  });
  
  // Sign the event
  const signingResult = await genericSignEvent(eventResult.event!, signer);
  
  return signingResult.signedEvent as NIP23Event;
}
```

4. **Refactor useHeritagePublishing.ts:**
```typescript
// ✅ CORRECT: Hook calls business service
const publishHeritage = async (data, existingDTag) => {
  // UI state management only
  setPublishing(true);
  setProgress({ step: 'validating', progress: 10, ... });
  
  // Call business service (proper layer)
  const result = await heritageContentService.createHeritageContribution(
    data,
    uploadedMedia,
    signer,
    existingDTag
  );
  
  // Handle result (UI layer concern)
  if (result.success) {
    setProgress({ step: 'complete', progress: 100, ... });
  }
  
  return result;
};
```

**Files to Create/Modify:**
- [ ] `src/services/business/HeritageContentService.ts` - Add `createHeritageContribution()` method
- [ ] `src/services/nostr/NostrEventService.ts` - Add `createHeritageEvent()` method (or create HeritageEventService.ts)
- [ ] `src/hooks/useHeritagePublishing.ts` - Remove manual event building, call service instead

---

## Issue 3: Dead Code - createRevisionEvent()

### Problem
The `createRevisionEvent()` function exists but is completely unused - it's dead code.

### Analysis Results

**Function Location:**
- `src/services/generic/GenericEventService.ts` (lines 144-216)
- Exported wrapper function (lines 659-660)

**Usage Search Results:**
```
Total occurrences: 6 (all in GenericEventService.ts)
External imports: 0
Function calls: 0
```

**Why It's Unused:**

Both shop and heritage implement "revisions" using **NIP-33's parameterized replaceable event pattern**:
1. Create event with `d` tag (identifier)
2. For updates: Create new event with **same** `d` tag
3. Nostr relays automatically replace old event with new one
4. No need for separate revision tracking

**What createRevisionEvent() Would Do (if used):**
```typescript
// Would create separate events with revision tags
const revisionEvent = {
  kind: 30023,
  tags: [
    ['d', originalDTag],  // Same d tag
    ['r', originalEventId],  // ❌ Revision reference (never created)
    ['t', 'culture-bridge-shop'],  // Hardcoded for shop
    // ... other tags
  ]
};
```

**Orphaned Code That Depends On It:**
- `src/utils/revisionFilter.ts` - Looks for `'r:'` tags that are never created
  - Used in: `/app/shop/page.tsx` and `/app/my-shop/page.tsx`
  - Current behavior: Does nothing useful (no `'r:'` tags exist)
  - Falls through to timestamp-based grouping

### Required Fix ⏳

**Option B: Complete Cleanup (Recommended)**

1. **Delete createRevisionEvent() from GenericEventService.ts:**
   - Remove method (lines 144-216): ~73 lines
   - Remove export wrapper (lines 659-660): 2 lines

2. **Simplify/Remove revisionFilter.ts:**
   - Option 2a: Remove entirely if shop follows heritage's dTag grouping pattern
   - Option 2b: Simplify to only dTag-based grouping, remove `'r:'` tag logic

**Files to Modify:**
- [ ] `src/services/generic/GenericEventService.ts` - Delete createRevisionEvent()
- [ ] `src/utils/revisionFilter.ts` - Simplify or remove

---

## Issue 4: Update/Revision Pattern Inconsistency

### Problem
Shop and heritage handle updates differently, but neither uses the intended revision system.

### Shop Update Pattern

**Current Implementation:**
```typescript
// ShopBusinessService.updateProductWithAttachments() - line 804
const updatedEvent = await nostrEventService.createProductEvent(
  mergedData,
  signer,
  originalProduct.dTag  // ✅ Reuses dTag
);
```

**Flow:**
1. Fetch original product
2. Merge updated data with original
3. Create new event with **same dTag**
4. Publish (Nostr replaces old event)

**No dTag Grouping:**
- Shop doesn't group events by dTag when fetching
- Relies on Nostr relays to return only latest for each dTag
- Uses `revisionFilter.ts` which doesn't work (no `'r:'` tags)

### Heritage Update Pattern

**Current Implementation:**
```typescript
// useHeritagePublishing.ts - line 290
const dTag = existingDTag || `heritage_${Date.now()}_${Math.random()...}`;

// Reuses dTag for updates, generates new for creation
```

**Flow:**
1. Form receives `existingDTag` prop for edits
2. Reuses same dTag
3. Creates new event (manually built) with same dTag
4. Publish (Nostr replaces old event)

**Has dTag Grouping:**
- Heritage DOES group events by dTag when fetching
- `HeritageContentService.fetchAllHeritage()` - lines 380-395:
```typescript
// Group events by dTag and get latest for each
const eventsByDTag = new Map<string, HeritageNostrEvent>();

queryResult.events.forEach(event => {
  const dTag = event.tags.find(t => t[0] === 'd')?.[1];
  if (!dTag) return;
  
  const existing = eventsByDTag.get(dTag);
  if (!existing || event.created_at > existing.created_at) {
    eventsByDTag.set(dTag, event);
  }
});
```

### Correct Pattern (NIP-33 Replaceable Events)

**What NIP-33 Provides:**
- Kind 30023 with `d` tag is a parameterized replaceable event
- Relays store only the **latest** event for each `d` tag value
- Automatic replacement - no manual grouping needed

**Correct Implementation:**
1. ✅ Create with `['d', uniqueId]`
2. ✅ Update with same `['d', uniqueId]`
3. ✅ Rely on relay to return only latest
4. ❌ Don't need client-side grouping (heritage does this unnecessarily)
5. ❌ Don't need `'r:'` tags (createRevisionEvent intended this)

### Required Fix ⏳

**Align both systems:**

1. **Remove unnecessary dTag grouping from heritage:**
   - Heritage's grouping is redundant (NIP-33 handles this)
   - Can simplify fetch logic

2. **Document the pattern clearly:**
   - Both systems should rely on NIP-33 replacement
   - No client-side filtering needed

---

## Issue 5: Missing Documentation & Comments

### Problem
The codebase lacks clear documentation explaining:
- Why different approaches were taken
- How the revision/update system works
- The intended architecture patterns

### Required Fix ⏳

**Add comprehensive documentation:**

1. **Architecture Decision Records (ADRs):**
   - Document why NIP-33 replacement pattern was chosen
   - Explain tag discovery strategy
   - Document SOA layer responsibilities

2. **Code Comments:**
   - Add JSDoc to all service methods
   - Explain NIP-33 replaceable event pattern
   - Document tag structure and purpose

3. **Update existing docs:**
   - `docs/heritage-contribution-system.md` - Add architecture section
   - `docs/heritage-nostr-integration.md` - Document event creation flow
   - Create `docs/nostr-event-patterns.md` - Explain NIP-33, tagging, etc.

---

## Remediation Plan

### Phase 1: Dead Code Removal ⏳
**Priority: HIGH** | **Effort: LOW** | **Risk: NONE**

- [ ] Delete `createRevisionEvent()` from GenericEventService.ts
- [ ] Simplify/remove `revisionFilter.ts`
- [ ] Verify build succeeds
- [ ] Commit: "refactor: remove unused createRevisionEvent and orphaned revision filter"

**Estimated Time:** 30 minutes

### Phase 2: Heritage Service Layer Creation ⏳
**Priority: HIGH** | **Effort: MEDIUM** | **Risk: MEDIUM**

- [ ] Add `createHeritageContribution()` to HeritageContentService.ts
- [ ] Create `createHeritageEvent()` in NostrEventService.ts (or create HeritageEventService.ts)
- [ ] Refactor useHeritagePublishing.ts to call service instead of building events
- [ ] Test create and edit flows
- [ ] Commit: "refactor(heritage): align with SOA pattern using service layers"

**Estimated Time:** 2-3 hours

### Phase 3: Pattern Alignment ⏳
**Priority: MEDIUM** | **Effort: LOW** | **Risk: LOW**

- [ ] Remove unnecessary dTag grouping from heritage (rely on NIP-33)
- [ ] Ensure both shop and heritage trust relay replacement
- [ ] Verify update flows work correctly
- [ ] Commit: "refactor: simplify event fetching using NIP-33 replacement"

**Estimated Time:** 1 hour

### Phase 4: Documentation ⏳
**Priority: MEDIUM** | **Effort: MEDIUM** | **Risk: NONE**

- [ ] Create Architecture Decision Records
- [ ] Add JSDoc comments to all services
- [ ] Update heritage documentation
- [ ] Create Nostr patterns guide
- [ ] Commit: "docs: add comprehensive architecture and pattern documentation"

**Estimated Time:** 2-3 hours

### Phase 5: Testing & Validation ⏳
**Priority: HIGH** | **Effort: MEDIUM** | **Risk: NONE**

- [ ] Test heritage create flow
- [ ] Test heritage edit flow
- [ ] Test heritage delete flow
- [ ] Test shop create flow (regression)
- [ ] Test shop edit flow (regression)
- [ ] Verify all queries return correct data
- [ ] Commit: "test: validate heritage and shop flows after refactoring"

**Estimated Time:** 1-2 hours

---

## Total Effort Estimate
**Total Time:** 6.5 - 10.5 hours

---

## Success Criteria

### Architecture Alignment ✅
- [ ] Heritage uses GenericEventService.createNIP23Event()
- [ ] Heritage has proper business service layer
- [ ] Heritage follows same SOA pattern as shop
- [ ] No dead code exists
- [ ] No orphaned utilities

### Code Quality ✅
- [ ] No duplicated event creation logic
- [ ] All services properly layered
- [ ] Centralized validation used
- [ ] Reusable service methods

### Documentation ✅
- [ ] Architecture patterns documented
- [ ] Code comments added
- [ ] Decision rationale captured
- [ ] Maintenance guide created

### Functional ✅
- [ ] All create/edit/delete flows work
- [ ] Both shop and heritage work correctly
- [ ] No regressions introduced
- [ ] Build succeeds with no errors

---

## Lessons Learned

### What Went Wrong
1. **No Architecture Review:** Heritage was built without reviewing established shop patterns
2. **Shortcut Taking:** Developer bypassed service layers for speed, creating technical debt
3. **Incomplete Implementation:** HeritageContentService only has fetch methods, not create
4. **No Code Reuse:** Didn't check if GenericEventService already had needed functionality
5. **Lack of Documentation:** No architectural guidance led to inconsistent implementations

### Prevention Measures
1. **Mandatory Architecture Review:** New features must review existing patterns first
2. **Document Patterns:** Create and maintain architectural decision records
3. **Code Reuse First:** Check for existing services before implementing new ones
4. **Layering Enforcement:** Hooks must not contain business logic or event creation
5. **Comprehensive Testing:** Include architectural compliance in review checklist

---

## References

### Related Files
- `src/hooks/useHeritagePublishing.ts` - Heritage hook (needs refactoring)
- `src/hooks/useShopPublishing.ts` - Shop hook (correct pattern)
- `src/services/business/HeritageContentService.ts` - Heritage business service (incomplete)
- `src/services/business/ShopBusinessService.ts` - Shop business service (reference)
- `src/services/nostr/NostrEventService.ts` - Event creation service
- `src/services/generic/GenericEventService.ts` - Generic NIP-23 event creation
- `src/utils/revisionFilter.ts` - Orphaned utility

### Related Commits
- `fc4caa9` - "refactor(heritage): align tag system with shop pattern" ✅
- Pending: Dead code removal
- Pending: Service layer refactoring
- Pending: Documentation updates

### Related Documentation
- `docs/heritage-contribution-system.md` - System overview
- `docs/heritage-nostr-integration.md` - Nostr integration details
- `docs/project-rules-and-memories.md` - Project patterns

---

## Conclusion

The heritage system has **critical architectural violations** that must be addressed:

1. ✅ **Tag system** - Fixed (aligned with shop pattern)
2. ❌ **SOA violations** - Must refactor to use proper service layers
3. ❌ **Dead code** - Must remove createRevisionEvent() and orphaned utilities
4. ❌ **Code duplication** - Must use GenericEventService instead of manual building
5. ❌ **Documentation** - Must document patterns and decisions

**Immediate Action Required:**
Execute remediation plan in phases 1-5 to bring heritage system into architectural compliance with established shop patterns.

**Total Effort:** ~6.5-10.5 hours
**Priority:** HIGH - Technical debt compounds over time

---

*Document created: October 1, 2025*
*Status: Remediation plan defined, execution pending*
