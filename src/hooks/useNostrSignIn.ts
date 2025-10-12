import { useState } from 'react';
import { useNostrSigner } from '@/hooks/useNostrSigner';
import { useAuthStore } from '@/stores/useAuthStore';
import { profileService } from '@/services/business/ProfileBusinessService';
import { authBusinessService } from '@/services/business/AuthBusinessService';
import { logger } from '@/services/core/LoggingService';
import { createNsecSigner } from '@/utils/signerFactory';
import { AppError } from '@/errors/AppError';
import { ErrorCode, HttpStatus, ErrorCategory, ErrorSeverity } from '@/errors/ErrorTypes';

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
 * 
 * Returns boolean success status - navigation handled by page component
 */
export function useNostrSignIn(): UseNostrSignInReturn {
  const { isAvailable, isLoading, signer } = useNostrSigner();
  const { setUser, setAuthenticated } = useAuthStore();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signinError, setSigninError] = useState<string | null>(null);
  const [nsecInput, setNsecInput] = useState('');

  const signIn = async (): Promise<boolean> => {
    logger.info('Sign-in initiated', { service: 'useNostrSignIn' });

    if (!isAvailable || !signer) {
      const error = new AppError(
        'No Nostr signer available. Please install a Nostr browser extension.',
        ErrorCode.SIGNER_NOT_DETECTED,
        HttpStatus.UNAUTHORIZED,
        ErrorCategory.AUTHENTICATION,
        ErrorSeverity.MEDIUM
      );
      logger.warn('Sign-in failed: no signer', { isAvailable, hasSigner: !!signer });
      setSigninError(error.message);
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
      const error = new AppError(
        'Invalid private key format. Private keys should start with "nsec1"',
        ErrorCode.INVALID_FORMAT,
        HttpStatus.BAD_REQUEST,
        ErrorCategory.VALIDATION,
        ErrorSeverity.LOW
      );
      setSigninError(error.message);
      logger.warn('Nsec sign-in failed: invalid format', { prefix: nsec.substring(0, 5) });
      return false;
    }

    setIsSigningIn(true);
    setSigninError(null);

    try {
      // Create signer from nsec (hook responsibility)
      let signer;
      try {
        signer = await createNsecSigner(nsec);
      } catch (error) {
        const appError = new AppError(
          'Invalid private key. Please check your nsec.',
          ErrorCode.INVALID_CREDENTIALS,
          HttpStatus.BAD_REQUEST,
          ErrorCategory.AUTHENTICATION,
          ErrorSeverity.MEDIUM
        );
        setSigninError(appError.message);
        logger.error('Signer creation failed', error instanceof Error ? error : appError);
        return false;
      }

      // Call AuthBusinessService to orchestrate nsec sign-in
      const result = await authBusinessService.signInWithNsec(signer);

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

      return true;
    } catch (error) {
      const appError = error instanceof AppError 
        ? error 
        : new AppError(
            error instanceof Error ? error.message : 'Sign-in failed',
            ErrorCode.SIGNER_AUTH_FAILED,
            HttpStatus.INTERNAL_SERVER_ERROR,
            ErrorCategory.AUTHENTICATION,
            ErrorSeverity.HIGH
          );
      setSigninError(appError.message);
      logger.error('Nsec sign-in error', appError);
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
