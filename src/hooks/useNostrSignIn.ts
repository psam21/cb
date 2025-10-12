import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNostrSigner } from '@/hooks/useNostrSigner';
import { useAuthStore } from '@/stores/useAuthStore';
import { profileService } from '@/services/business/ProfileBusinessService';
import { authBusinessService } from '@/services/business/AuthBusinessService';
import { logger } from '@/services/core/LoggingService';

export interface UseNostrSignInReturn {
  signIn: () => Promise<boolean>;
  signInWithNsec: (nsec: string) => Promise<boolean>;
  nsecInput: string;
  setNsecInput: (value: string) => void;
  clearError: () => void;
  isSigningIn: boolean;
  signinError: string | null;
  isAvailable: boolean;
  isLoading: boolean;
}

/**
 * Hook for sign-in orchestration
 * Follows SOA pattern: Hook → Business Service
 * Supports both browser extension (NIP-07) and direct nsec login
 */
export function useNostrSignIn(): UseNostrSignInReturn {
  const router = useRouter();
  const { isAvailable, isLoading, signer } = useNostrSigner();
  const { setUser, setAuthenticated } = useAuthStore();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signinError, setSigninError] = useState<string | null>(null);
  const [nsecInput, setNsecInput] = useState('');

  const signIn = async (): Promise<boolean> => {
    logger.info('Sign-in initiated', { service: 'useNostrSignIn' });

    if (!isAvailable || !signer) {
      const errorMsg = 'No Nostr signer available. Please install a Nostr browser extension.';
      logger.warn('Sign-in failed: no signer', { isAvailable, hasSigner: !!signer });
      setSigninError(errorMsg);
      return false;
    }

    setIsSigningIn(true);
    setSigninError(null);

    try {
      // Call ProfileBusinessService to orchestrate sign-in
      const result = await profileService.signInWithExtension(signer);

      if (!result.success || !result.user) {
        setSigninError(result.error || 'Sign-in failed');
        logger.error('Sign-in failed', new Error(result.error || 'Unknown error'));
        return false;
      }

      // Update auth store with user data
      setUser(result.user);
      setAuthenticated(true);

      logger.info('User authenticated successfully', {
        pubkey: result.user.pubkey.substring(0, 8) + '...',
        display_name: result.user.profile.display_name,
      });

      // Complete sign-in with post-authentication setup (message cache)
      await authBusinessService.completeSignIn(result.user.pubkey);

      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));

      // Navigate to home
      router.push('/');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign-in failed';
      setSigninError(errorMessage);
      logger.error('Sign-in error', error instanceof Error ? error : new Error(errorMessage));
      return false;
    } finally {
      setIsSigningIn(false);
    }
  };

  const signInWithNsec = async (nsec: string): Promise<boolean> => {
    logger.info('Nsec sign-in initiated', { service: 'useNostrSignIn' });

    // Validate format (empty check handled by button disabled state)
    if (!nsec.startsWith('nsec1')) {
      const errorMsg = 'Invalid private key format. Private keys should start with "nsec1"';
      setSigninError(errorMsg);
      logger.warn('Nsec sign-in failed: invalid format', { prefix: nsec.substring(0, 5) });
      return false;
    }

    setIsSigningIn(true);
    setSigninError(null);

    try {
      // Call AuthBusinessService to orchestrate nsec sign-in
      const result = await authBusinessService.signInWithNsec(nsec);

      if (!result.success || !result.user) {
        setSigninError(result.error || 'Sign-in failed');
        logger.error('Nsec sign-in failed', new Error(result.error || 'Unknown error'));
        return false;
      }

      // Store nsec in Zustand (hook responsibility, not service)
      useAuthStore.getState().setNsec(nsec);

      // Update auth store with user data
      setUser(result.user);
      setAuthenticated(true);

      logger.info('User authenticated successfully with nsec', {
        pubkey: result.user.pubkey.substring(0, 8) + '...',
        display_name: result.user.profile.display_name,
      });

      // Complete sign-in with post-authentication setup (message cache)
      await authBusinessService.completeSignIn(result.user.pubkey);

      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));

      // Navigate to home
      router.push('/');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign-in failed';
      setSigninError(errorMessage);
      logger.error('Nsec sign-in error', error instanceof Error ? error : new Error(errorMessage));
      return false;
    } finally {
      setIsSigningIn(false);
    }
  };

  return {
    signIn,
    signInWithNsec,
    nsecInput,
    setNsecInput,
    clearError: () => setSigninError(null),
    isSigningIn,
    signinError,
    isAvailable,
    isLoading,
  };
}
