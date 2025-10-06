/**
 * Messages Page
 * Page Layer - Private Messaging Interface
 * 
 * Two-panel layout: Conversation list + Message thread
 * Follows battle-tested Shop page patterns
 */

'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConversationList } from '@/components/pages/ConversationList';
import { MessageThread } from '@/components/pages/MessageThread';
import { MessageComposer } from '@/components/pages/MessageComposer';
import { useConversations } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import { useMessageSending } from '@/hooks/useMessageSending';
import { useNostrSigner } from '@/hooks/useNostrSigner';
import { logger } from '@/services/core/LoggingService';

function MessagesPageContent() {
  const searchParams = useSearchParams();
  const { signer, isLoading: signerLoading } = useNostrSigner();
  const [selectedPubkey, setSelectedPubkey] = useState<string | null>(null);
  const [currentUserPubkey, setCurrentUserPubkey] = useState<string | null>(null);
  const [conversationContext, setConversationContext] = useState<{
    type: 'product' | 'heritage';
    id: string;
  } | undefined>(undefined);

  // Handle URL parameters for direct navigation (e.g., from "Contact Seller")
  React.useEffect(() => {
    const recipientParam = searchParams?.get('recipient');
    const contextParam = searchParams?.get('context'); // Format: "product:123" or "heritage:456"
    const contextTitleParam = searchParams?.get('contextTitle');
    const contextImageParam = searchParams?.get('contextImage');
    
    if (recipientParam && !selectedPubkey) {
      logger.info('Auto-selecting conversation from URL', {
        service: 'MessagesPage',
        method: 'useEffect[searchParams]',
        recipient: recipientParam,
        context: contextParam,
        contextTitle: contextTitleParam,
        contextImage: contextImageParam,
      });
      setSelectedPubkey(recipientParam);
      
      // Parse context parameter
      if (contextParam) {
        const [type, id] = contextParam.split(':');
        if ((type === 'product' || type === 'heritage') && id) {
          setConversationContext({
            type,
            id,
            ...(contextTitleParam && { title: contextTitleParam }),
            ...(contextImageParam && { imageUrl: contextImageParam }),
          });
        }
      }
    }
  }, [searchParams, selectedPubkey]);

  // Load user pubkey
  React.useEffect(() => {
    if (signer) {
      signer.getPublicKey().then(setCurrentUserPubkey).catch(err => {
        logger.error('Failed to get public key', err instanceof Error ? err : new Error('Unknown error'), {
          service: 'MessagesPage',
          method: 'useEffect[signer]',
        });
      });
    }
  }, [signer]);

  // Conversations hook
  const {
    conversations,
    isLoading: conversationsLoading,
    error: conversationsError,
    updateConversationWithMessage,
  } = useConversations();

  // Messages hook for selected conversation
  const {
    messages,
    isLoading: messagesLoading,
    error: messagesError,
    addMessage,
  } = useMessages({ otherPubkey: selectedPubkey });

  // Message sending hook
  const { sendMessage, isSending, sendError } = useMessageSending();

  const handleSelectConversation = (pubkey: string) => {
    logger.info('Selected conversation', {
      service: 'MessagesPage',
      method: 'handleSelectConversation',
      pubkey,
    });
    setSelectedPubkey(pubkey);
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedPubkey) {
      logger.warn('No conversation selected', {
        service: 'MessagesPage',
        method: 'handleSendMessage',
      });
      return;
    }

    logger.info('Sending message from page', {
      service: 'MessagesPage',
      method: 'handleSendMessage',
      recipientPubkey: selectedPubkey,
      context: conversationContext,
    });

    // Pass conversation context if available (e.g., from "Contact Seller" button)
    await sendMessage(selectedPubkey, content, conversationContext, {
      onOptimisticUpdate: (tempMessage) => {
        // Add to messages list immediately
        addMessage(tempMessage);
        // Update conversation list
        updateConversationWithMessage(tempMessage);
      },
      onSuccess: (message) => {
        logger.info('Message sent successfully, updating with real ID', {
          service: 'MessagesPage',
          method: 'handleSendMessage',
          messageId: message.id,
        });
        // Update the optimistic message with the real ID and details
        addMessage(message);
        // Update conversation list
        updateConversationWithMessage(message);
      },
      onError: (error, tempId) => {
        logger.error('Failed to send message', new Error(error), {
          service: 'MessagesPage',
          method: 'handleSendMessage',
          tempId,
        });
        // Could remove temp message here if desired
      },
    });
  };

  // Loading state for signer
  if (signerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-primary-600">Detecting Nostr signer...</p>
        </div>
      </div>
    );
  }

  // Not signed in state
  if (!signer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-50">
        <div className="text-center max-w-md px-6">
          <svg
            className="w-16 h-16 text-primary-600 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-primary-900 mb-2">
            Sign in required
          </h2>
          <p className="text-primary-600 mb-6">
            Please sign in with your Nostr extension (Alby, nos2x, etc.) to access encrypted messages
          </p>
          <a
            href="/signin"
            className="inline-block px-6 py-3 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  // Error state
  if (conversationsError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-50">
        <div className="text-center max-w-md px-6">
          <svg
            className="w-16 h-16 text-red-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-primary-900 mb-2">
            Error loading conversations
          </h2>
          <p className="text-red-600 mb-6">{conversationsError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50">
      <div className="max-w-7xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-primary-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-primary-900">Messages</h1>
          <p className="text-sm text-primary-600">Private encrypted conversations</p>
        </header>

        {/* Two-panel layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left panel: Conversation list */}
          <div className="w-full md:w-80 border-r border-primary-200 bg-white flex flex-col">
            <ConversationList
              conversations={conversations}
              selectedPubkey={selectedPubkey}
              onSelectConversation={handleSelectConversation}
              isLoading={conversationsLoading}
            />
          </div>

          {/* Right panel: Message thread + composer */}
          <div className="flex-1 flex flex-col bg-white">
            <MessageThread
              messages={messages}
              currentUserPubkey={currentUserPubkey}
              otherUserPubkey={selectedPubkey}
              isLoading={messagesLoading}
            />

            {selectedPubkey && (
              <MessageComposer
                onSend={handleSendMessage}
                disabled={!signer}
                isSending={isSending}
              />
            )}

            {/* Send error display */}
            {sendError && (
              <div className="px-4 py-2 bg-red-50 border-t border-red-200">
                <p className="text-sm text-red-600">{sendError}</p>
              </div>
            )}

            {/* Messages error display */}
            {messagesError && (
              <div className="px-4 py-2 bg-red-50 border-t border-red-200">
                <p className="text-sm text-red-600">{messagesError}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-primary-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-primary-600">Loading...</p>
        </div>
      </div>
    }>
      <MessagesPageContent />
    </Suspense>
  );
}
