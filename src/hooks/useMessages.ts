/**
 * useMessages.ts
 * Hook Layer - Message Thread Management
 * 
 * Manages messages for a specific conversation with real-time updates.
 * Follows battle-tested Shop hook patterns.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/services/core/LoggingService';
import { messagingBusinessService } from '@/services/business/MessagingBusinessService';
import { Message } from '@/types/messaging';
import { useNostrSigner } from './useNostrSigner';

interface UseMessagesProps {
  /** Public key of the other user in the conversation */
  otherPubkey: string | null;
  /** Maximum number of messages to load (default: 100) */
  limit?: number;
}

export const useMessages = ({ otherPubkey, limit = 100 }: UseMessagesProps) => {
  const { signer } = useNostrSigner();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load messages for the conversation
   */
  const loadMessages = useCallback(async () => {
    if (!signer) {
      logger.warn('No signer available', {
        service: 'useMessages',
        method: 'loadMessages',
      });
      setError('No signer detected. Please sign in.');
      setIsLoading(false);
      return;
    }

    if (!otherPubkey) {
      logger.debug('No other pubkey provided, skipping load', {
        service: 'useMessages',
        method: 'loadMessages',
      });
      setMessages([]);
      setIsLoading(false);
      return;
    }

    try {
      logger.info('Loading messages for conversation', {
        service: 'useMessages',
        method: 'loadMessages',
        otherPubkey,
        limit,
      });

      setIsLoading(true);
      setError(null);

      const messageList = await messagingBusinessService.getMessages(
        otherPubkey,
        signer,
        limit
      );

      logger.info('Messages loaded successfully', {
        service: 'useMessages',
        method: 'loadMessages',
        count: messageList.length,
        otherPubkey,
      });

      // Merge loaded messages with existing ones (preserve all messages from current session)
      setMessages(prev => {
        // Create a map to avoid duplicates
        const messageMap = new Map<string, Message>();
        
        // First, add all previously loaded/sent messages from this session
        prev.forEach(msg => {
          const key = msg.id || msg.tempId || `${msg.senderPubkey}-${msg.createdAt}`;
          messageMap.set(key, msg);
        });
        
        // Then add/update with newly loaded messages from relays
        messageList.forEach(msg => {
          if (msg.id) {
            messageMap.set(msg.id, msg);
          }
        });
        
        // Sort by timestamp and return
        return Array.from(messageMap.values()).sort((a, b) => a.createdAt - b.createdAt);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load messages';
      logger.error('Failed to load messages', err instanceof Error ? err : new Error(errorMessage), {
        service: 'useMessages',
        method: 'loadMessages',
        otherPubkey,
      });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [signer, otherPubkey, limit]);

  /**
   * Add a new message to the conversation (for real-time updates or optimistic UI)
   */
  const addMessage = useCallback((message: Message) => {
    setMessages(prev => {
      // Check if message already exists (avoid duplicates)
      const exists = prev.some(m => m.id === message.id || m.tempId === message.tempId);
      if (exists) {
        // Update existing message (e.g., replace tempId with real id after publishing)
        return prev.map(m => 
          (m.id === message.id || m.tempId === message.tempId) ? message : m
        );
      }
      
      // Add new message at the end (messages are sorted oldest first)
      return [...prev, message];
    });
  }, []);

  /**
   * Remove a message (e.g., if sending failed)
   */
  const removeMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId && m.tempId !== messageId));
  }, []);

  /**
   * Subscribe to new messages for this conversation
   */
  useEffect(() => {
    if (!signer || !otherPubkey) return;

    logger.info('Setting up message subscription for conversation', {
      service: 'useMessages',
      method: 'useEffect[subscribe]',
      otherPubkey,
    });

    const unsubscribe = messagingBusinessService.subscribeToMessages(
      signer,
      (message: Message) => {
        // Only add message if it's part of this conversation
        if (
          (message.senderPubkey === otherPubkey || message.recipientPubkey === otherPubkey)
        ) {
          logger.info('New message received for conversation', {
            service: 'useMessages',
            method: 'messageCallback',
            messageId: message.id,
            otherPubkey,
          });
          
          addMessage(message);
        }
      }
    );

    return () => {
      logger.info('Cleaning up message subscription', {
        service: 'useMessages',
        method: 'useEffect[cleanup]',
        otherPubkey,
      });
      unsubscribe();
    };
  }, [signer, otherPubkey, addMessage]);

  /**
   * Load messages when otherPubkey changes
   */
  useEffect(() => {
    // Only load messages when otherPubkey changes or on initial mount
    // Don't reload if we're just updating messages in the same conversation
    if (otherPubkey) {
      loadMessages();
    } else {
      setMessages([]);
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherPubkey]); // Only depend on otherPubkey, not loadMessages

  /**
   * Refresh messages manually
   */
  const refreshMessages = useCallback(() => {
    logger.info('Refreshing messages', {
      service: 'useMessages',
      method: 'refreshMessages',
      otherPubkey,
    });
    loadMessages();
  }, [loadMessages, otherPubkey]);

  return {
    messages,
    isLoading,
    error,
    refreshMessages,
    addMessage,
    removeMessage,
  };
};
