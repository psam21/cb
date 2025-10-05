/**
 * MessageThread.tsx
 * Component Layer - Message Thread Display
 * 
 * Displays message history for a conversation.
 * Follows battle-tested Shop component patterns.
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { Message } from '@/types/messaging';

interface MessageThreadProps {
  messages: Message[];
  currentUserPubkey: string | null;
  otherUserPubkey: string | null;
  isLoading?: boolean;
}

export const MessageThread: React.FC<MessageThreadProps> = ({
  messages,
  currentUserPubkey,
  otherUserPubkey,
  isLoading = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Debug logging
  useEffect(() => {
    console.log('[MessageThread] Debug Info:', {
      messagesCount: messages.length,
      currentUserPubkey,
      otherUserPubkey,
      messages: messages.map(m => ({
        id: m.id,
        senderPubkey: m.senderPubkey?.substring(0, 8),
        recipientPubkey: m.recipientPubkey?.substring(0, 8),
        isSent: m.isSent,
        content: m.content.substring(0, 20),
      })),
    });
  }, [messages, currentUserPubkey, otherUserPubkey]);

  // Auto-scroll to bottom when new messages arrive (only within the messages container)
  useEffect(() => {
    if (messagesContainerRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isYesterday) {
      return `Yesterday ${date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })}`;
    }

    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (!otherUserPubkey) {
    return (
      <div className="flex-1 flex items-center justify-center bg-primary-50">
        <div className="text-center px-6">
          <svg
            className="w-16 h-16 text-primary-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-primary-900 mb-2">
            Select a conversation
          </h3>
          <p className="text-primary-600">
            Choose a conversation from the list to view messages
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-sm text-primary-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center px-6">
          <svg
            className="w-12 h-12 text-primary-400 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
          <p className="text-primary-600 font-medium mb-1">No messages yet</p>
          <p className="text-sm text-primary-500">
            Start the conversation by sending a message below
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto bg-primary-50 p-4 space-y-4">
      {messages.map((message) => {
        // Use the isSent flag from the message (already set by business service)
        const isSent = message.isSent ?? (message.senderPubkey === currentUserPubkey);

        return (
          <div
            key={message.id || message.tempId}
            className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                isSent
                  ? 'bg-accent-600 text-white'
                  : 'bg-white text-primary-900 border border-primary-200'
              }`}
            >
              {/* Message content */}
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>

              {/* Timestamp */}
              <p
                className={`text-xs mt-1 ${
                  isSent ? 'text-accent-100' : 'text-primary-500'
                }`}
              >
                {formatTimestamp(message.createdAt)}
                {message.tempId && !message.id && (
                  <span className="ml-2">Sending...</span>
                )}
              </p>

              {/* Context tag if present */}
              {message.context && (
                <div className="mt-2 pt-2 border-t border-opacity-20" style={{ borderColor: isSent ? 'white' : '#cbd5e0' }}>
                  <p className={`text-xs ${isSent ? 'text-accent-100' : 'text-primary-600'}`}>
                    {message.context.type === 'product' ? '🛍️ Product' : '🏛️ Heritage'}: {message.context.title || message.context.id}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};
