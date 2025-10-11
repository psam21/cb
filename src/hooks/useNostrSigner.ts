'use client';

import { useEffect } from 'react';
import { logger } from '@/services/core/LoggingService';
import { NostrSigner } from '@/types/nostr';
import { useAuthStore } from '@/stores/useAuthStore';

// Extend Window interface to include nostr
declare global {
  interface Window {
    nostr?: NostrSigner;
  }
}

export const useNostrSigner = () => {
  const {
    isAvailable,
    isLoading,
    error,
    signer,
    nsec,
    setSignerAvailable,
    setSigner,
  } = useAuthStore();

  // Helper to get signer when needed
  const getSigner = async (): Promise<NostrSigner> => {
    // First priority: Check for nsec (persisted from sign-up)
    const nsecFromStore = useAuthStore.getState().nsec;
    if (nsecFromStore) {
      logger.info('Creating signer from persisted nsec', {
        service: 'useNostrSigner',
        method: 'getSigner',
        hasNsec: true,
      });
      
      // Decode nsec to get secret key
      const { nip19 } = await import('nostr-tools');
      const { getPublicKey, finalizeEvent } = await import('nostr-tools/pure');
      
      const decoded = nip19.decode(nsecFromStore);
      if (decoded.type !== 'nsec') {
        throw new Error('Invalid nsec format');
      }
      
      const secretKey = decoded.data;
      
      // Create signer from nsec
      const nsecSigner: NostrSigner = {
        getPublicKey: async () => getPublicKey(secretKey),
        signEvent: async (event) => finalizeEvent(event, secretKey),
        getRelays: async () => ({}), // No extension relays
      };
      
      return nsecSigner;
    }
    
    // Second priority: Check for cached signer
    if (signer) {
      logger.info('Getting cached Nostr signer instance', {
        service: 'useNostrSigner',
        method: 'getSigner',
      });
      return signer;
    }
    
    // Third priority: Check for browser extension signer
    if (typeof window !== 'undefined' && window.nostr) {
      logger.info('Getting Nostr signer instance from browser extension', {
        service: 'useNostrSigner',
        method: 'getSigner',
      });
      return window.nostr;
    }
    
    throw new Error('No signer available');
  };

  // Unified signer management: handles both browser extension and nsec
  // Priority: Nsec > Browser Extension > None
  // Also listens for extension becoming available after page load
  useEffect(() => {
    const initializeSigner = async () => {
      logger.info('Initializing signer', {
        service: 'useNostrSigner',
        method: 'initializeSigner',
        hasExtension: !!(typeof window !== 'undefined' && window.nostr),
        hasNsec: !!nsec,
      });

      // Priority 1: Nsec (persisted from sign-up - maintain consistent identity)
      if (nsec) {
        try {
          logger.info('Creating signer from persisted nsec', {
            service: 'useNostrSigner',
            method: 'initializeSigner',
          });

          const { nip19 } = await import('nostr-tools');
          const { getPublicKey, finalizeEvent } = await import('nostr-tools/pure');
          
          const decoded = nip19.decode(nsec);
          if (decoded.type !== 'nsec') {
            throw new Error('Invalid nsec format');
          }
          
          const secretKey = decoded.data;
          
          // Create and store signer
          const nsecSigner: NostrSigner = {
            getPublicKey: async () => getPublicKey(secretKey),
            signEvent: async (event) => finalizeEvent(event, secretKey),
            getRelays: async () => ({}),
          };
          
          setSigner(nsecSigner);
          setSignerAvailable(true);
          
          logger.info('Signer created for nsec user', {
            service: 'useNostrSigner',
            method: 'initializeSigner',
          });
        } catch (error) {
          logger.error('Failed to create signer from nsec', 
            error instanceof Error ? error : new Error('Unknown error'), {
            service: 'useNostrSigner',
            method: 'initializeSigner',
          });
          setSigner(null);
          setSignerAvailable(false);
        }
        return;
      }

      // Priority 2: Browser extension (if available)
      if (typeof window !== 'undefined' && window.nostr) {
        setSigner(window.nostr);
        setSignerAvailable(true);
        logger.info('Using browser extension signer', {
          service: 'useNostrSigner',
          method: 'initializeSigner',
        });
        return;
      }

      // Priority 3: No signer available
      logger.info('No signer available', {
        service: 'useNostrSigner',
        method: 'initializeSigner',
      });
      setSigner(null);
      setSignerAvailable(false);
    };

    initializeSigner();
    
    // Poll for extension becoming available (user approves after page load)
    // This handles the case where user clicks "Contact Seller" → gets prompt → approves extension
    const checkForExtension = () => {
      if (typeof window !== 'undefined' && window.nostr && !signer) {
        logger.info('Extension became available, re-initializing', {
          service: 'useNostrSigner',
          method: 'checkForExtension',
        });
        initializeSigner();
      }
    };
    
    // Check every 1 second for extension (stops once found)
    const intervalId = setInterval(checkForExtension, 1000);
    
    // Also check when window regains focus (user might approve in popup)
    const handleFocus = () => {
      logger.info('Window focused, checking for extension', {
        service: 'useNostrSigner',
        method: 'handleFocus',
      });
      checkForExtension();
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
    }
    
    // Cleanup
    return () => {
      clearInterval(intervalId);
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocus);
      }
    };
  }, [nsec, setSigner, setSignerAvailable, signer]); // Added signer to deps

  return { 
    isAvailable, 
    isLoading, 
    error, 
    signer,
    getSigner,
  };
};