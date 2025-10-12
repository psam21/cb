'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useNostrSignIn } from '@/hooks/useNostrSignIn';

export interface SignInFlowProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

type SignInMode = 'extension' | 'nsec';

/**
 * Sign-in flow component
 * Renders UI only, delegates logic to useNostrSignIn hook
 * Follows SOA pattern: Component → Hook
 * Supports both browser extension (NIP-07) and direct nsec login
 * 
 * Navigation handled by parent page component via onSuccess callback
 */
export function SignInFlow({ onSuccess, onCancel }: SignInFlowProps) {
  const { 
    signIn, 
    signInWithNsec, 
    nsecInput, 
    setNsecInput,
    clearError,
    isSigningIn, 
    signinError, 
    isAvailable, 
    isLoading 
  } = useNostrSignIn();

  // Default to 'nsec' mode if no extension detected, 'extension' if available
  const [mode, setMode] = useState<SignInMode>('extension');
  const [showNsec, setShowNsec] = useState(false);

  // Auto-switch to nsec mode if no extension is available (after loading completes)
  useEffect(() => {
    if (!isLoading && !isAvailable) {
      setMode('nsec');
    }
  }, [isLoading, isAvailable]);

  // Clear error when switching modes
  const handleModeSwitch = (newMode: SignInMode) => {
    setMode(newMode);
    clearError();
  };

  // Clear error when user starts typing
  const handleNsecInputChange = (value: string) => {
    setNsecInput(value);
    if (signinError) {
      clearError();
    }
  };

  const handleExtensionSignIn = async () => {
    const success = await signIn();
    if (success && onSuccess) {
      onSuccess();
    }
  };

  const handleNsecSignIn = async () => {
    const success = await signInWithNsec(nsecInput);
    if (success && onSuccess) {
      onSuccess();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="card p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-3xl font-serif font-bold text-primary-800 mb-2">Sign In</h1>
        <p className="text-gray-600">
          Connect with your Nostr identity
        </p>
      </div>

      {/* Mode Selection Tabs */}
      <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => handleModeSwitch('extension')}
          disabled={isSigningIn}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            mode === 'extension'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          } ${isSigningIn ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Browser Extension
        </button>
        <button
          onClick={() => handleModeSwitch('nsec')}
          disabled={isSigningIn}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            mode === 'nsec'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          } ${isSigningIn ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Enter Key
        </button>
      </div>

      {/* Extension Mode */}
      {mode === 'extension' && (
        <>
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

          {isAvailable && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <h3 className="font-semibold text-green-800">Signer Detected!</h3>
              </div>
              <p className="text-green-700 text-sm mt-1">
                Your Nostr extension is ready. Click &quot;Sign In with Nostr&quot; to continue.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Detecting Nostr extension...</p>
            </div>
          )}

          {!isLoading && isAvailable && (
            <div className="space-y-4">
              <button
                onClick={handleExtensionSignIn}
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
        </>
      )}

      {/* Nsec Mode */}
      {mode === 'nsec' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Private Key (nsec)
            </label>
            <div className="relative">
              <input
                type={showNsec ? 'text' : 'password'}
                value={nsecInput}
                onChange={(e) => handleNsecInputChange(e.target.value)}
                placeholder="nsec1..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-12"
                disabled={isSigningIn}
              />
              <button
                type="button"
                onClick={() => setShowNsec(!showNsec)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={isSigningIn}
              >
                {showNsec ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Your private key is stored in memory only and never leaves your device
            </p>
          </div>

          <button
            onClick={handleNsecSignIn}
            disabled={isSigningIn || !nsecInput.trim()}
            className="w-full btn-primary py-3"
          >
            {isSigningIn ? 'Signing In...' : 'Sign In with Private Key'}
          </button>
          
          {signinError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{signinError}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="text-center space-y-3">
          <p className="text-sm text-gray-600">
            Don&apos;t have a Nostr identity yet?{' '}
            <Link href="/signup" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign up here
            </Link>
          </p>
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
