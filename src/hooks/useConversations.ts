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
      setError('No signer detected. Please sign in.');
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversations';
      logger.error('Failed to load conversations', err instanceof Error ? err : new Error(errorMessage), {
        service: 'useConversations',
        method: 'loadConversations',
      });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [signer]);

  /**
   * Update conversation with new message
   */
  const updateConversationWithMessage = useCallback((message: Message) => {
    setConversations(prev => {
      const otherPubkey = message.isSent ? message.recipientPubkey : message.senderPubkey;
      
      // Find existing conversation
      const existingIndex = prev.findIndex(c => c.pubkey === otherPubkey);
      
      if (existingIndex >= 0) {
        // Update existing conversation
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          lastMessage: message,
          lastMessageAt: message.createdAt,
        };
        
        // Move to top (sort by lastMessageAt descending)
        return updated.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
      } else {
        // Create new conversation
        const newConversation: Conversation = {
          pubkey: otherPubkey,
          lastMessage: message,
          lastMessageAt: message.createdAt,
          context: message.context,
        };
        
        return [newConversation, ...prev];
      }
    });
  }, []);

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
  }, [signer, updateConversationWithMessage]);

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
