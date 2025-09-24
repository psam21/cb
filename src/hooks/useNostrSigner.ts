'use client';

import { useEffect, useRef, useCallback } from 'react';
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

  // Only detect signer when explicitly requested (e.g., on signin page)
  const detectSignerOnDemand = useCallback(async () => {
    logger.info('Starting detectSignerOnDemand...', {
      service: 'useNostrSigner',
      method: 'detectSignerOnDemand'
    });
    
    try {
      setLoading(true);
      setError(null);
      
      // Simple check for window.nostr
      const hasSigner = typeof window !== 'undefined' && !!window.nostr;
      logger.info('Window.nostr check result', { 
        hasSigner,
        hasWindow: typeof window !== 'undefined',
        nostrType: typeof window !== 'undefined' ? typeof window.nostr : 'undefined'
      });
      
      setSignerAvailable(hasSigner);
      
      if (hasSigner) {
        try {
          const detectedSigner = window.nostr!;
          setSigner(detectedSigner);
          logger.info('Signer detected successfully', { 
            service: 'useNostrSigner',
            method: 'detectSignerOnDemand'
          });
        } catch (authError) {
          const errorMessage = authError instanceof Error ? authError.message : 'Signer detection failed';
          setError(errorMessage);
          logger.error('Signer detection failed', authError instanceof Error ? authError : new Error(errorMessage), {
            service: 'useNostrSigner',
            method: 'detectSignerOnDemand',
          });
        }
      } else {
        setError('Signer not available');
        setSigner(null);
        logger.info('No signer available', { 
          service: 'useNostrSigner',
          method: 'detectSignerOnDemand'
        });
      }
    } catch (err) {
      setSignerAvailable(false);
      setError('Signer detection failed');
      setSigner(null);
      logger.error('Signer detection failed', err instanceof Error ? err : new Error('Unknown error'), {
        service: 'useNostrSigner',
        method: 'detectSignerOnDemand',
      });
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setSignerAvailable, setSigner]);

  // Listen for signer availability changes
  useEffect(() => {
    const handleSignerChange = () => {
      lastDetectionRef.current = null; // Clear cache
      detectSignerOnDemand();
    };
    
    window.addEventListener('nostr:signer:available', handleSignerChange);
    window.addEventListener('nostr:signer:unavailable', handleSignerChange);
    
    return () => {
      window.removeEventListener('nostr:signer:available', handleSignerChange);
      window.removeEventListener('nostr:signer:unavailable', handleSignerChange);
    };
  }, [detectSignerOnDemand]);

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

  // Auto-detect signer on page load
  useEffect(() => {
    const checkSigner = () => {
      const hasSigner = typeof window !== 'undefined' && !!window.nostr;
      setSignerAvailable(hasSigner);
      if (hasSigner) {
        setSigner(window.nostr!);
      }
      logger.info('Auto signer detection on page load', { hasSigner });
    };
    
    checkSigner();
  }, [setSignerAvailable, setSigner]);

  return { 
    isAvailable, 
    isLoading, 
    error, 
    signer,
    getSigner,
    detectSignerOnDemand
  };
};