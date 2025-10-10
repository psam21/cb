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
    // First check for cached signer
    if (signer) {
      logger.info('Getting cached Nostr signer instance', {
        service: 'useNostrSigner',
        method: 'getSigner',
      });
      return signer;
    }
    
    // Check for browser extension signer
    if (typeof window !== 'undefined' && window.nostr) {
      logger.info('Getting Nostr signer instance from window', {
        service: 'useNostrSigner',
        method: 'getSigner',
      });
      return window.nostr;
    }
    
    // Check for nsec (direct key access) and create temporary signer
    const nsec = useAuthStore.getState().nsec;
    if (nsec) {
      logger.info('Creating temporary signer from nsec', {
        service: 'useNostrSigner',
        method: 'getSigner',
        hasNsec: true,
      });
      
      // Decode nsec to get secret key
      const { nip19 } = await import('nostr-tools');
      const { getPublicKey, finalizeEvent } = await import('nostr-tools/pure');
      
      const decoded = nip19.decode(nsec);
      if (decoded.type !== 'nsec') {
        throw new Error('Invalid nsec format');
      }
      
      const secretKey = decoded.data;
      
      // Create temporary signer
      const temporarySigner: NostrSigner = {
        getPublicKey: async () => getPublicKey(secretKey),
        signEvent: async (event) => finalizeEvent(event, secretKey),
        getRelays: async () => ({}), // No extension relays
      };
      
      return temporarySigner;
    }
    
    throw new Error('No signer available');
  };

  // Unified signer management: handles both browser extension and nsec
  // Priority: Browser Extension > Nsec > None
  useEffect(() => {
    const initializeSigner = async () => {
      logger.info('Initializing signer', {
        service: 'useNostrSigner',
        method: 'initializeSigner',
        hasExtension: !!(typeof window !== 'undefined' && window.nostr),
        hasNsec: !!nsec,
      });

      // Priority 1: Browser extension (if available)
      if (typeof window !== 'undefined' && window.nostr) {
        setSigner(window.nostr);
        setSignerAvailable(true);
        logger.info('Using browser extension signer', {
          service: 'useNostrSigner',
          method: 'initializeSigner',
        });
        return;
      }

      // Priority 2: Nsec (if available)
      if (nsec) {
        try {
          logger.info('Creating temporary signer from nsec', {
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
          
          // Create and store temporary signer
          const temporarySigner: NostrSigner = {
            getPublicKey: async () => getPublicKey(secretKey),
            signEvent: async (event) => finalizeEvent(event, secretKey),
            getRelays: async () => ({}),
          };
          
          setSigner(temporarySigner);
          setSignerAvailable(true);
          
          logger.info('Temporary signer created for nsec user', {
            service: 'useNostrSigner',
            method: 'initializeSigner',
          });
        } catch (error) {
          logger.error('Failed to create temporary signer from nsec', 
            error instanceof Error ? error : new Error('Unknown error'), {
            service: 'useNostrSigner',
            method: 'initializeSigner',
          });
          setSigner(null);
          setSignerAvailable(false);
        }
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
  }, [nsec, setSigner, setSignerAvailable]); // Re-run when nsec changes

  return { 
    isAvailable, 
    isLoading, 
    error, 
    signer,
    getSigner,
  };
};