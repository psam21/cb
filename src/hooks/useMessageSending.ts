/**
 * useMessageSending.ts
 * Hook Layer - Message Sending with Optimistic UI
 * 
 * Handles sending messages with optimistic updates and error handling.
 * Follows battle-tested Shop hook patterns.
 */

'use client';

import { useState, useCallback } from 'react';
import { logger } from '@/services/core/LoggingService';
import { messagingBusinessService } from '@/services/business/MessagingBusinessService';
import { Message, ConversationContext } from '@/types/messaging';
import { useNostrSigner } from './useNostrSigner';
import { AppError } from '@/errors/AppError';
import { ErrorCode, HttpStatus, ErrorCategory, ErrorSeverity } from '@/errors/ErrorTypes';

interface SendMessageOptions {
  /** Callback for optimistic UI update */
  onOptimisticUpdate?: (tempMessage: Message) => void;
  /** Callback when message is successfully sent */
  onSuccess?: (message: Message) => void;
  /** Callback when sending fails */
  onError?: (error: string, tempMessageId?: string) => void;
}

export const useMessageSending = () => {
  const { signer } = useNostrSigner();
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  /**
   * Send a message with optimistic UI
   * 
   * @param recipientPubkey - Recipient's public key
   * @param content - Message content
   * @param context - Optional conversation context (product/heritage reference)
   * @param options - Callbacks for optimistic UI and error handling
   */
  const sendMessage = useCallback(async (
    recipientPubkey: string,
    content: string,
    context?: ConversationContext,
    options?: SendMessageOptions
  ) => {
    if (!signer) {
      const error = 'No signer detected. Please sign in.';
      logger.warn('Cannot send message without signer', {
        service: 'useMessageSending',
        method: 'sendMessage',
      });
      setSendError(error);
      options?.onError?.(error);
      return;
    }

    if (!content.trim()) {
      const error = 'Message content cannot be empty';
      logger.warn('Cannot send empty message', {
        service: 'useMessageSending',
        method: 'sendMessage',
      });
      setSendError(error);
      options?.onError?.(error);
      return;
    }

    try {
      logger.info('Sending message', {
        service: 'useMessageSending',
        method: 'sendMessage',
        recipientPubkey,
        hasContext: !!context,
      });

      setIsSending(true);
      setSendError(null);

      // Get sender pubkey
      const senderPubkey = await signer.getPublicKey();

      // Create temporary message for optimistic UI
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const tempMessage: Message = {
        id: '',
        tempId,
        senderPubkey,
        recipientPubkey,
        content,
        createdAt: Math.floor(Date.now() / 1000),
        context,
        isSent: true,
      };

      // Trigger optimistic update
      options?.onOptimisticUpdate?.(tempMessage);

      try {
        // Send message via business service
        const result = await messagingBusinessService.sendMessage(
          recipientPubkey,
          content,
          signer,
          context
        );

        if (!result.success || !result.message) {
          throw new AppError(
            result.error || 'Failed to send message',
            ErrorCode.NOSTR_ERROR,
            HttpStatus.INTERNAL_SERVER_ERROR,
            ErrorCategory.EXTERNAL_SERVICE,
            ErrorSeverity.MEDIUM
          );
        }

        logger.info('Message sent successfully', {
          service: 'useMessageSending',
          method: 'sendMessage',
          messageId: result.message.id,
          tempId,
        });

        // Add tempId to the message so it can replace the optimistic one
        const messageWithTempId = {
          ...result.message,
          tempId,
        };

        // Trigger success callback
        options?.onSuccess?.(messageWithTempId);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        logger.error('Failed to send message', err instanceof Error ? err : new Error(errorMessage), {
          service: 'useMessageSending',
          method: 'sendMessage',
          recipientPubkey,
        });
        
        setSendError(errorMessage);
        options?.onError?.(errorMessage, tempId);
      } finally {
        setIsSending(false);
      }
    } catch (err) {
      // Outer catch for signer.getPublicKey() and other early failures
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      logger.error('Failed to get signer or send message', err instanceof Error ? err : new Error(errorMessage), {
        service: 'useMessageSending',
        method: 'sendMessage',
        recipientPubkey,
      });
      setSendError(errorMessage);
      setIsSending(false);
    }
  }, [signer]);

  /**
   * Clear send error
   */
  const clearError = useCallback(() => {
    setSendError(null);
  }, []);

  return {
    sendMessage,
    isSending,
    sendError,
    clearError,
  };
};
