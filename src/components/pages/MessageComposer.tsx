/**
 * MessageComposer.tsx
 * Component Layer - Message Input and Sending
 * 
 * Input field with send button for composing messages.
 * Follows battle-tested Shop component patterns.
 */

'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { logger } from '@/services/core/LoggingService';

interface MessageComposerProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
  isSending?: boolean;
  conversationKey?: string | null; // To detect conversation changes
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
  isSending = false,
  conversationKey = null,
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus when conversation changes or component mounts
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      // Small delay to ensure DOM is ready and scroll has completed
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
      
      return () => clearTimeout(timer);
    }
  }, [conversationKey, disabled]);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    
    if (!trimmedMessage || disabled || isSending) {
      return;
    }

    logger.info('Sending message', {
      service: 'MessageComposer',
      method: 'handleSend',
      messageLength: trimmedMessage.length,
    });

    onSend(trimmedMessage);
    setMessage('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  return (
    <div className="border-t border-primary-200 bg-white p-4 md:p-4">
      <div className="flex items-start gap-2">
        {/* Message input */}
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isSending}
            rows={1}
            className="w-full px-4 py-3 md:py-2 border border-primary-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent disabled:bg-primary-50 disabled:text-primary-400 disabled:cursor-not-allowed text-base"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          <p className="text-xs text-primary-500 mt-1 hidden md:block">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled || isSending}
          className="px-5 md:px-6 py-3 md:py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 disabled:bg-primary-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-h-[48px] md:min-h-[40px]"
        >
          {isSending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              <span>Sending...</span>
            </>
          ) : (
            <span>Send</span>
          )}
        </button>
      </div>

      {/* Disabled state message */}
      {disabled && !isSending && (
        <p className="text-xs text-red-600 mt-2">
          Please sign in to send messages
        </p>
      )}
    </div>
  );
};
