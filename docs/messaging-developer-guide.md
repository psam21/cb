# Messaging System Developer Guide

Quick reference for using the messaging system in Culture Bridge.

---

## Quick Start

### 1. Add a "Contact" button to your page

```tsx
import { useRouter } from 'next/navigation';

export function YourComponent({ authorPubkey, itemId, itemTitle, itemImage }) {
  const router = useRouter();

  const handleContact = () => {
    const params = new URLSearchParams({
      recipient: authorPubkey,
      context: `your-type:${itemId}`,
      contextTitle: itemTitle,
      ...(itemImage && { contextImage: itemImage }),
    });
    
    router.push(`/messages?${params.toString()}`);
  };

  return (
    <button onClick={handleContact}>
      Contact Author
    </button>
  );
}
```

### 2. Use messaging hooks in your component

```tsx
import { useConversations } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import { useMessageSending } from '@/hooks/useMessageSending';

export function MyMessagingComponent() {
  // Get all conversations
  const { conversations, isLoading } = useConversations();
  
  // Get messages for a specific conversation
  const { messages } = useMessages({ otherPubkey: 'hex-pubkey-here' });
  
  // Send a message
  const { sendMessage, isSending } = useMessageSending();
  
  const handleSend = async (content: string) => {
    await sendMessage('recipient-pubkey', content);
  };
  
  return (/* your UI */);
}
```

---

## Hooks API Reference

### useConversations()

Load and manage conversation list with real-time updates.

```typescript
const {
  conversations,        // Conversation[] - List of all conversations
  isLoading,           // boolean - Loading state
  error,               // string | null - Error message
  refreshConversations, // () => Promise<void> - Reload conversations
  getConversation,     // (pubkey: string) => Conversation | undefined
  updateConversationWithMessage, // (message: Message) => void
} = useConversations();
```

**Example**:
```tsx
const { conversations, isLoading } = useConversations();

if (isLoading) return <Spinner />;

return (
  <div>
    {conversations.map(conv => (
      <div key={conv.pubkey}>
        {conv.displayName || conv.pubkey.slice(0, 8)}
        <p>{conv.lastMessage}</p>
      </div>
    ))}
  </div>
);
```

---

### useMessages(options)

Load and manage messages for a specific conversation.

```typescript
const {
  messages,         // Message[] - List of messages
  isLoading,       // boolean - Loading state
  error,           // string | null - Error message
  refreshMessages, // () => Promise<void> - Reload messages
  addMessage,      // (message: Message) => void - Add/update message
  removeMessage,   // (messageId: string) => void - Remove message
} = useMessages({ 
  otherPubkey: string | null,  // Required: Conversation partner's pubkey
  limit?: number               // Optional: Max messages to load (default: 50)
});
```

**Example**:
```tsx
const [selectedPubkey, setSelectedPubkey] = useState<string | null>(null);
const { messages, isLoading } = useMessages({ otherPubkey: selectedPubkey });

return (
  <div>
    {messages.map(msg => (
      <div key={msg.id}>
        <strong>{msg.senderPubkey.slice(0, 8)}</strong>
        <p>{msg.content}</p>
      </div>
    ))}
  </div>
);
```

---

### useMessageSending()

Send messages with optimistic UI support.

```typescript
const {
  sendMessage,  // Send function (see below)
  isSending,    // boolean - Sending state
  sendError,    // string | null - Error message
  clearError,   // () => void - Clear error
} = useMessageSending();

// Send message signature:
await sendMessage(
  recipientPubkey: string,
  content: string,
  context?: ConversationContext,
  options?: {
    onOptimisticUpdate?: (tempMessage: Message) => void,
    onSuccess?: (message: Message) => void,
    onError?: (error: string, tempId?: string) => void,
  }
);
```

**Example with optimistic UI**:
```tsx
const { sendMessage, isSending } = useMessageSending();
const { addMessage } = useMessages({ otherPubkey });

const handleSend = async (content: string) => {
  await sendMessage(
    recipientPubkey,
    content,
    { type: 'product', id: productId, title: productTitle },
    {
      onOptimisticUpdate: (tempMessage) => {
        // Show immediately
        addMessage(tempMessage);
      },
      onSuccess: (message) => {
        console.log('Sent!', message.id);
      },
      onError: (error) => {
        console.error('Failed:', error);
      },
    }
  );
};
```

---

## Components API Reference

### ConversationList

Display a list of conversations.

```typescript
<ConversationList
  conversations={conversations}
  selectedPubkey={selectedPubkey}
  onSelectConversation={(pubkey) => setSelectedPubkey(pubkey)}
  isLoading={isLoading}
/>
```

**Props**:
- `conversations`: `Conversation[]` - List of conversations
- `selectedPubkey`: `string | null` - Currently selected conversation
- `onSelectConversation`: `(pubkey: string) => void` - Selection handler
- `isLoading`: `boolean` - Loading state

---

### MessageThread

Display message history for a conversation.

```typescript
<MessageThread
  messages={messages}
  currentUserPubkey={currentUserPubkey}
  otherUserPubkey={otherUserPubkey}
  isLoading={isLoading}
/>
```

**Props**:
- `messages`: `Message[]` - List of messages
- `currentUserPubkey`: `string | null` - Current user's pubkey
- `otherUserPubkey`: `string | null` - Other user's pubkey
- `isLoading`: `boolean` - Loading state

**Features**:
- Auto-scrolls to bottom on new messages
- Shows sent messages on right (blue)
- Shows received messages on left (white)
- Displays "Sending..." for optimistic messages

---

### MessageComposer

Input field for composing messages.

```typescript
<MessageComposer
  onSend={handleSend}
  disabled={!signer}
  isSending={isSending}
  placeholder="Type a message..."
/>
```

**Props**:
- `onSend`: `(content: string) => Promise<void>` - Send handler
- `disabled?`: `boolean` - Disable input
- `isSending?`: `boolean` - Show sending state
- `placeholder?`: `string` - Placeholder text

**Features**:
- Auto-resizing textarea
- Enter to send, Shift+Enter for new line
- Validates empty messages
- Clears input after send

---

## Business Service API

For advanced usage, you can call the business service directly.

```typescript
import { 
  sendMessage, 
  getConversations, 
  getMessages,
  subscribeToMessages 
} from '@/services/business/MessagingBusinessService';
import { useNostrSigner } from '@/hooks/useNostrSigner';

const { signer } = useNostrSigner();

// Send a message
const result = await sendMessage(
  'recipient-pubkey',
  'Hello!',
  signer,
  { type: 'product', id: 'abc123', title: 'Cool Product' }
);

// Get conversations
const conversations = await getConversations(signer);

// Get messages
const messages = await getMessages('other-pubkey', signer, 50);

// Subscribe to real-time messages
const unsubscribe = subscribeToMessages(signer, (message) => {
  console.log('New message:', message);
});

// Clean up subscription
unsubscribe();
```

---

## Types Reference

### Conversation

```typescript
interface Conversation {
  pubkey: string;                    // Conversation partner's pubkey
  displayName?: string;              // Partner's display name (if available)
  avatar?: string;                   // Partner's avatar URL (if available)
  lastMessage?: string;              // Preview of last message
  lastMessageAt?: number;            // Timestamp of last message (seconds)
  context?: ConversationContext;     // Optional context (product/heritage)
}
```

### Message

```typescript
interface Message {
  id: string;                        // Message ID (event ID)
  senderPubkey: string;              // Sender's pubkey
  recipientPubkey: string;           // Recipient's pubkey
  content: string;                   // Message content (plaintext after decryption)
  createdAt: number;                 // Message timestamp (seconds)
  context?: ConversationContext;     // Optional context (product/heritage)
  isSent?: boolean;                  // True if sent by current user
  tempId?: string;                   // Temporary ID for optimistic UI
}
```

### ConversationContext

```typescript
interface ConversationContext {
  type: 'product' | 'heritage';      // Context type
  id: string;                        // Item ID
  title?: string;                    // Item title
  imageUrl?: string;                 // Item image URL
}
```

---

## Navigation Patterns

### Direct Navigation to Messages

```typescript
import { useRouter } from 'next/navigation';

const router = useRouter();

// Navigate to messages with recipient
router.push('/messages?recipient=hex-pubkey');

// Navigate with context
const params = new URLSearchParams({
  recipient: 'hex-pubkey',
  context: 'product:abc123',
  contextTitle: 'Cool Product',
  contextImage: 'https://example.com/image.jpg',
});
router.push(`/messages?${params.toString()}`);
```

### URL Parameters

- `recipient` (required): Hex pubkey of conversation partner
- `context` (optional): Format `type:id` (e.g., `product:abc123`)
- `contextTitle` (optional): Display title for context
- `contextImage` (optional): Image URL for context

---

## Adding Context to Messages

Context helps users understand what they're discussing.

### Product Context

```typescript
const context = {
  type: 'product' as const,
  id: product.id,
  title: product.title,
  imageUrl: product.imageUrl,
};

await sendMessage(recipientPubkey, content, context);
```

### Heritage Context

```typescript
const context = {
  type: 'heritage' as const,
  id: heritage.id,
  title: heritage.title,
  imageUrl: heritage.imageUrl,
};

await sendMessage(recipientPubkey, content, context);
```

### Display Context in UI

```tsx
{message.context && (
  <div className="text-xs text-gray-500">
    {message.context.type === 'product' ? '🛍️' : '🏛️'}
    {message.context.title}
  </div>
)}
```

---

## Error Handling

### Hook-level Errors

```tsx
const { conversations, error } = useConversations();

if (error) {
  return <div>Error: {error}</div>;
}
```

### Send Errors

```tsx
const { sendMessage, sendError, clearError } = useMessageSending();

const handleSend = async (content: string) => {
  await sendMessage(recipientPubkey, content);
};

return (
  <div>
    <button onClick={() => handleSend('Hello')}>Send</button>
    {sendError && (
      <div className="error">
        {sendError}
        <button onClick={clearError}>Dismiss</button>
      </div>
    )}
  </div>
);
```

---

## Best Practices

### 1. Always check for signer

```tsx
const { signer } = useNostrSigner();

if (!signer) {
  return <div>Please sign in to send messages</div>;
}
```

### 2. Use optimistic UI for better UX

```tsx
await sendMessage(recipientPubkey, content, undefined, {
  onOptimisticUpdate: (tempMessage) => {
    // Show immediately
    addMessage(tempMessage);
  },
  onError: (error, tempId) => {
    // Remove on failure
    removeMessage(tempId!);
  },
});
```

### 3. Clean up subscriptions

```tsx
useEffect(() => {
  const unsubscribe = subscribeToMessages(signer, handleNewMessage);
  return () => unsubscribe(); // Clean up on unmount
}, [signer]);
```

### 4. Provide context when available

```tsx
// Good: Provides context
await sendMessage(recipientPubkey, 'Interested!', {
  type: 'product',
  id: productId,
  title: productTitle,
});

// OK: No context
await sendMessage(recipientPubkey, 'Hello!');
```

### 5. Handle loading states

```tsx
const { messages, isLoading } = useMessages({ otherPubkey });

if (isLoading) {
  return <Spinner />;
}

return <MessageList messages={messages} />;
```

---

## Common Patterns

### Full Messaging Interface

```tsx
export function MessagingInterface() {
  const { signer } = useNostrSigner();
  const [selectedPubkey, setSelectedPubkey] = useState<string | null>(null);
  
  const { conversations } = useConversations();
  const { messages, addMessage } = useMessages({ otherPubkey: selectedPubkey });
  const { sendMessage, isSending } = useMessageSending();

  const handleSend = async (content: string) => {
    if (!selectedPubkey) return;
    
    await sendMessage(selectedPubkey, content, undefined, {
      onOptimisticUpdate: addMessage,
    });
  };

  return (
    <div className="flex">
      <ConversationList
        conversations={conversations}
        selectedPubkey={selectedPubkey}
        onSelectConversation={setSelectedPubkey}
      />
      <div className="flex-1 flex flex-col">
        <MessageThread messages={messages} />
        <MessageComposer onSend={handleSend} isSending={isSending} />
      </div>
    </div>
  );
}
```

### Contact Button Integration

```tsx
export function ProductDetail({ product }) {
  const router = useRouter();

  const handleContactSeller = () => {
    const params = new URLSearchParams({
      recipient: product.sellerPubkey,
      context: `product:${product.id}`,
      contextTitle: product.title,
      contextImage: product.imageUrl,
    });
    
    router.push(`/messages?${params.toString()}`);
  };

  return (
    <div>
      <h1>{product.title}</h1>
      <button onClick={handleContactSeller}>
        Contact Seller
      </button>
    </div>
  );
}
```

---

## Troubleshooting

### Messages not loading

1. Check if user is signed in: `const { signer } = useNostrSigner()`
2. Check browser console for errors
3. Verify relay connections in Network tab
4. Check if NIP-07 extension is installed and enabled

### Messages not sending

1. Verify signer is available
2. Check if user approved the signing request (extension popup)
3. Verify recipient pubkey is valid hex format
4. Check relay connectivity

### Real-time updates not working

1. Verify subscription is active (check Network → WS tab)
2. Check if component is properly cleaning up subscriptions
3. Verify relay supports WebSocket connections

### Optimistic UI issues

1. Ensure `tempId` is unique (use UUID)
2. Check if `onOptimisticUpdate` is being called
3. Verify `addMessage` is updating state correctly
4. Check if error handler is removing failed messages

---

## Testing

### Manual Testing Checklist

- [ ] Sign in with NIP-07 extension
- [ ] Load conversation list
- [ ] Select a conversation
- [ ] View message history
- [ ] Send a message
- [ ] Receive a message in real-time
- [ ] Navigate via "Contact" button
- [ ] URL parameters work correctly
- [ ] Context displays in messages
- [ ] Optimistic UI shows "Sending..."
- [ ] Error handling works
- [ ] Signing out clears data

### With Mock Data

```typescript
const mockConversations: Conversation[] = [
  {
    pubkey: 'abc123...',
    displayName: 'Alice',
    lastMessage: 'Hello!',
    lastMessageAt: Date.now() / 1000,
  },
];

const mockMessages: Message[] = [
  {
    id: '1',
    senderPubkey: 'abc123...',
    recipientPubkey: 'xyz789...',
    content: 'Hello!',
    createdAt: Date.now() / 1000,
  },
];
```

---

## Additional Resources

- **NIP-17 Spec**: https://github.com/nostr-protocol/nips/blob/master/17.md
- **NIP-44 Spec**: https://github.com/nostr-protocol/nips/blob/master/44.md
- **Implementation Summary**: `/docs/messaging-implementation-summary.md`
- **Requirements Doc**: `/docs/requirements/messaging-system.md`

---

## Support

For issues or questions:

1. Check this guide first
2. Review implementation summary
3. Check browser console for errors
4. Verify NIP-07 extension is working
5. File an issue with reproduction steps
