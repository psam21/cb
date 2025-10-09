import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNostrSigner } from '@/hooks/useNostrSigner';
import { useAuthStore } from '@/stores/useAuthStore';
import { profileService } from '@/services/business/ProfileBusinessService';
import { logger } from '@/services/core/LoggingService';

export interface UseNostrSignInReturn {
  signIn: () => Promise<void>;
  isSigningIn: boolean;
  signinError: string | null;
  isAvailable: boolean;
  isLoading: boolean;
}

/**
 * Hook for sign-in orchestration
 * Follows SOA pattern: Hook → Business Service
 */
export function useNostrSignIn(): UseNostrSignInReturn {
  const router = useRouter();
  const { isAvailable, isLoading, signer } = useNostrSigner();
  const { setUser, setAuthenticated } = useAuthStore();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signinError, setSigninError] = useState<string | null>(null);

  const signIn = async () => {
    logger.info('Sign-in initiated', { service: 'useNostrSignIn' });

    if (!isAvailable || !signer) {
      const errorMsg = 'No Nostr signer available. Please install a Nostr browser extension.';
      logger.warn('Sign-in failed: no signer', { isAvailable, hasSigner: !!signer });
      setSigninError(errorMsg);
      return;
    }

    setIsSigningIn(true);
    setSigninError(null);

    try {
      // Call ProfileBusinessService to orchestrate sign-in
      const result = await profileService.signInWithExtension(signer);

      if (!result.success || !result.user) {
        setSigninError(result.error || 'Sign-in failed');
        logger.error('Sign-in failed', new Error(result.error || 'Unknown error'));
        return;
      }

      // Update auth store with user data
      setUser(result.user);
      setAuthenticated(true);

      logger.info('User authenticated successfully', {
        pubkey: result.user.pubkey.substring(0, 8) + '...',
        display_name: result.user.profile.display_name,
      });

      // Initialize message cache (non-blocking)
      try {
        const { messagingBusinessService } = await import('@/services/business/MessagingBusinessService');
        await messagingBusinessService.initializeCache(result.user.pubkey);
        logger.info('Message cache initialized', { service: 'useNostrSignIn' });
      } catch (cacheError) {
        logger.warn('Failed to initialize message cache', {
          error: cacheError instanceof Error ? cacheError.message : 'Unknown error',
          service: 'useNostrSignIn',
        });
        // Don't fail sign-in if cache initialization fails
      }

      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));

      // Navigate to home
      router.push('/');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign-in failed';
      setSigninError(errorMessage);
      logger.error('Sign-in error', error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsSigningIn(false);
    }
  };

  return {
    signIn,
    isSigningIn,
    signinError,
    isAvailable,
    isLoading,
  };
}
