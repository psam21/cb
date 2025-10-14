# Reusability Opportunities & Generic Services

## Purpose

This document identifies patterns that repeat across features and proposes generic, reusable implementations to maximize code reuse and minimize duplication.

---

## 🎯 Core Principle

**"Write once, use everywhere"** - If 3+ features need the same logic, create a generic service/hook.

---

## 📊 Current Reusability Assessment

### ✅ Excellent Reusability (Already Implemented)

| Component | Pattern | Reused By |
|---|---|---|
| `GenericEventService.createNIP23Event()` | Kind 30023 event creation | Products, Heritage, **Orders** |
| `GenericRelayService.queryEvents()` | Relay queries | All content queries |
| `GenericRelayService.publishEvent()` | Event publishing | All event types |
| `GenericMessageService` (NIP-17) | Encrypted DMs | Messages, **Shipping Address**, **Order Confirmations** |
| `MediaBusinessService` | Attachment validation | Products, Heritage, all media uploads |
| `ProfileBusinessService` | Kind 0 metadata | Profile editing, contributor profiles |

### 🟡 Partial Reusability (Can Be Improved)

| Current Approach | Problem | Opportunity |
|---|---|---|
| Separate hooks: `useOrderHistory`, `useSellerOrders`, `useContributorProfile` | Duplicate query logic | Create `useNostrQuery(kind, filters)` |
| Separate services: `CommentEventService`, `ReactionEventService`, `RepostEventService` | Duplicate simple event creation | Extend `GenericEventService` with `createSimpleEvent()` |
| Separate subscription logic in each hook | Duplicate WebSocket handling | Create `useNostrSubscription(filters)` |
| Manual tag building in each service | Inconsistent tag patterns | Create `TagBuilder` utility |

### 🔴 Missing Reusability (High Priority)

| Feature | Duplicated Pattern | Proposed Generic Solution |
|---|---|---|
| Comments, Reactions, Reposts, Order Status | Real-time event subscription | `useNostrSubscription()` |
| Order History, Seller Orders, Contributor Profile, Culture Groups | Kind 30023 queries with filters | `useNostrQuery()` or `useContentQuery()` |
| Following Feed, Activity Feed, Trending | Content filtering + pagination | `useContentFeed(baseFilters)` |
| Comments (Kind 1), Reactions (Kind 7), Reposts (Kind 6), Order Status (Kind 1111) | Simple event creation | `GenericEventService.createInteraction()` |

---

## 🚀 Proposed Generic Services

### 1. Generic Query Hook

**File:** `/src/hooks/useNostrQuery.ts`

**Purpose:** Universal hook for querying ANY Nostr event kind with filters, pagination, loading states

**Interface:**
```typescript
export interface UseNostrQueryOptions {
  limit?: number;
  until?: number;
  since?: number;
  autoLoad?: boolean;
  onProgress?: (relay: string, count: number) => void;
}

export interface UseNostrQueryResult<T> {
  data: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
  subscribe: () => void;
  unsubscribe: () => void;
}

export function useNostrQuery<T>(
  kind: number | number[],
  filters: Partial<Filter>,
  mapper: (event: NostrEvent) => T,
  options?: UseNostrQueryOptions
): UseNostrQueryResult<T>
```

**Replaces:**
- ✅ `useOrderHistory` → `useNostrQuery(30023, { '#t': ['culture-bridge-order'], authors: [pubkey] }, mapToOrder)`
- ✅ `useSellerOrders` → `useNostrQuery(30023, { '#t': ['culture-bridge-order'], '#p': [pubkey] }, mapToOrder)`
- ✅ `useContributorProfile` → `useNostrQuery(30023, { authors: [pubkey] }, mapToHeritage)`
- ✅ `useRelatedContributors` → `useNostrQuery(30023, { '#category': [tag] }, mapToHeritage)`
- ✅ `useContributorDirectory` → `useNostrQuery(30023, {}, mapToContributor)`
- ✅ `useCultureGroup` → `useNostrQuery(30023, { '#culture': [slug] }, mapToHeritage)`

**Benefits:**
- Single implementation for all content queries
- Consistent pagination logic
- Unified error handling
- Reusable loading states
- Built-in subscription support

---

### 2. Generic Interaction Service

**File:** `/src/services/generic/GenericInteractionService.ts`

**Purpose:** Create simple Nostr events (Kind 1, 6, 7, 1111) with proper tagging

**Interface:**
```typescript
export class GenericInteractionService {
  /**
   * Create Kind 1 comment/reply
   */
  createComment(
    eventId: string,
    content: string,
    authorPubkey: string,
    replyType: 'root' | 'reply' = 'root'
  ): EventCreationResult;

  /**
   * Create Kind 7 reaction
   */
  createReaction(
    eventId: string,
    emoji: string,
    authorPubkey: string,
    targetAuthorPubkey: string
  ): EventCreationResult;

  /**
   * Create Kind 6 repost (with optional quote)
   */
  createRepost(
    eventId: string,
    authorPubkey: string,
    targetAuthorPubkey: string,
    quote?: string
  ): EventCreationResult;

  /**
   * Create Kind 1111 status update/comment
   */
  createStatusUpdate(
    eventId: string,
    status: string,
    data: Record<string, any>,
    authorPubkey: string,
    targetPubkey: string
  ): EventCreationResult;

  /**
   * Generic simple event creator
   */
  createSimpleEvent(
    kind: 1 | 6 | 7 | 1111,
    content: string,
    tags: string[][],
    pubkey: string
  ): EventCreationResult;
}
```

**Replaces:**
- ✅ `CommentEventService` → `GenericInteractionService.createComment()`
- ✅ `ReactionEventService` → `GenericInteractionService.createReaction()`
- ✅ `RepostEventService` → `GenericInteractionService.createRepost()`
- ✅ `OrderStatusService` event creation → `GenericInteractionService.createStatusUpdate()`

**Benefits:**
- Single source of truth for interaction events
- Consistent tag structure
- Validation in one place
- Easy to extend for new interaction types

---

### 3. Generic Subscription Hook

**File:** `/src/hooks/useNostrSubscription.ts`

**Purpose:** Real-time WebSocket subscription to Nostr events with auto-reconnect, deduplication

**Interface:**
```typescript
export interface UseNostrSubscriptionOptions {
  autoStart?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  deduplicate?: boolean;
}

export interface UseNostrSubscriptionResult<T> {
  events: T[];
  isConnected: boolean;
  error: string | null;
  start: () => void;
  stop: () => void;
  clear: () => void;
}

export function useNostrSubscription<T>(
  filters: Filter[],
  mapper: (event: NostrEvent) => T,
  options?: UseNostrSubscriptionOptions
): UseNostrSubscriptionResult<T>
```

**Replaces:**
- ✅ Comments real-time updates
- ✅ Reactions live count
- ✅ Notifications subscription
- ✅ Order status updates subscription
- ✅ Following feed live updates

**Benefits:**
- Single WebSocket management
- Auto-reconnect logic
- Event deduplication
- Memory leak prevention
- Consistent subscription lifecycle

---

### 4. Generic Tag Builder

**File:** `/src/utils/tagBuilder.ts`

**Purpose:** Consistent tag creation following Culture Bridge patterns

**Interface:**
```typescript
export class TagBuilder {
  private tags: string[][] = [];

  addContentType(type: 'product' | 'heritage-contribution' | 'order'): this;
  addReference(eventId: string, relay?: string, marker?: string): this;
  addPubkey(pubkey: string, relay?: string, petname?: string): this;
  addCategory(category: string): this;
  addCulture(culture: string): this;
  addRegion(region: string): this;
  addLanguage(language: string): this;
  addStatus(status: string): this;
  addCustom(key: string, value: string): this;
  build(): string[][];
  
  // Convenience methods
  static forProduct(): TagBuilder;
  static forHeritage(): TagBuilder;
  static forOrder(): TagBuilder;
  static forComment(eventId: string, authorPubkey: string): TagBuilder;
  static forReaction(eventId: string, authorPubkey: string): TagBuilder;
}
```

**Usage:**
```typescript
// Instead of manually building tags
const tags = [
  ['t', 'culture-bridge-order'],
  ['p', sellerPubkey],
  ['e', productEventId, '', 'mention']
];

// Use builder pattern
const tags = TagBuilder
  .forOrder()
  .addPubkey(sellerPubkey)
  .addReference(productEventId, '', 'mention')
  .build();
```

**Benefits:**
- Consistent tag patterns
- Type-safe tag creation
- Self-documenting code
- Easy to enforce standards

---

### 5. Base Query Service

**File:** `/src/services/business/BaseQueryService.ts`

**Purpose:** Centralized relay query orchestration with retry, caching, relay selection

**Interface:**
```typescript
export interface QueryOptions {
  limit?: number;
  until?: number;
  since?: number;
  timeout?: number;
  retries?: number;
  onProgress?: (relay: string, status: string, count: number) => void;
}

export interface QueryResult<T> {
  success: boolean;
  data: T[];
  error?: string;
  queriedRelays: string[];
  failedRelays: string[];
  totalResults: number;
}

export class BaseQueryService {
  /**
   * Query events from relays with retry and fallback
   */
  queryEvents(
    filters: Filter[],
    options?: QueryOptions
  ): Promise<QueryResult<NostrEvent>>;

  /**
   * Subscribe to events from relays
   */
  subscribeToEvents(
    filters: Filter[],
    onEvent: (event: NostrEvent) => void,
    onEOSE?: () => void
  ): { unsubscribe: () => void };

  /**
   * Query with pagination support
   */
  queryPaginated(
    filters: Filter[],
    limit: number,
    until?: number
  ): Promise<QueryResult<NostrEvent>>;
}
```

**Benefits:**
- Single relay connection management
- Consistent retry logic
- Automatic relay selection
- Query result caching
- Progress tracking

---

## 📝 Updated Strategy Documents

### Shop Purchase Flow - Reusability Highlights

| Feature | Before | After (With Generic Services) |
|---|---|---|
| **#5: Order Placement** | NEW OrderEventService | ✅ REUSE GenericEventService.createNIP23Event() |
| **#6: Shipping Address** | NEW logic | ✅ REUSE useMessageSending (NIP-17) |
| **#8: Order History** | NEW useOrderHistory | ✅ REUSE useNostrQuery(30023, filters) |
| **#9: Seller Orders** | NEW useSellerOrders | ✅ REUSE useNostrQuery(30023, filters) |
| **#10: Order Status** | NEW CommentEventService | ✅ REUSE GenericInteractionService.createStatusUpdate() |
| **#10: Status Subscription** | NEW subscription logic | ✅ REUSE useNostrSubscription([1111], filters) |

### Community Building - Reusability Highlights

| Feature | Before | After (With Generic Services) |
|---|---|---|
| **#1: Activity Feed** | NEW component | ✅ REUSE useExploreHeritage (already generic!) |
| **#2: Contributor Profiles** | NEW useContributorProfile | ✅ REUSE useNostrQuery(30023, { authors }) |
| **#3: Follow Users** | NEW ContactListEventService | ✅ REUSE GenericInteractionService (extend for Kind 3) |
| **#4: Following Feed** | NEW useFollowingFeed | ✅ REUSE useExploreHeritage + filter |
| **#5: Comments** | NEW CommentEventService | ✅ REUSE GenericInteractionService.createComment() |
| **#6: Reactions** | NEW ReactionEventService | ✅ REUSE GenericInteractionService.createReaction() |
| **#7: Related Contributors** | NEW useRelatedContributors | ✅ REUSE useNostrQuery(30023, { '#category' }) |
| **#9: Notifications** | NEW subscription | ✅ REUSE useNostrSubscription([1,3,7,14]) |
| **#10: Share/Repost** | NEW RepostEventService | ✅ REUSE GenericInteractionService.createRepost() |
| **#11: Culture Groups** | NEW useCultureGroup | ✅ REUSE useNostrQuery(30023, { '#culture' }) |

---

## 🎯 Implementation Priority

### Phase 1: Foundation (Immediate)
1. ✅ `TagBuilder` - Simple utility, high impact
2. ✅ `GenericInteractionService` - Extends existing GenericEventService pattern
3. ✅ `BaseQueryService` - Centralize relay logic

### Phase 2: Hooks (Next)
4. ✅ `useNostrQuery` - Replace all content query hooks
5. ✅ `useNostrSubscription` - Replace all real-time subscription logic

### Phase 3: Refactor (After Implementation)
6. Migrate existing hooks to use generic services
7. Remove duplicate code
8. Update documentation

---

## 📊 Impact Assessment

### Code Reduction
- **Before:** ~15 separate hooks, ~8 separate event services
- **After:** 2 generic hooks, 1 interaction service + extend existing
- **Reduction:** ~60% less code

### Maintenance
- **Before:** Bug fixes need updates in 15 places
- **After:** Bug fixes in 1 place, automatically fixes all features

### Consistency
- **Before:** Each feature might have slightly different behavior
- **After:** All features behave identically (pagination, errors, loading)

### Testing
- **Before:** Test each hook/service separately
- **After:** Test generic services once, features inherit quality

---

## ✅ Success Criteria

1. **No Duplicate Logic:** If pattern appears 2+ times, it's abstracted
2. **Battle-Tested:** All generic services follow Shop/Heritage patterns
3. **SOA Compliant:** Generic services respect layer boundaries
4. **Type Safe:** Full TypeScript support with generics
5. **Documented:** JSDoc on all public methods
6. **Tested:** Unit tests for generic services

---

## 🚨 Critical Guidelines

### When to Create Generic Service
- ✅ Pattern repeats 3+ times
- ✅ Logic is identical or nearly identical
- ✅ No business-specific logic (pure technical)

### When NOT to Create Generic Service
- ❌ Feature-specific business logic
- ❌ One-off implementation
- ❌ Premature abstraction

### Battle-Tested Requirement
- Generic services MUST follow existing proven patterns
- Reference Shop/Heritage implementations
- Maintain SOA compliance

---

_Last Updated: October 14, 2025_  
_Status: PROPOSED - Review before implementation_  
_Impact: High - Reduces codebase by ~60%, improves maintainability_
