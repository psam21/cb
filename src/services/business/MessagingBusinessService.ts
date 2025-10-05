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

export class MessagingBusinessService {
  private static instance: MessagingBusinessService;

  private constructor() {}

  public static getInstance(): MessagingBusinessService {
    if (!MessagingBusinessService.instance) {
      MessagingBusinessService.instance = new MessagingBusinessService();
    }
    return MessagingBusinessService.instance;
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
      const giftWrapToSelf = await nostrEventService.createGiftWrappedMessage(
        senderPubkey, // Send to ourselves
        messageContent,
        signer
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

      // Fetch display names for all conversations
      await Promise.all(conversations.map(async (conversation) => {
        try {
          const profile = await profileService.getUserProfile(conversation.pubkey);
          if (profile) {
            conversation.displayName = profile.display_name || undefined;
            conversation.avatar = profile.picture || undefined;
          }
        } catch (error) {
          // Silently fail - display name is optional
          logger.debug('Failed to fetch profile for conversation', {
            service: 'MessagingBusinessService',
            method: 'getConversations',
            pubkey: conversation.pubkey,
          });
        }
      }));

      logger.info('Conversations loaded', {
        service: 'MessagingBusinessService',
        method: 'getConversations',
        count: conversations.length,
      });

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
   * Get all messages for a specific conversation
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

      const userPubkey = await signer.getPublicKey();

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

      // Filter messages for this specific conversation
      const conversationMessages = allMessages
        .filter(msg => 
          (msg.senderPubkey === userPubkey && msg.recipientPubkey === otherPubkey) ||
          (msg.senderPubkey === otherPubkey && msg.recipientPubkey === userPubkey)
        )
        .sort((a, b) => a.createdAt - b.createdAt); // Oldest first

      // Mark messages as sent or received
      conversationMessages.forEach(msg => {
        msg.isSent = msg.senderPubkey === userPubkey;
      });

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
