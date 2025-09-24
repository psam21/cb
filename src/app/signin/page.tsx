'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNostrSigner } from '@/hooks/useNostrSigner';
import { useAuthStore } from '@/stores/useAuthStore';
import { logger } from '@/services/core/LoggingService';

export default function SigninPage() {
  const router = useRouter();
  const { isAvailable, isLoading, signer, detectSignerOnDemand, error } = useNostrSigner();
  const { setUser, setAuthenticated } = useAuthStore();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signinError, setSigninError] = useState<string | null>(null);

  // Don't detect signer automatically - only when user clicks sign in

  const handleSignIn = async () => {
    console.log('Sign In button clicked - detecting signer...');
    
    // Detect signer when user clicks sign in
    await detectSignerOnDemand();
    
    if (!isAvailable || !signer) {
      setSigninError('No Nostr signer available. Please install a Nostr browser extension.');
      return;
    }

    setIsSigningIn(true);
    setSigninError(null);

    try {
      // Get user's public key - this should only require ONE approval
      logger.info('Requesting public key from signer...');
      const pubkey = await signer.getPublicKey();
      logger.info('Public key received successfully', { pubkey: pubkey.substring(0, 8) + '...' });
      
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

  return (
    <div className="min-h-screen hero-section">
      <div className="max-w-md w-full mx-4">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-serif font-bold text-primary-800 mb-2">Sign In</h1>
            <p className="text-gray-600">
              Connect with your Nostr identity to access your profile and shop
            </p>
          </div>

          {!isAvailable && !isLoading && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">Nostr Extension Required</h3>
              <p className="text-yellow-700 text-sm mb-3">
                Please install a Nostr browser extension to sign in:
              </p>
              <div className="space-y-2">
                <a href="https://getalby.com" target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:text-blue-800 text-sm">
                  • Alby (recommended)
                </a>
                <a href="https://github.com/fiatjaf/nos2x" target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:text-blue-800 text-sm">
                  • nos2x
                </a>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Detecting Nostr extension...</p>
            </div>
          )}

          {isAvailable && (
            <div className="space-y-4">
              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="w-full btn-primary py-3"
              >
                {isSigningIn ? 'Signing In...' : 'Sign In with Nostr'}
              </button>
              
              {signinError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{signinError}</p>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <button
                onClick={handleCancel}
                className="btn-outline-sm w-full"
              >
                Back to Home
              </button>
            </div>
            <div className="text-center mt-4">
              <p className="text-xs text-gray-500">
                By signing in, you agree to our Terms of Service and Privacy Policy.
                <br />
                Your data remains under your control via Nostr.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
