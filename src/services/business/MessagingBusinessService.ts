/**
 * MessagingBusinessService.ts
 * Business Layer - Messaging Operations
 * 
 * Handles private messaging between users using NIP-17 gift-wrapped messages.
 * SOA-compliant: Business Layer → Event Layer → Generic Layer
 * 
 * @see docs/requirements/messaging-system.md
 */

import { logger } from '../core/LoggingService';
import { NostrSigner, NostrEvent } from '../../types/nostr';
import { Conversation, Message, ConversationContext, SendMessageResult } from '../../types/messaging';
import { nostrEventService } from '../nostr/NostrEventService';
import { queryEvents, publishEvent, subscribeToEvents } from '../generic/GenericRelayService';
import { EncryptionService } from '../generic/EncryptionService';
import { AppError } from '../../errors/AppError';
import { ErrorCode, HttpStatus, ErrorCategory, ErrorSeverity } from '../../errors/ErrorTypes';
import { profileService } from './ProfileBusinessService';
import { MessageCacheService } from './MessageCacheService';
import { getDisplayNameFromNIP05 } from '@/utils/nip05';

export class MessagingBusinessService {
  private static instance: MessagingBusinessService;
  private cache: MessageCacheService;

  private constructor() {
    this.cache = MessageCacheService.getInstance();
  }

  public static getInstance(): MessagingBusinessService {
    if (!MessagingBusinessService.instance) {
      MessagingBusinessService.instance = new MessagingBusinessService();
    }
    return MessagingBusinessService.instance;
  }

  /**
   * Initialize cache with user's pubkey (call on login)
   * 
   * @param pubkey - User's Nostr public key (hex format)
   */
  public async initializeCache(pubkey: string): Promise<void> {
    try {
      await this.cache.initialize(pubkey);
      logger.info('Message cache initialized', {
        service: 'MessagingBusinessService',
        method: 'initializeCache',
      });
    } catch (error) {
      logger.error('Failed to initialize message cache', error instanceof Error ? error : new Error('Unknown error'), {
        service: 'MessagingBusinessService',
        method: 'initializeCache',
      });
      // Don't throw - cache is optional, continue without it
    }
  }

  /**
   * Clear cache (call on logout)
   */
  public async clearCache(): Promise<void> {
    try {
      await this.cache.clearCache();
      logger.info('Message cache cleared', {
        service: 'MessagingBusinessService',
        method: 'clearCache',
      });
    } catch (error) {
      logger.error('Failed to clear message cache', error instanceof Error ? error : new Error('Unknown error'), {
        service: 'MessagingBusinessService',
        method: 'clearCache',
      });
    }
  }

  /**
   * Send a gift-wrapped message to a recipient
   * 
   * NIP-17 Implementation: Send TWO gift wraps:
   * 1. One to the recipient (so they can read it)
   * 2. One to ourselves (so we can retrieve our sent messages)
   * 
   * @param recipientPubkey - Recipient's public key
   * @param content - Message content (plaintext)
   * @param signer - NIP-07 signer
   * @param context - Optional conversation context (product/heritage reference)
   * @returns SendMessageResult with success status and message details
   */
  public async sendMessage(
    recipientPubkey: string,
    content: string,
    signer: NostrSigner,
    context?: ConversationContext
  ): Promise<SendMessageResult> {
    try {
      logger.info('Sending gift-wrapped message', {
        service: 'MessagingBusinessService',
        method: 'sendMessage',
        recipientPubkey,
        hasContext: !!context,
      });

      const senderPubkey = await signer.getPublicKey();

      // Add context to message content if provided
      let messageContent = content;
      if (context) {
        const contextPrefix = `[Context: ${context.type}/${context.id}]\n\n`;
        messageContent = contextPrefix + content;
      }

      // Create gift-wrapped message to recipient
      const giftWrapToRecipient = await nostrEventService.createGiftWrappedMessage(
        recipientPubkey,
        messageContent,
        signer
      );

      // Create gift-wrapped message to ourselves (for message history persistence)
      // Gift wrap is addressed TO us (senderPubkey) so we can decrypt it
      // BUT the rumor INSIDE still shows the actual recipient (recipientPubkey)
      const giftWrapToSelf = await nostrEventService.createGiftWrappedMessage(
        senderPubkey, // Gift wrap TO ourselves (so we can unwrap it)
        messageContent,
        signer,
        recipientPubkey // BUT rumor shows the actual recipient
      );

      // Publish both gift-wrapped events to relays
      const publishResultRecipient = await publishEvent(giftWrapToRecipient, signer);
      const publishResultSelf = await publishEvent(giftWrapToSelf, signer);

      if (!publishResultRecipient.success && !publishResultSelf.success) {
        throw new AppError(
          'Failed to publish message to relays',
          ErrorCode.NOSTR_ERROR,
          HttpStatus.INTERNAL_SERVER_ERROR,
          ErrorCategory.EXTERNAL_SERVICE,
          ErrorSeverity.HIGH,
          { publishResultRecipient, publishResultSelf }
        );
      }

      // Create message object for return
      const message: Message = {
        id: giftWrapToRecipient.id,
        senderPubkey,
        recipientPubkey,
        content,
        createdAt: Math.floor(Date.now() / 1000),
        context,
        isSent: true,
      };

      logger.info('Message sent successfully', {
        service: 'MessagingBusinessService',
        method: 'sendMessage',
        messageId: message.id,
        publishedToRecipient: publishResultRecipient.publishedRelays.length,
        publishedToSelf: publishResultSelf.publishedRelays.length,
      });

      return {
        success: true,
        message,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to send message', error instanceof Error ? error : new Error(errorMessage), {
        service: 'MessagingBusinessService',
        method: 'sendMessage',
        recipientPubkey,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get all conversations for the current user
   * Queries for gift-wrapped messages (Kind 1059) addressed to user
   * 
   * Performance:
   * - Checks cache first (instant load)
   * - Returns cached data immediately
   * - Background sync for new messages using "since" filter
   * 
   * Note: We only query for messages TO us (p tag) because:
   * - Gift wraps use ephemeral keys (can't query by author)
   * - We send a copy to ourselves when sending (so sent messages appear here too)
   * 
   * @param signer - NIP-07 signer
   * @returns Array of conversations with last message details
   */
  public async getConversations(signer: NostrSigner): Promise<Conversation[]> {
    try {
      logger.info('Loading conversations', {
        service: 'MessagingBusinessService',
        method: 'getConversations',
      });

      // Ensure cache is initialized (in case user navigated directly to /messages)
      const userPubkey = await signer.getPublicKey();
      if (!this.cache.isInitialized()) {
        logger.warn('Cache not initialized, initializing now', {
          service: 'MessagingBusinessService',
          method: 'getConversations',
        });
        await this.cache.initialize(userPubkey);
      }

      // Try cache first
      console.log('[Business] 📥 Attempting to load from cache...');
      const cachedConversations = await this.cache.getConversations();
      console.log(`[Business] 📦 Cache returned ${cachedConversations.length} conversations`);
      
      if (cachedConversations.length > 0) {
        logger.info('✅ Loaded conversations from cache', {
          service: 'MessagingBusinessService',
          method: 'getConversations',
          count: cachedConversations.length,
        });

        // Background sync for new messages (don't await)
        this.syncNewMessages(signer).catch(error => {
          logger.error('Background sync failed', error instanceof Error ? error : new Error('Unknown error'), {
            service: 'MessagingBusinessService',
            method: 'getConversations',
          });
        });

        // Background profile refresh for cached conversations (don't await)
        this.refreshProfilesInBackground(cachedConversations).catch(error => {
          logger.error('Profile refresh failed', error instanceof Error ? error : new Error('Unknown error'), {
            service: 'MessagingBusinessService',
            method: 'getConversations',
          });
        });

        return cachedConversations;
      }

      // Cache miss - fetch from relays
      logger.info('Cache miss - fetching from relays', {
        service: 'MessagingBusinessService',
        method: 'getConversations',
      });

      console.log('[Business] 🌐 Fetching conversations from relays...');
      const conversations = await this.fetchConversationsFromRelays(signer);
      console.log(`[Business] 📬 Fetched ${conversations.length} conversations from relays`);

      // Cache for next time
      console.log('[Business] 💾 Saving conversations to cache...');
      await this.cache.cacheConversations(conversations);
      await this.cache.setLastSyncTime(Math.floor(Date.now() / 1000));
      console.log('[Business] ✅ Conversations saved to cache');

      // Verify cache was saved
      const verifyCache = await this.cache.getConversations();
      console.log(`[Business] 🔍 Cache verification: ${verifyCache.length} conversations now in cache`);

      return conversations;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to load conversations', error instanceof Error ? error : new Error(errorMessage), {
        service: 'MessagingBusinessService',
        method: 'getConversations',
      });

      throw error;
    }
  }

  /**
   * Background sync for new messages (since last sync)
   * Does NOT block UI - runs in background
   */
  private async syncNewMessages(signer: NostrSigner): Promise<void> {
    try {
      const lastSync = await this.cache.getLastSyncTime();
      if (lastSync === 0) {
        return; // No last sync time, skip background sync
      }

      logger.info('🔄 Background sync: fetching new messages', {
        service: 'MessagingBusinessService',
        method: 'syncNewMessages',
        since: new Date(lastSync * 1000).toISOString(),
      });

      const userPubkey = await signer.getPublicKey();

      // Fetch only messages AFTER last sync
      const filters = [
        {
          kinds: [1059],
          '#p': [userPubkey],
          since: lastSync, // Only new messages
          limit: 100,
        },
      ];

      const queryResult = await queryEvents(filters);
      if (!queryResult.success || queryResult.events.length === 0) {
        logger.info('No new messages in background sync', {
          service: 'MessagingBusinessService',
          method: 'syncNewMessages',
        });
        return;
      }

      // Decrypt and cache new messages
      const newMessages = await this.decryptGiftWraps(queryResult.events, signer);
      if (newMessages.length > 0) {
        await this.cache.cacheMessages(newMessages);
        await this.cache.setLastSyncTime(Math.floor(Date.now() / 1000));

        logger.info('✅ Background sync: cached new messages', {
          service: 'MessagingBusinessService',
          method: 'syncNewMessages',
          count: newMessages.length,
        });
      }
    } catch (error) {
      logger.error('Background sync failed', error instanceof Error ? error : new Error('Unknown error'), {
        service: 'MessagingBusinessService',
        method: 'syncNewMessages',
      });
    }
  }

  /**
   * Refresh profiles for conversations in the background
   * Attempts to enrich conversation display names using:
   * 1. Profile metadata (Kind 0)
   * 2. NIP-05 verification (fallback)
   * 
   * @param conversations - Conversations to enrich
   */
  private async refreshProfilesInBackground(conversations: Conversation[]): Promise<void> {
    try {
      logger.info('🔄 Refreshing profiles in background', {
        service: 'MessagingBusinessService',
        method: 'refreshProfilesInBackground',
        count: conversations.length,
      });

      // Refresh profiles in parallel
      await Promise.all(conversations.map(async (conversation) => {
        try {
          await this.enrichConversationProfile(conversation);
        } catch (error) {
          logger.debug('Failed to refresh profile', {
            service: 'MessagingBusinessService',
            method: 'refreshProfilesInBackground',
            pubkey: conversation.pubkey.substring(0, 8) + '...',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }));

      // Re-cache conversations with updated profiles
      await this.cache.cacheConversations(conversations);

      logger.info('✅ Profiles refreshed successfully', {
        service: 'MessagingBusinessService',
        method: 'refreshProfilesInBackground',
        enriched: conversations.filter(c => c.displayName).length,
        total: conversations.length,
      });
    } catch (error) {
      logger.error('Profile refresh failed', error instanceof Error ? error : new Error('Unknown error'), {
        service: 'MessagingBusinessService',
        method: 'refreshProfilesInBackground',
      });
    }
  }

  /**
   * Enrich a single conversation with profile information
   * Uses fallback strategy: Profile metadata → NIP-05 → npub truncation
   * 
   * @param conversation - Conversation to enrich (modified in place)
   */
  private async enrichConversationProfile(conversation: Conversation): Promise<void> {
    // Try fetching profile metadata first
    try {
      const profile = await profileService.getUserProfile(conversation.pubkey);
      if (profile) {
        conversation.displayName = profile.display_name || undefined;
        conversation.avatar = profile.picture || undefined;
        
        // If still no display name, try NIP-05 from profile
        if (!conversation.displayName && profile.nip05) {
          const nip05Name = await getDisplayNameFromNIP05(profile.nip05, conversation.pubkey);
          if (nip05Name) {
            conversation.displayName = nip05Name;
            logger.info('✅ Resolved name via NIP-05', {
              service: 'MessagingBusinessService',
              method: 'enrichConversationProfile',
              pubkey: conversation.pubkey.substring(0, 8) + '...',
              displayName: nip05Name,
            });
          }
        }
        
        return;
      }
    } catch (error) {
      logger.debug('Profile fetch failed, trying NIP-05', {
        service: 'MessagingBusinessService',
        method: 'enrichConversationProfile',
        pubkey: conversation.pubkey.substring(0, 8) + '...',
      });
    }

    // Fallback: Try NIP-05 without profile metadata
    // (Some users might have NIP-05 setup but no Kind 0 event)
    // This is less common but worth trying
    logger.debug('No profile metadata, skipping NIP-05 fallback (requires profile)', {
      service: 'MessagingBusinessService',
      method: 'enrichConversationProfile',
      pubkey: conversation.pubkey.substring(0, 8) + '...',
    });
  }

  /**
   * Fetch conversations from relays (no cache)
   * Extracted for reusability
   */
  private async fetchConversationsFromRelays(signer: NostrSigner): Promise<Conversation[]> {
    const userPubkey = await signer.getPublicKey();

      // Query for gift-wrapped messages addressed to us (includes received + sent)
      const filters = [
        {
          kinds: [1059],
          '#p': [userPubkey],  // Messages TO user (includes copies we sent to ourselves)
          limit: 100,
        },
      ];

      const queryResult = await queryEvents(filters);

      if (!queryResult.success) {
        throw new AppError(
          'Failed to query messages',
          ErrorCode.NOSTR_ERROR,
          HttpStatus.INTERNAL_SERVER_ERROR,
          ErrorCategory.EXTERNAL_SERVICE,
          ErrorSeverity.MEDIUM,
          { queryResult }
        );
      }

      // Decrypt and parse messages
      const messages = await this.decryptGiftWraps(queryResult.events, signer);

      // Group by sender to create conversations
      const conversationMap = new Map<string, Conversation>();

      for (const message of messages) {
        // Determine the "other person" in the conversation
        // Skip if both sender and recipient are the user (self-copy)
        if (message.senderPubkey === userPubkey && message.recipientPubkey === userPubkey) {
          logger.debug('Skipping self-to-self message copy', {
            service: 'MessagingBusinessService',
            method: 'getConversations',
            messageId: message.id,
          });
          continue; // Skip messages we sent to ourselves (self-copies)
        }
        
        const otherPubkey = message.senderPubkey === userPubkey ? message.recipientPubkey : message.senderPubkey;

        const existing = conversationMap.get(otherPubkey);
        if (!existing || message.createdAt > existing.lastMessageAt) {
          conversationMap.set(otherPubkey, {
            pubkey: otherPubkey,
            lastMessage: message,
            lastMessageAt: message.createdAt,
            context: message.context,
          });
        }
      }

      const conversations = Array.from(conversationMap.values())
        .sort((a, b) => b.lastMessageAt - a.lastMessageAt);

      // Enrich conversations with profiles (using fallback strategy)
      await Promise.all(conversations.map(async (conversation) => {
        await this.enrichConversationProfile(conversation);
      }));

      logger.info('Conversations loaded from relays', {
        service: 'MessagingBusinessService',
        method: 'fetchConversationsFromRelays',
        count: conversations.length,
        enriched: conversations.filter(c => c.displayName).length,
      });

      return conversations;
  }

  /**
   * Get all messages for a specific conversation
   * 
   * Performance:
   * - Checks cache first (instant load)
   * - Falls back to relay fetch if cache miss
   * - Caches fetched messages for future use
   * 
   * Note: We only query for messages TO us (p tag) because:
   * - Gift wraps use ephemeral keys (can't query by author)
   * - We send a copy to ourselves when sending (so sent messages appear here too)
   * 
   * @param otherPubkey - Public key of the other user
   * @param signer - NIP-07 signer
   * @param limit - Maximum number of messages to retrieve (default: 100)
   * @returns Array of messages sorted by timestamp (oldest first)
   */
  public async getMessages(
    otherPubkey: string,
    signer: NostrSigner,
    limit: number = 100
  ): Promise<Message[]> {
    try {
      logger.info('Loading messages for conversation', {
        service: 'MessagingBusinessService',
        method: 'getMessages',
        otherPubkey,
        limit,
      });

      // Ensure cache is initialized
      const userPubkey = await signer.getPublicKey();
      if (!this.cache.isInitialized()) {
        logger.warn('Cache not initialized, initializing now', {
          service: 'MessagingBusinessService',
          method: 'getMessages',
        });
        await this.cache.initialize(userPubkey);
      }

      // Try cache first
      const cachedMessages = await this.cache.getMessages(otherPubkey);
      if (cachedMessages.length > 0) {
        logger.info('✅ Loaded messages from cache', {
          service: 'MessagingBusinessService',
          method: 'getMessages',
          count: cachedMessages.length,
        });
        
        // Mark messages as sent or received
        cachedMessages.forEach(msg => {
          msg.isSent = msg.senderPubkey === userPubkey;
        });

        return cachedMessages;
      }

      // Cache miss - fetch from relays
      logger.info('Cache miss - fetching messages from relays', {
        service: 'MessagingBusinessService',
        method: 'getMessages',
      });

      // Query for gift-wrapped messages addressed to us (includes received + sent)
      const filters = [
        {
          kinds: [1059],
          '#p': [userPubkey],  // Messages TO user (includes copies we sent to ourselves)
          limit,
        },
      ];

      const queryResult = await queryEvents(filters);

      if (!queryResult.success) {
        throw new AppError(
          'Failed to query messages',
          ErrorCode.NOSTR_ERROR,
          HttpStatus.INTERNAL_SERVER_ERROR,
          ErrorCategory.EXTERNAL_SERVICE,
          ErrorSeverity.MEDIUM,
          { queryResult }
        );
      }

      // Decrypt and parse messages
      const allMessages = await this.decryptGiftWraps(queryResult.events, signer);

      logger.info('All decrypted messages before filtering', {
        service: 'MessagingBusinessService',
        method: 'getMessages',
        totalMessages: allMessages.length,
        otherPubkey: otherPubkey.substring(0, 8),
        userPubkey: userPubkey.substring(0, 8),
        messages: allMessages.map(m => ({
          id: m.id?.substring(0, 8),
          senderPubkey: m.senderPubkey?.substring(0, 8),
          recipientPubkey: m.recipientPubkey?.substring(0, 8),
          createdAt: m.createdAt,
          content: m.content?.substring(0, 30),
          // Categorize for debugging
          category: 
            m.senderPubkey === otherPubkey && m.recipientPubkey === userPubkey ? 'RECEIVED' :
            m.senderPubkey === userPubkey && m.recipientPubkey === otherPubkey ? 'SENT' :
            m.senderPubkey === userPubkey && m.recipientPubkey === userPubkey ? 'SELF-COPY-BUG' :
            'OTHER',
        })),
      });

      // Filter messages for this specific conversation
      // Simple filter: show messages where either:
      // 1. We received it (sender = other person, recipient = us)
      // 2. We sent it (sender = us, recipient = other person)
      // 
      // Note: Self-copies where recipientPubkey = userPubkey are excluded
      // These are from buggy Culture Bridge dev phase - not worth recovering
      const conversationMessages = allMessages
        .filter(msg => {
          // Received messages: sender is other person, recipient is us
          if (msg.senderPubkey === otherPubkey && msg.recipientPubkey === userPubkey) {
            return true;
          }
          
          // Sent messages: sender is us, recipient is other person
          // This includes:
          // - Messages from other clients (0xchat, etc.) - properly formed
          // - Messages from Culture Bridge (current fixed version) - properly formed
          if (msg.senderPubkey === userPubkey && msg.recipientPubkey === otherPubkey) {
            return true;
          }
          
          // Exclude everything else (including buggy dev-era self-copies)
          return false;
        })
        .sort((a, b) => a.createdAt - b.createdAt); // Oldest first

      // Mark messages as sent or received
      conversationMessages.forEach(msg => {
        msg.isSent = msg.senderPubkey === userPubkey;
      });

      logger.info('Messages after filtering for conversation', {
        service: 'MessagingBusinessService',
        method: 'getMessages',
        totalBeforeFilter: allMessages.length,
        totalAfterFilter: conversationMessages.length,
        sentMessages: conversationMessages.filter(m => m.isSent).length,
        receivedMessages: conversationMessages.filter(m => !m.isSent).length,
        otherPubkey: otherPubkey.substring(0, 8),
      });

      // Cache the messages for future use
      if (conversationMessages.length > 0) {
        await this.cache.cacheMessages(conversationMessages);
      }

      logger.info('Messages loaded for conversation', {
        service: 'MessagingBusinessService',
        method: 'getMessages',
        count: conversationMessages.length,
      });

      return conversationMessages;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to load messages', error instanceof Error ? error : new Error(errorMessage), {
        service: 'MessagingBusinessService',
        method: 'getMessages',
        otherPubkey,
      });

      throw error;
    }
  }

  /**
   * Subscribe to new messages for real-time updates
   * 
   * @param signer - NIP-07 signer
   * @param onMessage - Callback function called for each new message
   * @returns Unsubscribe function to close the subscription
   */
  public subscribeToMessages(
    signer: NostrSigner,
    onMessage: (message: Message) => void
  ): () => void {
    logger.info('Subscribing to new messages', {
      service: 'MessagingBusinessService',
      method: 'subscribeToMessages',
    });

    let userPubkey: string | null = null;
    let unsubscribe: (() => void) | null = null;

    // Get user public key and set up subscription
    signer.getPublicKey().then(pubkey => {
      userPubkey = pubkey;

      const filters = [
        {
          kinds: [1059],
          '#p': [pubkey],
        },
      ];

      // Subscribe to events
      unsubscribe = subscribeToEvents(
        filters,
        async (event: NostrEvent) => {
          if (!userPubkey) return;

          // Only process if event is addressed to user
          const pTags = event.tags.filter(tag => tag[0] === 'p');
          if (!pTags.some(tag => tag[1] === userPubkey)) return;

          try {
            // Decrypt gift wrap
            const messages = await this.decryptGiftWraps([event], signer);
            if (messages.length > 0) {
              messages[0].isSent = messages[0].senderPubkey === userPubkey;
              onMessage(messages[0]);
            }
          } catch (error) {
            logger.error('Failed to decrypt new message', error instanceof Error ? error : new Error('Unknown error'), {
              service: 'MessagingBusinessService',
              method: 'subscribeToMessages',
              eventId: event.id,
            });
          }
        }
      );
    });

    // Return unsubscribe function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }

  /**
   * Decrypt gift-wrapped messages (Kind 1059 events)
   * Private helper method
   * 
   * @param giftWraps - Array of Kind 1059 gift wrap events
   * @param signer - NIP-07 signer for decryption
   * @returns Array of decrypted messages
   */
  private async decryptGiftWraps(
    giftWraps: NostrEvent[],
    signer: NostrSigner
  ): Promise<Message[]> {
    const messages: Message[] = [];

    for (const giftWrap of giftWraps) {
      try {
        // Step 1: Decrypt gift wrap to get seal (using ephemeral pubkey)
        const sealJson = await EncryptionService.decryptWithSigner(
          signer,
          giftWrap.pubkey, // Ephemeral pubkey
          giftWrap.content
        );

        const seal: NostrEvent = JSON.parse(sealJson);

        // Step 2: Decrypt seal to get rumor (using sender's pubkey)
        const rumorJson = await EncryptionService.decryptWithSigner(
          signer,
          seal.pubkey, // Sender's pubkey
          seal.content
        );

        const rumor = JSON.parse(rumorJson);

        // Step 3: Extract message data from rumor
        let content = rumor.content;
        let context: ConversationContext | undefined;

        // Parse context if present
        const contextMatch = content.match(/^\[Context: (product|heritage)\/([^\]]+)\]\n\n/);
        if (contextMatch) {
          context = {
            type: contextMatch[1] as 'product' | 'heritage',
            id: contextMatch[2],
          };
          content = content.replace(contextMatch[0], ''); // Remove context prefix
        }

        // Extract recipient from rumor tags
        const recipientTag = rumor.tags.find((tag: string[]) => tag[0] === 'p');
        const recipientPubkey = recipientTag ? recipientTag[1] : '';

        const message: Message = {
          id: giftWrap.id,
          senderPubkey: rumor.pubkey,
          recipientPubkey,
          content,
          createdAt: rumor.created_at,
          context,
        };

        messages.push(message);
      } catch (error) {
        logger.error('Failed to decrypt gift wrap', error instanceof Error ? error : new Error('Unknown error'), {
          service: 'MessagingBusinessService',
          method: 'decryptGiftWraps',
          eventId: giftWrap.id,
        });
        // Continue with next message
      }
    }

    return messages;
  }
}

// Export singleton instance
export const messagingBusinessService = MessagingBusinessService.getInstance();

// Export convenience functions
export const sendMessage = (recipientPubkey: string, content: string, signer: NostrSigner, context?: ConversationContext) =>
  messagingBusinessService.sendMessage(recipientPubkey, content, signer, context);

export const getConversations = (signer: NostrSigner) =>
  messagingBusinessService.getConversations(signer);

export const getMessages = (otherPubkey: string, signer: NostrSigner, limit?: number) =>
  messagingBusinessService.getMessages(otherPubkey, signer, limit);

export const subscribeToMessages = (signer: NostrSigner, onMessage: (message: Message) => void) =>
  messagingBusinessService.subscribeToMessages(signer, onMessage);
