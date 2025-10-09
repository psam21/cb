'use client';

import { useNostrSignIn } from '@/hooks/useNostrSignIn';

export interface SignInFlowProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Sign-in flow component
 * Renders UI only, delegates logic to useNostrSignIn hook
 * Follows SOA pattern: Component → Hook
 */
export function SignInFlow({ onSuccess, onCancel }: SignInFlowProps) {
  const { signIn, isSigningIn, signinError, isAvailable, isLoading } = useNostrSignIn();

  const handleSignIn = async () => {
    await signIn();
    // Hook handles navigation, but allow override
    if (onSuccess) {
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
  );
}
