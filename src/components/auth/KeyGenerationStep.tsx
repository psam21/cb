/**
 * KeyGenerationStep Component
 * 
 * Step 2 of sign-up: Generate Nostr keys
 * - Generate keys button
 * - Display npub and nsec with copy buttons
 * - Security warnings
 * - Upload avatar (if provided) and publish profile
 * 
 * @module components/auth/KeyGenerationStep
 */

'use client';

import React, { useState } from 'react';

interface KeyGenerationStepProps {
  /** Display name from Step 1 */
  displayName: string;
  /** Bio from Step 1 */
  bio: string;
  /** Avatar file from Step 1 */
  avatarFile: File | null;
  /** Generated keys (null before generation) */
  generatedKeys: {
    nsec: string;
    npub: string;
    pubkey: string;
  } | null;
  /** Loading state for key generation */
  isGeneratingKeys: boolean;
  /** Loading state for avatar upload */
  isUploadingAvatar: boolean;
  /** Loading state for profile publishing */
  isPublishingProfile: boolean;
  /** Error message */
  error: string | null;
  /** Callback to generate keys and publish profile */
  onGenerateKeys: () => void;
  /** Callback to go to next step */
  onNext: () => void;
  /** Callback to go back to previous step */
  onBack: () => void;
}

export default function KeyGenerationStep({
  // displayName and bio are used by parent for profile publishing
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  displayName,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  bio,
  avatarFile,
  generatedKeys,
  isGeneratingKeys,
  isUploadingAvatar,
  isPublishingProfile,
  error,
  onGenerateKeys,
  onNext,
  onBack,
}: KeyGenerationStepProps) {
  const [copiedField, setCopiedField] = useState<'npub' | 'nsec' | null>(null);

  // Handle copy to clipboard
  const handleCopy = async (text: string, field: 'npub' | 'nsec') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Get loading message
  const getLoadingMessage = () => {
    if (isGeneratingKeys) return 'Generating your Nostr keys...';
    if (isUploadingAvatar) return 'Uploading your avatar...';
    if (isPublishingProfile) return 'Publishing your profile to Nostr...';
    return null;
  };

  const loadingMessage = getLoadingMessage();
  const isLoading = isGeneratingKeys || isUploadingAvatar || isPublishingProfile;

  return (
    <div className="space-y-8">
      {/* Generate Keys Section */}
      {!generatedKeys && (
        <div className="bg-accent-50 border border-accent-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-accent-900 mb-2">Ready to Create Your Identity</h3>
          <p className="text-sm text-accent-700 mb-4">
            Click the button below to generate your Nostr keys. This will:
          </p>
          <ul className="text-sm text-accent-700 mb-6 space-y-1 list-disc list-inside">
            <li>Generate a cryptographic key pair (public and private keys)</li>
            {avatarFile && <li>Upload your profile picture</li>}
            <li>Publish your profile to the Nostr network</li>
            <li>Verify your keys work by posting a welcome message</li>
          </ul>
          
          <button
            type="button"
            onClick={onGenerateKeys}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? loadingMessage : 'Generate My Keys'}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Generated Keys Display */}
      {generatedKeys && (
        <div className="space-y-6">
          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Keys Generated Successfully!</h3>
                <p className="mt-1 text-sm text-green-700">
                  Your profile has been published to the Nostr network.
                </p>
              </div>
            </div>
          </div>

          {/* Public Key (npub) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Public Key (npub)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Share this with others. It&apos;s your public identity on Nostr.
            </p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={generatedKeys.npub}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
              />
              <button
                type="button"
                onClick={() => handleCopy(generatedKeys.npub, 'npub')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                {copiedField === 'npub' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Private Key (nsec) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Private Key (nsec)
            </label>
            <p className="text-xs text-red-600 mb-2 font-medium">
              ⚠️ NEVER share this with anyone! This is your password.
            </p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={generatedKeys.nsec}
                readOnly
                className="flex-1 px-3 py-2 border border-red-300 rounded-md bg-red-50 text-sm font-mono"
              />
              <button
                type="button"
                onClick={() => handleCopy(generatedKeys.nsec, 'nsec')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                {copiedField === 'nsec' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Security Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-red-900 mb-2">🔒 Important Security Information</h3>
            <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
              <li>Your private key (nsec) is like a password - anyone with it can impersonate you</li>
              <li>Never share your nsec with anyone, not even Culture Bridge support</li>
              <li>Store it safely - you&apos;ll need it to sign in on other devices</li>
              <li>If you lose it, you lose access to this identity forever</li>
              <li>In the next step, you&apos;ll download a backup file - keep it safe!</li>
            </ul>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={onNext}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Continue to Backup
            </button>
          </div>
        </div>
      )}

      {/* Back Button (when not yet generated) */}
      {!generatedKeys && (
        <div className="flex justify-start pt-4">
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
};
