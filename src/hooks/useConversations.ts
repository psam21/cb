/**
 * useConversations.ts
 * Hook Layer - Conversation List Management
 * 
 * Manages conversation list with real-time updates via WebSocket subscriptions.
 * Follows battle-tested Shop hook patterns.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
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
    
    const otherPubkey = message.isSent ? message.recipientPubkey : message.senderPubkey;
    let updatedConversation: Conversation | undefined;
    
    setConversations(prev => {
      // Find existing conversation
      const existingIndex = prev.findIndex(c => c.pubkey === otherPubkey);
      
      if (existingIndex >= 0) {
        // Update existing conversation
        const updated = [...prev];
        
        console.log('[useConversations] ✏️ Updating conversation', {
          pubkey: otherPubkey?.substring(0, 8),
          oldLastMessageAt: updated[existingIndex].lastMessageAt,
          newLastMessageAt: message.createdAt,
        });
        
        updatedConversation = {
          ...updated[existingIndex],
          lastMessage: message,
          lastMessageAt: message.createdAt,
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
  }, []);  /**
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

  return {
    conversations,
    isLoading,
    error,
    refreshConversations,
    getConversation,
    updateConversationWithMessage,
  };
};
