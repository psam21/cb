'use client';

import { useEffect, useRef } from 'react';
import { logger } from '@/services/core/LoggingService';
import { NostrSigner } from '@/types/nostr';
import { useAuthStore } from '@/stores/useAuthStore';
import { genericAuthService } from '@/services/generic/GenericAuthService';

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
    setSignerAvailable,
    setLoading,
    setError,
    setSigner,
    setUser,
    setAuthenticated,
  } = useAuthStore();

  // Optimized detection with caching using useRef
  const DETECTION_CACHE_MS = 5000;
  const lastDetectionRef = useRef<{ timestamp: number; result: boolean } | null>(null);

  const detectSigner = async (): Promise<boolean> => {
    const now = Date.now();
    if (lastDetectionRef.current && (now - lastDetectionRef.current.timestamp) < DETECTION_CACHE_MS) {
      return lastDetectionRef.current.result;
    }
    
    try {
      logger.info('Detecting Nostr signer', {
        service: 'useNostrSigner',
        method: 'detectSigner',
      });
      
      const detection = await genericAuthService.detectSigner();
      const result = detection.isAvailable;
      
      lastDetectionRef.current = { timestamp: now, result };
      return result;
    } catch (err) {
      logger.error('Error during signer detection', err instanceof Error ? err : new Error('Unknown error'), {
        service: 'useNostrSigner',
        method: 'detectSigner',
      });
      const result = false;
      lastDetectionRef.current = { timestamp: now, result };
      return result;
    }
  };

  useEffect(() => {
    const performDetection = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const available = await detectSigner();
        setSignerAvailable(available);
        
        if (available) {
          try {
            const detectedSigner = await genericAuthService.getSigner();
            setSigner(detectedSigner);
            
            // Authenticate with the signer
            const authResult = await genericAuthService.authenticateWithSigner(detectedSigner);
            if (authResult.success && authResult.npub && authResult.pubkey) {
              setUser(authResult.npub, authResult.pubkey);
              setAuthenticated(true);
            } else {
              setError(authResult.error || 'Authentication failed');
              setAuthenticated(false);
            }
          } catch (authError) {
            const errorMessage = authError instanceof Error ? authError.message : 'Authentication failed';
            setError(errorMessage);
            setAuthenticated(false);
            logger.error('Authentication failed', authError instanceof Error ? authError : new Error(errorMessage), {
              service: 'useNostrSigner',
              method: 'performDetection',
            });
          }
        } else {
          setError('Signer not available');
          setSigner(null);
          setUser(null, null);
          setAuthenticated(false);
        }
      } catch (err) {
        setSignerAvailable(false);
        setError('Signer detection failed');
        setSigner(null);
        setUser(null, null);
        setAuthenticated(false);
        logger.error('Signer detection failed', err instanceof Error ? err : new Error('Unknown error'), {
          service: 'useNostrSigner',
          method: 'performDetection',
        });
      } finally {
        setLoading(false);
      }
    };

    performDetection();
    
    // Listen for signer availability changes
    const handleSignerChange = () => {
      lastDetectionRef.current = null; // Clear cache
      performDetection();
    };
    
    window.addEventListener('nostr:signer:available', handleSignerChange);
    window.addEventListener('nostr:signer:unavailable', handleSignerChange);
    
    return () => {
      window.removeEventListener('nostr:signer:available', handleSignerChange);
      window.removeEventListener('nostr:signer:unavailable', handleSignerChange);
    };
  }, [setSignerAvailable, setLoading, setError, setSigner, setUser, setAuthenticated]);

  // Helper to get signer when needed
  const getSigner = async (): Promise<NostrSigner> => {
    if (signer) {
      logger.info('Getting cached Nostr signer instance', {
        service: 'useNostrSigner',
        method: 'getSigner',
      });
      return signer;
    }
    
    if (typeof window !== 'undefined' && window.nostr) {
      logger.info('Getting Nostr signer instance from window', {
        service: 'useNostrSigner',
        method: 'getSigner',
      });
      return window.nostr;
    }
    
    throw new Error('No signer available');
  };

  return { 
    isAvailable, 
    isLoading, 
    error, 
    getSigner,
    isAuthenticated: useAuthStore.getState().isAuthenticated,
    npub: useAuthStore.getState().npub,
    pubkey: useAuthStore.getState().pubkey,
  };
};