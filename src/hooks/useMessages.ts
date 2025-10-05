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
        
        // Helper to get consistent key for a message
        const getKey = (msg: Message) => {
          if (msg.id) return `id:${msg.id}`;
          if (msg.tempId) return `temp:${msg.tempId}`;
          return `fallback:${msg.senderPubkey}-${msg.recipientPubkey}-${msg.createdAt}`;
        };
        
        logger.debug('Merging messages', {
          service: 'useMessages',
          method: 'loadMessages',
          previousCount: prev.length,
          loadedCount: messageList.length,
        });
        
        // First, add all previously loaded/sent messages from this session
        prev.forEach(msg => {
          messageMap.set(getKey(msg), msg);
        });
        
        // Then add newly loaded messages from relays
        messageList.forEach(msg => {
          const key = getKey(msg);
          
          // Only add if not already present OR if this is a real message replacing a temp one
          if (!messageMap.has(key)) {
            messageMap.set(key, msg);
          } else if (msg.id && !messageMap.get(key)!.id) {
            // Replace temp/fallback with real message
            messageMap.set(key, msg);
          }
        });
        
        const mergedMessages = Array.from(messageMap.values()).sort((a, b) => a.createdAt - b.createdAt);
        
        logger.debug('Messages merged', {
          service: 'useMessages',
          method: 'loadMessages',
          finalCount: mergedMessages.length,
        });
        
        return mergedMessages;
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
      // Create a map to track existing messages
      const messageMap = new Map<string, Message>();
      
      // Helper to get consistent key for a message
      const getKey = (msg: Message) => {
        if (msg.id) return `id:${msg.id}`;
        if (msg.tempId) return `temp:${msg.tempId}`;
        return `fallback:${msg.senderPubkey}-${msg.recipientPubkey}-${msg.createdAt}`;
      };
      
      // First, add all existing messages
      prev.forEach(msg => {
        messageMap.set(getKey(msg), msg);
      });
      
      // Check if this message already exists
      const messageKey = getKey(message);
      const isDuplicate = messageMap.has(messageKey);
      
      if (isDuplicate) {
        // Update existing message (e.g., replace tempId with real id)
        logger.debug('Updating existing message', {
          service: 'useMessages',
          method: 'addMessage',
          messageId: message.id,
          tempId: message.tempId,
        });
        messageMap.set(messageKey, message);
      } else {
        // New message - check if it replaces a temp message
        if (message.id) {
          // Look for temp version by matching tempId OR by sender/recipient/timestamp
          if (message.tempId) {
            // We have explicit tempId - remove that temp message
            const tempKey = `temp:${message.tempId}`;
            if (messageMap.has(tempKey)) {
              logger.debug('Replacing temp message with real message (by tempId)', {
                service: 'useMessages',
                method: 'addMessage',
                tempId: message.tempId,
                realId: message.id,
              });
              messageMap.delete(tempKey);
            }
          } else {
            // No tempId (probably from subscription) - find temp by matching sender/time
            // This handles the case where subscription arrives before onSuccess
            prev.forEach(prevMsg => {
              if (prevMsg.tempId && 
                  !prevMsg.id &&
                  prevMsg.senderPubkey === message.senderPubkey &&
                  prevMsg.recipientPubkey === message.recipientPubkey &&
                  Math.abs(prevMsg.createdAt - message.createdAt) < 5) {
                logger.debug('Replacing temp message with real message (by timestamp match)', {
                  service: 'useMessages',
                  method: 'addMessage',
                  tempId: prevMsg.tempId,
                  realId: message.id,
                  timeDiff: Math.abs(prevMsg.createdAt - message.createdAt),
                });
                messageMap.delete(`temp:${prevMsg.tempId}`);
              }
            });
          }
        }
        
        // Add the new message
        logger.debug('Adding new message', {
          service: 'useMessages',
          method: 'addMessage',
          messageId: message.id,
          tempId: message.tempId,
          hasTempId: !!message.tempId,
        });
        messageMap.set(messageKey, message);
      }
      
      // Sort by timestamp and return
      return Array.from(messageMap.values()).sort((a, b) => a.createdAt - b.createdAt);
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
