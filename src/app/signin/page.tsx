'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNostrSigner } from '@/hooks/useNostrSigner';
import { useAuthStore } from '@/stores/useAuthStore';
import { logger } from '@/services/core/LoggingService';

export default function SigninPage() {
  const router = useRouter();
  const { isAvailable, isLoading, signer, detectSignerOnDemand } = useNostrSigner();
  const { setUser, setAuthenticated } = useAuthStore();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signinError, setSigninError] = useState<string | null>(null);

  // Detect signer when signin page loads
  useEffect(() => {
    detectSignerOnDemand();
  }, [detectSignerOnDemand]);

  const handleSignIn = async () => {
    // First detect signer if not already available
    if (!isAvailable) {
      await detectSignerOnDemand();
      if (!isAvailable) {
        setSigninError('No Nostr signer available. Please install a Nostr browser extension.');
        return;
      }
    }

    if (!signer) {
      setSigninError('No Nostr signer available');
      return;
    }

    setIsSigningIn(true);
    setSigninError(null);

    try {
      // Get user's public key
      const pubkey = await signer.getPublicKey();
      
      // Use default profile - will be updated when user edits their profile
      const profile = {
        name: 'Anonymous',
        about: '',
        picture: '',
        website: '',
        banner: '',
        bot: false,
        birthday: ''
      };

      // Generate npub from pubkey
      const { profileService } = await import('@/services/business/ProfileBusinessService');
      const npub = profileService.pubkeyToNpub(pubkey);

      // Set user in store
      const userData = {
        pubkey,
        npub,
        profile: {
          display_name: profile.name || 'Anonymous',
          about: profile.about || '',
          picture: profile.picture || '',
          website: profile.website || '',
          banner: profile.banner || '',
          bot: profile.bot || false,
          birthday: profile.birthday || ''
        }
      };

      setUser(userData);
      setAuthenticated(true);
      
      logger.info('User authentication completed', { 
        pubkey: pubkey.substring(0, 8) + '...',
        npub: npub.substring(0, 12) + '...',
        display_name: userData.profile.display_name
      });
      
      // Add a small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      logger.info('User signed in successfully', { pubkey });
      
      // Redirect to profile page
      router.push('/profile');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      setSigninError(errorMessage);
      logger.error('Sign in failed', error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleCancel = () => {
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-primary-600">Detecting Nostr signer...</p>
        </div>
      </div>
    );
  }

  if (!isAvailable) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="max-w-md mx-auto p-8 card text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-serif font-bold text-primary-800 mb-2">Nostr Signer Required</h1>
            <p className="text-primary-600 mb-6">
              Please install a Nostr browser extension to sign in.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="text-left">
              <h3 className="font-semibold text-primary-800 mb-2">Recommended Extensions:</h3>
              <ul className="space-y-2 text-sm text-primary-600">
                <li>• <strong>Alby</strong> - Bitcoin & Nostr wallet</li>
                <li>• <strong>nos2x</strong> - Nostr signing extension</li>
                <li>• <strong>Nostr Wallet Connect</strong> - Multi-protocol support</li>
              </ul>
            </div>
            
            <button
              onClick={handleCancel}
              className="btn-outline-sm w-full"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
      <div className="max-w-md mx-auto p-8 card">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-serif font-bold text-primary-800 mb-2">Sign In</h1>
          <p className="text-primary-600">
            Connect with your Nostr identity to access your profile and shop
          </p>
        </div>

        {signinError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Sign In Failed</h3>
                <div className="mt-2 text-sm text-red-700">{signinError}</div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-primary-600 mb-4">
              Your Nostr signer is ready. Click below to authenticate.
            </p>
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="btn-primary-sm w-full"
            >
              {isSigningIn ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing In...
                </div>
              ) : (
                'Sign In with Nostr'
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={handleCancel}
              className="btn-outline-sm w-full"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-primary-200">
          <div className="text-center">
            <p className="text-xs text-primary-500">
              By signing in, you agree to our Terms of Service and Privacy Policy.
              <br />
              Your data remains under your control via Nostr.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
