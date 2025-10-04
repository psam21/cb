# Messaging System Requirements

**Status**: 📋 Requirements - Ready for Implementation  
**Priority**: High  
**Effort**: Large (5-7 days)  
**Date Created**: October 5, 2025  
**Battle-Tested Reference**: Shop Product Flow

---

## Executive Summary

Enable direct messaging between users across the platform using NIP-17 (gift-wrapped private messages) with NIP-44 encryption. Users can initiate conversations from product and heritage contribution pages, with a centralized messaging interface showing conversation list and message threads.

---

## User Stories

### Primary Flow

**As a buyer**, I want to message a seller about their product, so I can ask questions before purchasing.

**As a contributor**, I want to respond to messages about my heritage contributions, so I can provide additional context.

**As a user**, I want to see all my conversations in one place, so I can manage communications easily.

---

## Protocol Specifications

### NIP-17: Gift-Wrapped Private Messages

**Event Kinds**:
- **Kind 14**: Chat messages (gift-wrapped DM)
- **Kind 1059**: Seal (encrypted wrapper)

**Encryption**: NIP-44 (Encrypted Payloads v2)
- Algorithm: secp256k1 ECDH + HKDF + ChaCha20 + HMAC-SHA256
- Security: Cure53 audited (December 2023)
- Format: Version byte + nonce + ciphertext + MAC

**Message Flow**:
```
1. User creates message content
2. Encrypt with NIP-44 (sender → recipient)
3. Wrap in Kind 14 seal
4. Gift-wrap in Kind 1059 (addressed to recipient)
5. Publish to relays
6. Recipient decrypts gift-wrap → seal → message
```

**Relay Support**:
- Shugur Network: ✅ NIP-17, NIP-44
- Netstr.io: ✅ NIP-17, NIP-44
- Other relays: NIP-04 fallback (deprecated but widely supported)

---

## Architecture (SOA Compliant)

### Service Layer Hierarchy

```
Page Layer (UI)
  └─ /src/app/messages/page.tsx
       ↓ uses

Component Layer
  ├─ /src/components/messaging/ConversationList.tsx
  ├─ /src/components/messaging/MessageThread.tsx
  └─ /src/components/messaging/MessageComposer.tsx
       ↓ uses

Hook Layer (State Management)
  ├─ /src/hooks/useConversations.ts
  ├─ /src/hooks/useMessages.ts
  └─ /src/hooks/useMessageSending.ts
       ↓ calls

Business Service Layer (Orchestration)
  └─ /src/services/business/MessagingBusinessService.ts
       ├─ queryConversations()
       ├─ queryMessages(recipientPubkey)
       ├─ sendMessage(recipientPubkey, content, context)
       └─ markConversationRead(pubkey)
       ↓ calls

Event Service Layer (Nostr Events)
  └─ /src/services/nostr/NostrEventService.ts
       ├─ createDirectMessage()  // NEW METHOD
       ├─ createGiftWrappedMessage()  // NEW METHOD
       └─ parseDirectMessage()  // NEW METHOD
       ↓ calls

Generic Service Layer (Reusable)
  ├─ /src/services/generic/GenericRelayService.ts
  │    ├─ queryEvents()  // EXISTING
  │    ├─ publishEvent()  // EXISTING
  │    └─ subscribeToEvents()  // NEW METHOD for real-time
  │
  └─ /src/services/generic/EncryptionService.ts  // NEW
       ├─ encryptNIP44(content, recipientPubkey)
       ├─ decryptNIP44(encrypted, senderPubkey)
       ├─ createGiftWrap(event, recipientPubkey)
       └─ unwrapGift(giftWrappedEvent)
```

**✅ SOA Compliance**: Strict layer separation, no shortcuts

---

## Entry Points

### 1. Shop Product Page (`/shop/[id]`)

**Location**: `/src/app/shop/[id]/page.tsx`

**Trigger**: "Contact Seller" button (already exists via `ShopProductDetail`)

**Current Implementation**:
```typescript
contactAction = {
  id: 'contact-seller',
  label: 'Contact Seller',
  href: contactHref,  // Currently: nostr:npub... or mailto:
  type: 'primary'
}
```

**Change Required**:
```typescript
contactAction = {
  id: 'contact-seller',
  label: 'Contact Seller',
  onClick: () => router.push(`/messages?to=${product.author}&context=product:${product.id}`),
  type: 'primary'
}
```

**Context Metadata**:
```json
{
  "type": "product",
  "productId": "product-1234-xyz",
  "productTitle": "Coastcaller - The Island Bell"
}
```

---

### 2. Heritage Contribution Page (`/heritage/[id]`)

**Location**: `/src/app/heritage/[id]/page.tsx`

**Trigger**: "Contact Contributor" button (NEW - needs to be added)

**Implementation**:
```typescript
// Add to HeritageContentService actions array
contactAction = {
  id: 'contact-contributor',
  label: 'Contact Contributor',
  onClick: () => router.push(`/messages?to=${contribution.author}&context=heritage:${contribution.id}`),
  type: 'secondary'
}
```

**Context Metadata**:
```json
{
  "type": "heritage",
  "contributionId": "contribution-5678-abc",
  "contributionTitle": "Navajo Weaving Patterns"
}
```

---

## UI/UX Specifications

### Messaging Page (`/messages`)

**Layout**: Two-panel horizontal split

```
┌─────────────────────────────────────────────────────────┐
│  Header (Back to Home, Title: "Messages")              │
├──────────────────┬──────────────────────────────────────┤
│                  │                                      │
│  Conversation    │        Message Thread                │
│  List            │                                      │
│  (Left Panel)    │        (Right Panel)                 │
│                  │                                      │
│  - Alice         │   Alice: Hey, is this still...       │
│  - Bob           │   You: Yes, it's available!          │
│  - Carol   *NEW* │   Alice: Great! How much...          │
│                  │                                      │
│                  │   [Message Composer]                 │
│                  │   ┌──────────────────────┐           │
│                  │   │ Type a message...    │ [Send]    │
│                  │   └──────────────────────┘           │
│                  │                                      │
└──────────────────┴──────────────────────────────────────┘
```

**Responsive Behavior**:
- Desktop: Side-by-side panels
- Mobile: Stack vertically, show one panel at a time

---

### Left Panel: Conversation List

**Component**: `/src/components/messaging/ConversationList.tsx`

**Data Structure**:
```typescript
interface Conversation {
  pubkey: string;              // Other user's pubkey
  npub: string;                // Other user's npub
  displayName?: string;        // From profile metadata
  lastMessage: {
    content: string;
    timestamp: number;
    fromMe: boolean;
  };
  context?: {                  // Optional context from entry point
    type: 'product' | 'heritage';
    id: string;
    title: string;
  };
}
```

**UI Elements**:
- Avatar (generated from pubkey if no profile image)
- Display name (fallback to truncated npub)
- Last message preview (truncated to 60 chars)
- Timestamp (relative: "5m ago", "2h ago", "Yesterday")
- Context tag (if conversation started from product/heritage)

**Sorting**: Most recent message first

**Empty State**: "No conversations yet. Start messaging from product or heritage pages."

---

### Right Panel: Message Thread

**Component**: `/src/components/messaging/MessageThread.tsx`

**Data Structure**:
```typescript
interface Message {
  id: string;                  // Event ID
  content: string;             // Decrypted message text
  timestamp: number;           // created_at from event
  fromMe: boolean;             // Compare event.pubkey with current user
  senderPubkey: string;
  status?: 'sending' | 'sent' | 'failed';  // For optimistic UI
}
```

**UI Elements**:
- Message bubbles (different styles for sent vs received)
- Timestamps (show on hover or every 5 messages)
- Sender name (if not fromMe)
- Markdown rendering (bold, italic, links, code blocks)
- Auto-scroll to bottom on new message
- "Load More" button for pagination (if > 100 messages)

**Empty State**: 
- If new conversation: "Start the conversation below"
- If no conversation selected: "Select a conversation to view messages"

---

### Message Composer

**Component**: `/src/components/messaging/MessageComposer.tsx`

**Features**:
- Multi-line textarea (auto-expand up to 5 lines)
- Shift+Enter = new line
- Enter = send message
- Send button (disabled if empty or sending)
- Character counter (optional, show at 500+ chars)
- Markdown preview toggle (optional Phase 2)

**Validation**:
- Min length: 1 character (trimmed)
- Max length: 10,000 characters
- No empty/whitespace-only messages

**Loading States**:
- Sending: Show spinner in send button
- Optimistic: Add message to thread immediately with "sending" status
- Success: Update status to "sent"
- Error: Show inline error, allow retry

---

## Data Flow

### Sending a Message

```
1. User types message in MessageComposer
2. User clicks Send
     ↓
3. MessageComposer calls hook.sendMessage(recipientPubkey, content, context)
     ↓
4. useMessageSending hook:
   - Validates input
   - Sets loading state
   - Calls MessagingBusinessService.sendMessage()
     ↓
5. MessagingBusinessService:
   - Gets current user's signer
   - Calls NostrEventService.createGiftWrappedMessage()
     ↓
6. NostrEventService:
   - Calls EncryptionService.encryptNIP44()
   - Creates Kind 14 seal event
   - Calls EncryptionService.createGiftWrap() → Kind 1059
   - Returns unsigned gift-wrapped event
     ↓
7. MessagingBusinessService:
   - Signs event with user's signer
   - Calls GenericRelayService.publishEvent()
     ↓
8. GenericRelayService:
   - Publishes to all relays (prioritize Shugur, Netstr.io)
   - Returns success/failure
     ↓
9. useMessageSending hook:
   - Updates message status to "sent"
   - Clears composer
   - Triggers message list refresh
```

---

### Receiving Messages (Real-time)

```
1. useMessages hook subscribes on mount
     ↓
2. GenericRelayService.subscribeToEvents()
   - Opens WebSocket subscriptions to relays
   - Filter: Kind 1059 (gift-wrapped) where p tag = current user pubkey
     ↓
3. Relay sends EVENT message
     ↓
4. GenericRelayService fires onEvent callback
     ↓
5. useMessages hook:
   - Calls MessagingBusinessService.parseIncomingMessage()
     ↓
6. MessagingBusinessService:
   - Calls NostrEventService.parseDirectMessage()
     ↓
7. NostrEventService:
   - Calls EncryptionService.unwrapGift()
   - Calls EncryptionService.decryptNIP44()
   - Extracts message content
   - Returns parsed Message object
     ↓
8. useMessages hook:
   - Adds message to state
   - Updates conversation list (bump to top)
   - Triggers re-render
```

---

### Loading Conversation List

```
1. useConversations hook calls loadConversations()
     ↓
2. MessagingBusinessService.queryConversations()
   - Calls GenericRelayService.queryEvents()
   - Filter: Kind 1059, p tag = current user
   - Limit: Last 100 events
     ↓
3. GenericRelayService fetches from all relays
     ↓
4. MessagingBusinessService:
   - Decrypts all messages
   - Groups by sender pubkey
   - Gets latest message per conversation
   - Fetches profile metadata for each sender
   - Returns Conversation[] array
     ↓
5. useConversations hook:
   - Sorts by most recent
   - Updates state
   - Triggers re-render
```

---

### Loading Message Thread

```
1. User clicks conversation in list
     ↓
2. useMessages hook calls loadMessages(recipientPubkey)
     ↓
3. MessagingBusinessService.queryMessages(recipientPubkey)
   - Calls GenericRelayService.queryEvents()
   - Filter 1: Kind 1059, p tag = current user, author = recipient
   - Filter 2: Kind 1059, p tag = recipient, author = current user
   - Sorts by timestamp DESC
     ↓
4. GenericRelayService fetches from all relays
     ↓
5. MessagingBusinessService:
   - Decrypts all messages
   - Merges both directions (sent + received)
   - Sorts chronologically
   - Returns Message[] array
     ↓
6. useMessages hook:
   - Updates state
   - Scrolls to bottom
   - Starts WebSocket subscription for new messages
```

---

## File Structure (New Files)

### Services

```
/src/services/
├── generic/
│   ├── EncryptionService.ts              [NEW]
│   └── GenericRelayService.ts            [MODIFIED - add subscribeToEvents]
│
├── nostr/
│   └── NostrEventService.ts              [MODIFIED - add messaging methods]
│
└── business/
    └── MessagingBusinessService.ts       [NEW]
```

### Hooks

```
/src/hooks/
├── useConversations.ts                   [NEW]
├── useMessages.ts                        [NEW]
└── useMessageSending.ts                  [NEW]
```

### Components

```
/src/components/messaging/
├── ConversationList.tsx                  [NEW]
├── ConversationItem.tsx                  [NEW]
├── MessageThread.tsx                     [NEW]
├── MessageBubble.tsx                     [NEW]
└── MessageComposer.tsx                   [NEW]
```

### Pages

```
/src/app/
└── messages/
    └── page.tsx                          [NEW]
```

### Types

```
/src/types/
└── messaging.ts                          [NEW]
    - Conversation
    - Message
    - MessageContext
    - EncryptedPayload
```

---

## Service Layer Details

### EncryptionService (Generic Layer)

**Location**: `/src/services/generic/EncryptionService.ts`

**Purpose**: Handle NIP-44 encryption/decryption and NIP-17 gift-wrapping

**Methods**:

```typescript
class EncryptionService {
  // NIP-44 Encryption
  encryptNIP44(
    content: string,
    recipientPubkey: string,
    senderPrivateKey?: string  // From signer
  ): Promise<string>;

  // NIP-44 Decryption
  decryptNIP44(
    encrypted: string,
    senderPubkey: string,
    recipientPrivateKey?: string  // From signer
  ): Promise<string>;

  // NIP-17 Gift Wrapping
  createGiftWrap(
    sealEvent: Event,
    recipientPubkey: string
  ): Promise<UnsignedEvent>;  // Kind 1059

  // NIP-17 Unwrapping
  unwrapGift(
    giftWrappedEvent: Event
  ): Promise<Event>;  // Returns Kind 14 seal

  // NIP-17 Seal Creation
  createSeal(
    content: string,
    recipientPubkey: string
  ): Promise<UnsignedEvent>;  // Kind 14
}
```

**Dependencies**:
- `@noble/secp256k1` (already in project)
- `@noble/hashes` (already in project)
- NIP-44 implementation (need to add)

---

### MessagingBusinessService (Business Layer)

**Location**: `/src/services/business/MessagingBusinessService.ts`

**Purpose**: Orchestrate messaging operations

**Methods**:

```typescript
class MessagingBusinessService {
  // Query all conversations for current user
  async queryConversations(): Promise<Conversation[]>;

  // Query messages with specific user
  async queryMessages(
    recipientPubkey: string,
    limit?: number
  ): Promise<Message[]>;

  // Send message
  async sendMessage(
    recipientPubkey: string,
    content: string,
    context?: MessageContext
  ): Promise<{ success: boolean; eventId?: string; error?: string }>;

  // Parse incoming gift-wrapped message
  async parseIncomingMessage(
    giftWrappedEvent: Event
  ): Promise<Message | null>;

  // Get user profile for conversation list
  async getUserProfile(pubkey: string): Promise<{
    displayName?: string;
    picture?: string;
    npub: string;
  }>;
}
```

**Singleton Pattern**: Follows Shop/Heritage pattern

---

### NostrEventService Extensions (Event Layer)

**Location**: `/src/services/nostr/NostrEventService.ts`

**New Methods**:

```typescript
// Add to existing NostrEventService class

async createGiftWrappedMessage(
  recipientPubkey: string,
  content: string,
  context?: MessageContext
): Promise<UnsignedEvent> {
  // 1. Encrypt content with NIP-44
  const encrypted = await EncryptionService.encryptNIP44(content, recipientPubkey);
  
  // 2. Create Kind 14 seal
  const seal = await EncryptionService.createSeal(encrypted, recipientPubkey);
  
  // 3. Create Kind 1059 gift wrap
  const giftWrap = await EncryptionService.createGiftWrap(seal, recipientPubkey);
  
  // 4. Add context as custom tag (optional)
  if (context) {
    giftWrap.tags.push(['context', JSON.stringify(context)]);
  }
  
  return giftWrap;
}

async parseDirectMessage(
  giftWrappedEvent: Event
): Promise<Message> {
  // 1. Unwrap gift (Kind 1059 → Kind 14)
  const seal = await EncryptionService.unwrapGift(giftWrappedEvent);
  
  // 2. Decrypt seal content
  const content = await EncryptionService.decryptNIP44(
    seal.content,
    seal.pubkey
  );
  
  // 3. Parse context if exists
  const contextTag = seal.tags.find(t => t[0] === 'context');
  const context = contextTag ? JSON.parse(contextTag[1]) : undefined;
  
  return {
    id: giftWrappedEvent.id,
    content,
    timestamp: seal.created_at,
    senderPubkey: seal.pubkey,
    context
  };
}
```

---

### GenericRelayService Extensions (Generic Layer)

**Location**: `/src/services/generic/GenericRelayService.ts`

**New Method**:

```typescript
// Add to existing GenericRelayService class

subscribeToEvents(
  filters: NostrFilter[],
  onEvent: (event: Event) => void,
  onEose?: () => void
): () => void {  // Returns unsubscribe function
  const subscriptionId = `sub-${Date.now()}`;
  const connections = [];
  
  RELAYS.forEach(relay => {
    const ws = new WebSocket(relay.url);
    
    ws.onopen = () => {
      ws.send(JSON.stringify(['REQ', subscriptionId, ...filters]));
    };
    
    ws.onmessage = (msg) => {
      const [type, subId, event] = JSON.parse(msg.data);
      
      if (type === 'EVENT' && subId === subscriptionId) {
        onEvent(event);
      }
      
      if (type === 'EOSE' && subId === subscriptionId && onEose) {
        onEose();
      }
    };
    
    connections.push(ws);
  });
  
  // Return cleanup function
  return () => {
    connections.forEach(ws => {
      ws.send(JSON.stringify(['CLOSE', subscriptionId]));
      ws.close();
    });
  };
}
```

---

## Hook Specifications

### useConversations

**Location**: `/src/hooks/useConversations.ts`

**State**:
```typescript
{
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
}
```

**Methods**:
```typescript
{
  loadConversations: () => Promise<void>;
  refreshConversations: () => Promise<void>;
}
```

**Behavior**:
- Loads on mount
- Polls every 30 seconds (optional, can disable if WebSocket handles updates)
- Sorts by most recent

---

### useMessages

**Location**: `/src/hooks/useMessages.ts`

**State**:
```typescript
{
  messages: Message[];
  loading: boolean;
  error: string | null;
  activeConversation: string | null;  // Recipient pubkey
}
```

**Methods**:
```typescript
{
  loadMessages: (recipientPubkey: string) => Promise<void>;
  setActiveConversation: (pubkey: string) => void;
}
```

**Behavior**:
- Loads messages when conversation selected
- Subscribes to WebSocket for real-time updates
- Auto-scrolls to bottom on new message
- Cleans up WebSocket on unmount or conversation change

---

### useMessageSending

**Location**: `/src/hooks/useMessageSending.ts`

**State**:
```typescript
{
  sending: boolean;
  error: string | null;
}
```

**Methods**:
```typescript
{
  sendMessage: (
    recipientPubkey: string,
    content: string,
    context?: MessageContext
  ) => Promise<void>;
}
```

**Behavior**:
- Validates input
- Handles loading states
- Implements optimistic UI (add message before confirmation)
- Handles errors with retry option

---

## Implementation Phases

### Phase 1: Infrastructure (No UI)
**Duration**: 1-2 days

**Tasks**:
- [ ] Create `EncryptionService.ts` with NIP-44 implementation
- [ ] Add `subscribeToEvents()` to `GenericRelayService`
- [ ] Add messaging methods to `NostrEventService`
- [ ] Create `MessagingBusinessService.ts`
- [ ] Create types in `messaging.ts`
- [ ] Write unit tests for encryption/decryption
- [ ] Test message creation and parsing (console logs)

**Success Criteria**:
- Can encrypt/decrypt messages
- Can create gift-wrapped events
- Can parse incoming messages
- All services build without errors

---

### Phase 2: Messaging Page UI
**Duration**: 2 days

**Tasks**:
- [ ] Create `useConversations` hook
- [ ] Create `useMessages` hook
- [ ] Create `useMessageSending` hook
- [ ] Create `ConversationList` component
- [ ] Create `MessageThread` component
- [ ] Create `MessageComposer` component
- [ ] Create `/messages/page.tsx`
- [ ] Style with Tailwind (match existing design system)
- [ ] Test conversation loading
- [ ] Test message sending/receiving
- [ ] Test real-time updates

**Success Criteria**:
- Messaging page renders
- Can view conversation list
- Can view message thread
- Can send messages
- Can receive messages in real-time

---

### Phase 3: Entry Point Integration
**Duration**: 1 day

**Tasks**:
- [ ] Modify `ShopProductDetail` actions
- [ ] Add "Contact Contributor" to `HeritageContentService`
- [ ] Update routing to pass context
- [ ] Parse context in messaging page
- [ ] Display context tags in conversation list
- [ ] Test "Contact Seller" flow
- [ ] Test "Contact Contributor" flow

**Success Criteria**:
- Can message seller from product page
- Can message contributor from heritage page
- Context appears in conversation list
- Context persists in messages

---

### Phase 4: Polish & Optimization
**Duration**: 1 day

**Tasks**:
- [ ] Add markdown rendering for messages
- [ ] Add message timestamps
- [ ] Add "Load More" pagination
- [ ] Add empty states
- [ ] Add error handling UI
- [ ] Add loading skeletons
- [ ] Mobile responsive testing
- [ ] Cross-browser testing
- [ ] Performance optimization (memoization, virtual scrolling)
- [ ] Accessibility audit (keyboard navigation, screen readers)

**Success Criteria**:
- Smooth UX on all devices
- Proper error messages
- Fast performance (< 100ms typing latency)
- Accessible to all users

---

### Phase 5: Testing & Deployment
**Duration**: 1 day

**Tasks**:
- [ ] End-to-end testing (two users messaging)
- [ ] Test with multiple relays (including failures)
- [ ] Test encryption edge cases
- [ ] Test long messages (10k chars)
- [ ] Test rapid sending
- [ ] Test WebSocket reconnection
- [ ] User acceptance testing
- [ ] Documentation updates
- [ ] Deploy to production
- [ ] Monitor for issues

**Success Criteria**:
- All user flows work end-to-end
- No console errors
- Messages encrypt/decrypt correctly
- Real-time updates work reliably
- User verification complete

---

## Security Considerations

### Encryption
- ✅ Use NIP-44 (Cure53 audited)
- ✅ Never store private keys (always use signer)
- ✅ Validate all decrypted content (prevent XSS)
- ✅ Use gift-wrapping to hide metadata

### Privacy
- ✅ Gift-wrapped messages hide sender/recipient from relays
- ✅ No plaintext content ever sent to relays
- ⚠️ Metadata leakage: Relay can see IP, timing patterns
- ⚠️ No forward secrecy (compromise of key = all past messages)

### Input Validation
- ✅ Sanitize message content before rendering
- ✅ Validate pubkeys are valid hex/npub
- ✅ Limit message length (10k chars)
- ✅ Rate limiting (TBD - relay-level)

### Error Handling
- ✅ Graceful degradation if encryption fails
- ✅ Clear error messages (don't expose crypto details)
- ✅ Retry logic for failed sends
- ✅ Fallback to older NIPs if NIP-17 unsupported

---

## Edge Cases

### User Has No Signer
**Scenario**: User lands on messaging page without NIP-07 extension

**Handling**:
- Show prominent message: "Connect wallet to send messages"
- Display "Sign In" button → redirects to `/signin`
- Disable message composer
- Still allow viewing received messages (if already decrypted/cached)

---

### Recipient Never Reads Message
**Scenario**: User sends message, recipient never comes online

**Handling**:
- Message shows as "sent" (published to relays)
- No read receipts (privacy-preserving)
- Relay-dependent persistence (user trusts relay to store)

---

### Relay Goes Down Mid-Conversation
**Scenario**: WebSocket disconnects, messages lost

**Handling**:
- GenericRelayService auto-reconnects
- Re-subscribe to filters on reconnection
- Query recent messages to catch up
- Show connection status indicator (optional)

---

### User Switches Devices
**Scenario**: User sends message on desktop, checks on mobile

**Handling**:
- Both devices query same relays
- Messages appear on both (same private key = same decryption)
- No sync required (all data on relays)

---

### Malformed Encrypted Data
**Scenario**: Relay or attacker sends corrupted message

**Handling**:
- EncryptionService throws error on decryption failure
- MessagingBusinessService catches error
- Logs warning, excludes message from list
- Shows "[Unable to decrypt message]" placeholder (optional)

---

### Very Long Conversation (1000+ messages)
**Scenario**: Two users have extensive conversation history

**Handling**:
- Query with limit (default 100 messages)
- "Load More" button fetches older messages
- Virtual scrolling for performance
- Consider pagination by time ranges

---

## Dependencies

### New npm Packages

```json
{
  "@noble/ciphers": "^0.4.0",       // ChaCha20 for NIP-44
  "@noble/hashes": "^1.3.3",        // HKDF for NIP-44 (already exists)
  "@noble/secp256k1": "^2.0.0"      // ECDH for NIP-44 (already exists)
}
```

### Existing Dependencies (Reuse)
- `nostr-tools` - Event validation, npub encoding
- `@noble/secp256k1` - Already used for signatures
- `@noble/hashes` - Already used for hashing

---

## Performance Targets

- **Conversation List Load**: < 2 seconds (8 relays, 100 events)
- **Message Thread Load**: < 1 second (single conversation, 100 messages)
- **Message Send**: < 500ms (encryption + relay publish)
- **Real-time Delivery**: < 200ms (WebSocket latency)
- **Typing Latency**: < 100ms (UI responsiveness)
- **Memory Usage**: < 50MB (1000 messages loaded)

---

## Success Metrics

### Functional
- ✅ Users can send messages from product/heritage pages
- ✅ Messages encrypt/decrypt correctly 100% of time
- ✅ Real-time updates work within 200ms
- ✅ Conversation list updates on new message
- ✅ Context tags persist and display correctly

### Non-Functional
- ✅ No console errors in production
- ✅ Mobile responsive (< 768px width)
- ✅ Keyboard accessible (tab navigation works)
- ✅ Works on Safari, Chrome, Firefox
- ✅ Graceful degradation without NIP-07 signer

### User Acceptance
- ✅ "Contact Seller" flows smoothly
- ✅ Message composer is intuitive
- ✅ Conversation list is easy to navigate
- ✅ User can find their messages easily

---

## Open Questions (Resolve Before Implementation)

1. **Message Retention**: Should we cache decrypted messages in localStorage for offline viewing?
   - Pros: Faster load, works offline
   - Cons: Security risk if device compromised

2. **Profile Caching**: Cache user profiles (display names, avatars)?
   - Pros: Faster conversation list rendering
   - Cons: Stale data if user updates profile

3. **Attachment Support**: Phase 2 feature or separate sprint?
   - Image uploads (via Blossom)
   - File attachments (PDF, etc.)

4. **Group Messaging**: Out of scope or future consideration?
   - NIP-29 (Group Chat)
   - Requires different architecture

5. **Message Search**: Should messages be searchable?
   - Local client-side search (privacy-preserving)
   - Server-side search (requires plaintext indexing - NO)

---

## References

- **NIP-04**: Encrypted Direct Messages (deprecated but fallback)
- **NIP-17**: Private Direct Messages (gift-wrapped)
- **NIP-44**: Encrypted Payloads v2
- **NIP-59**: Gift Wrap
- **Shop Reference**: `/src/services/business/ShopBusinessService.ts`
- **Heritage Reference**: `/src/services/business/HeritageContentService.ts`

---

## Approval Checklist

Before implementation begins:

- [ ] User approves architecture (SOA layers)
- [ ] User approves UI/UX design (two-panel layout)
- [ ] User approves entry points (Shop + Heritage only for Phase 1)
- [ ] User approves security approach (NIP-17 + NIP-44)
- [ ] User approves implementation phases (5 phases, 5-7 days)
- [ ] User approves file structure (new services, hooks, components)
- [ ] Dependencies approved (`@noble/ciphers` addition)
- [ ] Open questions resolved

---

**Next Steps**: 
1. Get user approval on this requirements document
2. Create implementation branch: `feature/messaging-system`
3. Begin Phase 1: Infrastructure (EncryptionService + service layers)
4. Daily check-ins with user for progress updates
5. Test each phase before proceeding to next

---

_This is a comprehensive, SOA-compliant messaging system that follows the battle-tested Shop pattern. All architectural decisions preserve security, privacy, and maintainability._
