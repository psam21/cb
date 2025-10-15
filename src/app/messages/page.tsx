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
import { useAuthStore } from '@/stores/useAuthStore';
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
  
  // Mobile view state: true = show conversation list, false = show message thread
  const [showConversationList, setShowConversationList] = useState(true);

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

  // Load user pubkey and authenticate if needed
  React.useEffect(() => {
    if (signer && !currentUserPubkey) {
      signer.getPublicKey().then(async (pubkey) => {
        setCurrentUserPubkey(pubkey);
        
        // If we have a signer but no authenticated user, auto-sign in
        const { user, isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated || !user) {
          logger.info('Signer available but not authenticated, auto-signing in', {
            service: 'MessagesPage',
            method: 'useEffect[signer]',
          });
          
          try {
            const { profileService } = await import('@/services/business/ProfileBusinessService');
            const result = await profileService.signInWithExtension(signer);
            
            if (result.success && result.user) {
              useAuthStore.getState().setUser(result.user);
              useAuthStore.getState().setAuthenticated(true);
              
              logger.info('Auto sign-in successful', {
                service: 'MessagesPage',
                method: 'useEffect[signer]',
                pubkey: result.user.pubkey.substring(0, 8) + '...',
              });
            }
          } catch (error) {
            logger.error('Auto sign-in failed', error instanceof Error ? error : new Error('Unknown error'), {
              service: 'MessagesPage',
              method: 'useEffect[signer]',
            });
          }
        }
      }).catch(err => {
        logger.error('Failed to get public key', err instanceof Error ? err : new Error('Unknown error'), {
          service: 'MessagesPage',
          method: 'useEffect[signer]',
        });
      });
    }
  }, [signer, currentUserPubkey]);

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
    removeMessage,
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
    setShowConversationList(false); // Switch to message view on mobile
  };

  const handleBackToList = () => {
    logger.info('Returning to conversation list', {
      service: 'MessagesPage',
      method: 'handleBackToList',
    });
    setShowConversationList(true);
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
        logger.info('Message sent successfully, will be updated via subscription', {
          service: 'MessagesPage',
          method: 'handleSendMessage',
          messageId: message.id,
        });
        // Don't call addMessage here - the subscription will handle it
        // This prevents duplicate messages in the UI
        // Just update conversation list with latest message
        updateConversationWithMessage(message);
      },
      onError: (error, tempId) => {
        logger.error('Failed to send message', new Error(error), {
          service: 'MessagesPage',
          method: 'handleSendMessage',
          tempId,
        });
        // Remove the failed temp message from UI
        if (tempId) {
          removeMessage(tempId);
        }
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
        {/* Header - hidden on mobile when in message view */}
        <header className={`bg-white border-b border-primary-200 px-4 md:px-6 py-3 md:py-4 ${!showConversationList ? 'hidden md:block' : ''}`}>
          <h1 className="text-xl md:text-2xl font-bold text-primary-900">Messages</h1>
          <p className="text-xs md:text-sm text-primary-600">Private encrypted conversations</p>
        </header>

        {/* Two-panel layout - responsive */}
        <div className="flex-1 flex overflow-hidden">
          {/* Mobile: Show either conversation list OR message thread */}
          <div className="md:hidden w-full flex">
            {showConversationList ? (
              <div className="w-full border-r border-primary-200 bg-white flex flex-col">
                <ConversationList
                  conversations={conversations}
                  selectedPubkey={selectedPubkey}
                  onSelectConversation={handleSelectConversation}
                  isLoading={conversationsLoading}
                />
              </div>
            ) : (
              <div className="w-full flex flex-col bg-white">
                <MessageThread
                  messages={messages}
                  currentUserPubkey={currentUserPubkey}
                  otherUserPubkey={selectedPubkey}
                  isLoading={messagesLoading}
                  onBack={handleBackToList}
                  showMobileHeader={true}
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
            )}
          </div>

          {/* Desktop: Show both panels side-by-side */}
          <div className="hidden md:flex flex-1">
            {/* Left panel: Conversation list */}
            <div className="w-80 border-r border-primary-200 bg-white flex flex-col">
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
                showMobileHeader={false}
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
