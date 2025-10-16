/**
 * messaging.ts
 * Type definitions for messaging system (NIP-17 gift-wrapped messages)
 */

import type { NostrEvent } from './nostr';

/**
 * Conversation between two users
 */
export interface Conversation {
  /** Public key of the other user */
  pubkey: string;
  
  /** Display name or npub of the other user */
  displayName?: string;
  
  /** Avatar URL of the other user */
  avatar?: string;
  
  /** Last message in the conversation */
  lastMessage?: Message;
  
  /** Timestamp of last message */
  lastMessageAt: number;
  
  /** Context (product/heritage) that started the conversation */
  context?: ConversationContext;
  
  /** Number of unread messages */
  unreadCount?: number;
  
  /** Timestamp when conversation was last viewed */
  lastViewedAt?: number;
}

/**
 * Individual message in a conversation
 */
export interface Message {
  /** Message ID (event ID of the kind 14 rumor) */
  id: string;
  
  /** Public key of the sender */
  senderPubkey: string;
  
  /** Public key of the recipient */
  recipientPubkey: string;
  
  /** Decrypted message content */
  content: string;
  
  /** Timestamp when message was created */
  createdAt: number;
  
  /** Context (product/heritage reference) */
  context?: ConversationContext;
  
  /** Whether this message was sent by current user */
  isSent?: boolean;
  
  /** Temporary ID for optimistic UI (before event published) */
  tempId?: string;
}

/**
 * Message metadata (for internal use)
 */
export interface MessageMetadata {
  /** Kind 1059 gift-wrapped event */
  giftWrap: NostrEvent;
  
  /** Kind 1059 seal (decrypted from gift wrap) */
  seal?: NostrEvent;
  
  /** Kind 14 rumor (decrypted from seal) */
  rumor?: Message;
  
  /** Whether decryption succeeded */
  decrypted: boolean;
  
  /** Error message if decryption failed */
  error?: string;
}

/**
 * Conversation context - reference to product or heritage content
 */
export interface ConversationContext {
  /** Type of content */
  type: 'product' | 'heritage';
  
  /** Content ID (d tag) */
  id: string;
  
  /** Content title */
  title?: string;
  
  /** Content image URL */
  imageUrl?: string;
}

/**
 * Message sending result
 */
export interface SendMessageResult {
  /** Whether send was successful */
  success: boolean;
  
  /** Message (with ID populated if successful) */
  message?: Message;
  
  /** Error message if failed */
  error?: string;
}
