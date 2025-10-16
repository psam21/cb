/**
 * useConversations.ts
 * Hook Layer - Conversation List Management
 * 
 * Manages conversation list with real-time updates via WebSocket subscriptions.
 * Follows battle-tested Shop hook patterns.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/services/core/LoggingService';
import { messagingBusinessService } from '@/services/business/MessagingBusinessService';
import { Conversation, Message } from '@/types/messaging';
import { useNostrSigner } from './useNostrSigner';
import { AppError } from '@/errors/AppError';
import { ErrorCode, HttpStatus, ErrorCategory, ErrorSeverity } from '@/errors/ErrorTypes';

export const useConversations = () => {
  const { signer } = useNostrSigner();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const processedMessageIds = useRef<Set<string>>(new Set());

  /**
   * Load conversations from relays
   */
  const loadConversations = useCallback(async () => {
    if (!signer) {
      logger.warn('No signer available', {
        service: 'useConversations',
        method: 'loadConversations',
      });
      const error = new AppError(
        'No signer detected. Please sign in.',
        ErrorCode.SIGNER_NOT_DETECTED,
        HttpStatus.UNAUTHORIZED,
        ErrorCategory.AUTHENTICATION,
        ErrorSeverity.MEDIUM
      );
      setError(error.message);
      setIsLoading(false);
      return;
    }

    try {
      logger.info('Loading conversations', {
        service: 'useConversations',
        method: 'loadConversations',
      });

      setIsLoading(true);
      setError(null);

      const conversationList = await messagingBusinessService.getConversations(signer);

      logger.info('Conversations loaded successfully', {
        service: 'useConversations',
        method: 'loadConversations',
        count: conversationList.length,
      });

      setConversations(conversationList);
    } catch (err) {
      const appError = err instanceof AppError 
        ? err 
        : new AppError(
            err instanceof Error ? err.message : 'Failed to load conversations',
            ErrorCode.NOSTR_ERROR,
            HttpStatus.INTERNAL_SERVER_ERROR,
            ErrorCategory.EXTERNAL_SERVICE,
            ErrorSeverity.MEDIUM
          );
      logger.error('Failed to load conversations', appError, {
        service: 'useConversations',
        method: 'loadConversations',
      });
      setError(appError.message);
    } finally {
      setIsLoading(false);
    }
  }, [signer]);

  /**
   * Update conversation with new message
   */
  const updateConversationWithMessage = useCallback(async (message: Message) => {
    console.log('[useConversations] 📨 Message received', {
      id: message.id?.substring(0, 8),
      createdAt: message.createdAt,
      isSent: message.isSent,
    });
    
    // Deduplication: Skip if we've already processed this message
    if (processedMessageIds.current.has(message.id)) {
      console.log('[useConversations] ⏭️  Skipping duplicate message', {
        id: message.id?.substring(0, 8),
      });
      return;
    }
    
    // Filter out self-messages: Skip if sender = recipient (message to self)
    if (message.senderPubkey === message.recipientPubkey) {
      console.log('[useConversations] 🚫 Skipping self-message (sender = recipient)', {
        id: message.id?.substring(0, 8),
        pubkey: message.senderPubkey?.substring(0, 8),
      });
      processedMessageIds.current.add(message.id); // Mark as processed to avoid checking again
      return;
    }
    
    // Mark message as processed
    processedMessageIds.current.add(message.id);
    
    const otherPubkey = message.isSent ? message.recipientPubkey : message.senderPubkey;
    let updatedConversation: Conversation | undefined;
    
    setConversations(prev => {
      // Find existing conversation
      const existingIndex = prev.findIndex(c => c.pubkey === otherPubkey);
      
      if (existingIndex >= 0) {
        // Update existing conversation
        const updated = [...prev];
        
        // Keep the newest timestamp (in case old messages arrive after new ones)
        const newestTimestamp = Math.max(updated[existingIndex].lastMessageAt, message.createdAt);
        
        console.log('[useConversations] ✏️ Updating conversation', {
          pubkey: otherPubkey?.substring(0, 8),
          oldLastMessageAt: updated[existingIndex].lastMessageAt,
          messageTimestamp: message.createdAt,
          usingTimestamp: newestTimestamp,
        });
        
        // Increment unread count if message is from the other person (not sent by current user)
        const currentUnreadCount = updated[existingIndex].unreadCount || 0;
        const newUnreadCount = message.isSent ? currentUnreadCount : currentUnreadCount + 1;
        
        updatedConversation = {
          ...updated[existingIndex],
          lastMessage: message,
          lastMessageAt: newestTimestamp,
          unreadCount: newUnreadCount,
        };
        
        updated[existingIndex] = updatedConversation;
        
        // Move to top (sort by lastMessageAt descending)
        const sorted = updated.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
        
        console.log('[useConversations] 📊 Sorted - Top 3:', 
          sorted.slice(0, 3).map(c => `${c.pubkey?.substring(0, 8)}@${c.lastMessageAt}`).join(', ')
        );
        
        return sorted;
      } else {
        // Create new conversation
        console.log('[useConversations] ➕ Creating new conversation', {
          pubkey: otherPubkey?.substring(0, 8),
          lastMessageAt: message.createdAt,
        });
        
        updatedConversation = {
          pubkey: otherPubkey,
          lastMessage: message,
          lastMessageAt: message.createdAt,
          context: message.context,
          unreadCount: message.isSent ? 0 : 1, // Mark as unread if message is from other person
        };
        
        // Add new conversation and sort to maintain order
        const updated = [updatedConversation, ...prev];
        return updated.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
      }
    });
    
    // Update cache to persist conversation order across refreshes
    if (updatedConversation) {
      const convToCache = updatedConversation; // Capture for type safety
      console.log('[useConversations] 💾 Updating conversation cache', {
        pubkey: convToCache.pubkey?.substring(0, 8),
        lastMessageAt: convToCache.lastMessageAt,
      });
      
      try {
        await messagingBusinessService.updateConversationCache(convToCache);
        console.log('[useConversations] ✅ Cache updated successfully');
      } catch (error) {
        console.error('[useConversations] ❌ Cache update failed:', error);
        logger.error('Failed to update conversation cache', error instanceof Error ? error : new Error('Unknown error'), {
          service: 'useConversations',
          method: 'updateConversationWithMessage',
        });
      }
    }
  }, []); // processedMessageIds is a ref, stable across renders

  /**
   * Subscribe to new messages for real-time updates
   */
  useEffect(() => {
    if (!signer) return;

    logger.info('Setting up message subscription', {
      service: 'useConversations',
      method: 'useEffect[subscribe]',
    });

    const unsubscribe = messagingBusinessService.subscribeToMessages(
      signer,
      (message: Message) => {
        logger.info('New message received', {
          service: 'useConversations',
          method: 'messageCallback',
          messageId: message.id,
        });
        
        updateConversationWithMessage(message);
      }
    );

    return () => {
      logger.info('Cleaning up message subscription', {
        service: 'useConversations',
        method: 'useEffect[cleanup]',
      });
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signer]); // updateConversationWithMessage is stable, no need in deps

  /**
   * Load conversations on mount
   */
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  /**
   * Refresh conversations manually
   */
  const refreshConversations = useCallback(() => {
    logger.info('Refreshing conversations', {
      service: 'useConversations',
      method: 'refreshConversations',
    });
    loadConversations();
  }, [loadConversations]);

  /**
   * Get conversation by pubkey
   */
  const getConversation = useCallback((pubkey: string) => {
    return conversations.find(c => c.pubkey === pubkey);
  }, [conversations]);

  /**
   * Mark conversation as read (reset unread count)
   */
  const markAsRead = useCallback(async (pubkey: string) => {
    logger.info('Marking conversation as read', {
      service: 'useConversations',
      method: 'markAsRead',
      pubkey: pubkey.substring(0, 8),
    });
    
    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv.pubkey === pubkey) {
          return {
            ...conv,
            unreadCount: 0,
            lastViewedAt: Math.floor(Date.now() / 1000),
          };
        }
        return conv;
      });
      return updated;
    });

    // Update cache
    const conversation = conversations.find(c => c.pubkey === pubkey);
    if (conversation) {
      try {
        await messagingBusinessService.updateConversationCache({
          ...conversation,
          unreadCount: 0,
          lastViewedAt: Math.floor(Date.now() / 1000),
        });
      } catch (error) {
        logger.error('Failed to update conversation cache', error instanceof Error ? error : new Error('Unknown error'), {
          service: 'useConversations',
          method: 'markAsRead',
        });
      }
    }
  }, [conversations]);

  return {
    conversations,
    isLoading,
    error,
    refreshConversations,
    getConversation,
    updateConversationWithMessage,
    markAsRead,
  };
};
