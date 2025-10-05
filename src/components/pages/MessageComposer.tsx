/**
 * MessageComposer.tsx
 * Component Layer - Message Input and Sending
 * 
 * Input field with send button for composing messages.
 * Follows battle-tested Shop component patterns.
 */

'use client';

import React, { useState, useRef, KeyboardEvent } from 'react';
import { logger } from '@/services/core/LoggingService';

interface MessageComposerProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
  isSending?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
  isSending = false,
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    <div className="border-t border-primary-200 bg-white p-4">
      <div className="flex items-end gap-2">
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
            className="w-full px-4 py-2 border border-primary-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent disabled:bg-primary-50 disabled:text-primary-400 disabled:cursor-not-allowed"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          <p className="text-xs text-primary-500 mt-1">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled || isSending}
          className="px-6 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 disabled:bg-primary-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 h-10"
        >
          {isSending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Sending...</span>
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              <span>Send</span>
            </>
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
