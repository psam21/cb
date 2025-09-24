'use client';

import { useState, useEffect, useRef } from 'react';
import { logger } from '@/services/core/LoggingService';
import { NostrSigner } from '@/types/nostr';

// Extend Window interface to include nostr
declare global {
  interface Window {
    nostr?: NostrSigner;
  }
}

export const useNostrSigner = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        windowNostrExists: typeof window !== 'undefined' && !!window.nostr,
      });

      // Only check if window.nostr exists, don't call methods that require permission
      if (typeof window !== 'undefined' && window.nostr) {
        // Check if the signer has the required methods without calling them
        if (typeof window.nostr.getPublicKey === 'function' && 
            typeof window.nostr.signEvent === 'function') {
          const result = true;
          lastDetectionRef.current = { timestamp: now, result };
          
          logger.info('Nostr signer detected successfully', {
            service: 'useNostrSigner',
            method: 'detectSigner',
            result,
          });
          
          return result;
        }
      }
      
      const result = false;
      lastDetectionRef.current = { timestamp: now, result };
      
      logger.info('No Nostr signer detected', {
        service: 'useNostrSigner',
        method: 'detectSigner',
        result,
      });
      
      return result;
    } catch (error) {
      logger.error('Error during signer detection', error instanceof Error ? error : new Error('Unknown error'), {
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
        setIsLoading(true);
        const available = await detectSigner();
        setIsAvailable(available);
        setError(available ? null : 'Signer not available');
      } catch (err) {
        setIsAvailable(false);
        setError('Signer detection failed');
        logger.error('Signer detection failed', err instanceof Error ? err : new Error('Unknown error'), {
          service: 'useNostrSigner',
          method: 'performDetection',
        });
      } finally {
        setIsLoading(false);
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
  }, []);

  // Helper to get signer when needed (no storage)
  const getSigner = async (): Promise<NostrSigner> => {
    if (typeof window !== 'undefined' && window.nostr) {
      logger.info('Getting Nostr signer instance', {
        service: 'useNostrSigner',
        method: 'getSigner',
      });
      return window.nostr;
    }
    throw new Error('No signer available');
  };

  return { isAvailable, isLoading, error, getSigner };
};
