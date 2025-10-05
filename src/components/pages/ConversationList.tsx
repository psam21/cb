/**
 * ConversationList.tsx
 * Component Layer - Conversation List Display
 * 
 * Displays list of conversations with last message preview.
 * Follows battle-tested Shop component patterns.
 */

'use client';

import React from 'react';
import { Conversation } from '@/types/messaging';
import { logger } from '@/services/core/LoggingService';

interface ConversationListProps {
  conversations: Conversation[];
  selectedPubkey: string | null;
  onSelectConversation: (pubkey: string) => void;
  isLoading?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedPubkey,
  onSelectConversation,
  isLoading = false,
}) => {
  const handleSelect = (pubkey: string) => {
    logger.info('Conversation selected', {
      service: 'ConversationList',
      method: 'handleSelect',
      pubkey,
    });
    onSelectConversation(pubkey);
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const truncateMessage = (content: string, maxLength: number = 60) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const formatPubkey = (pubkey: string) => {
    // Format as npub1...xyz (first 8 and last 4 chars)
    if (pubkey.length > 12) {
      return `${pubkey.substring(0, 8)}...${pubkey.substring(pubkey.length - 4)}`;
    }
    return pubkey;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-primary-200">
          <h2 className="text-lg font-semibold text-primary-900">Messages</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
            <p className="text-sm text-primary-600">Loading conversations...</p>
          </div>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-primary-200">
          <h2 className="text-lg font-semibold text-primary-900">Messages</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
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
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-primary-600 font-medium mb-1">No conversations yet</p>
            <p className="text-sm text-primary-500">
              Start a conversation from a product or heritage contribution
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-primary-200 bg-white">
        <h2 className="text-lg font-semibold text-primary-900">Messages</h2>
        <p className="text-xs text-primary-600 mt-1">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => (
          <button
            key={conversation.pubkey}
            onClick={() => handleSelect(conversation.pubkey)}
            className={`w-full p-4 border-b border-primary-100 hover:bg-primary-50 transition-colors text-left ${
              selectedPubkey === conversation.pubkey ? 'bg-primary-100' : 'bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Avatar placeholder */}
              <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0">
                <span className="text-accent-700 font-semibold text-sm">
                  {conversation.displayName?.[0]?.toUpperCase() || conversation.pubkey[0]?.toUpperCase()}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Name and timestamp */}
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <h3 className="font-medium text-primary-900 truncate">
                    {conversation.displayName || formatPubkey(conversation.pubkey)}
                  </h3>
                  <span className="text-xs text-primary-500 flex-shrink-0">
                    {formatTimestamp(conversation.lastMessageAt)}
                  </span>
                </div>

                {/* Last message preview */}
                {conversation.lastMessage && (
                  <p className="text-sm text-primary-600 truncate">
                    {conversation.lastMessage.isSent && (
                      <span className="text-primary-500 mr-1">You:</span>
                    )}
                    {truncateMessage(conversation.lastMessage.content)}
                  </p>
                )}

                {/* Context tag if present */}
                {conversation.context && (
                  <div className="mt-1">
                    <span className="inline-block text-xs px-2 py-0.5 bg-accent-100 text-accent-700 rounded">
                      {conversation.context.type === 'product' ? '🛍️' : '🏛️'} {conversation.context.title || conversation.context.id}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
