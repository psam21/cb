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
      
      const { createNsecSigner } = await import('@/utils/signerFactory');
      return await createNsecSigner(nsecFromStore);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

          const { createNsecSigner } = await import('@/utils/signerFactory');
          const nsecSigner = await createNsecSigner(nsec);
          
          setSigner(nsecSigner);
          setSignerAvailable(true);
          
          logger.info('Signer created for nsec user with NIP-44 support', {
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
    
    // No need for polling - signer initialization happens once on mount
    // and re-runs only when nsec changes (due to sign-in/sign-up/logout)
    // Extension detection happens synchronously above
    
    // Cleanup (nothing to clean up now)
    return () => {};
    // Note: `signer` intentionally excluded from deps to prevent infinite loop
    // We only want to re-initialize when `nsec` changes, not when `signer` changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nsec, setSigner, setSignerAvailable]);

  return { 
    isAvailable, 
    isLoading, 
    error, 
    signer,
    getSigner,
  };
};