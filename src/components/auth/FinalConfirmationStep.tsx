/**
 * FinalConfirmationStep Component
 * 
 * Step 4 of sign-up: Final confirmation
 * - Summary of profile information
 * - Terms acceptance checkbox
 * - Complete button (clears nsec from memory, redirects to home)
 * 
 * @module components/auth/FinalConfirmationStep
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface FinalConfirmationStepProps {
  /** Display name */
  displayName: string;
  /** Bio */
  bio: string;
  /** Avatar URL (if uploaded) */
  avatarUrl: string | null;
  /** Generated npub */
  npub: string;
  /** Callback to complete sign-up (clears nsec) */
  onComplete: () => void;
  /** Callback to go back to previous step */
  onBack: () => void;
}

export default function FinalConfirmationStep({
  displayName,
  bio,
  avatarUrl,
  npub,
  onComplete,
  onBack,
}: FinalConfirmationStepProps) {
  const router = useRouter();
  const [hasAccepted, setHasAccepted] = useState(false);

  // Handle complete sign-up
  const handleComplete = () => {
    onComplete();
    // Redirect to home page
    router.push('/');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-4">You&apos;re All Set!</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Review your profile and complete your sign-up to start using Culture Bridge.
        </p>
      </div>

      {/* Profile Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Profile</h3>
        
        <div className="space-y-4">
          {/* Avatar */}
          {avatarUrl && (
            <div className="flex justify-center">
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
              />
            </div>
          )}

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Display Name</label>
            <p className="mt-1 text-gray-900">{displayName}</p>
          </div>

          {/* Bio */}
          {bio && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Bio</label>
              <p className="mt-1 text-gray-900 whitespace-pre-wrap">{bio}</p>
            </div>
          )}

          {/* Public Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Public Key (npub)</label>
            <p className="mt-1 text-sm text-gray-600 font-mono break-all">{npub}</p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">Profile Published Successfully!</h3>
            <p className="mt-1 text-sm text-green-700">
              Your profile has been published to the Nostr network and is now visible to others.
            </p>
          </div>
        </div>
      </div>

      {/* What's Next */}
      <div className="bg-accent-50 border border-accent-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-accent-900 mb-2">What&apos;s Next?</h3>
        <ul className="text-sm text-accent-700 space-y-1 list-disc list-inside">
          <li>Explore indigenous heritage content from around the world</li>
          <li>Connect with elders and community members</li>
          <li>Share your own stories and cultural knowledge</li>
          <li>Participate in discussions and events</li>
          <li>Support indigenous artisans in the marketplace</li>
        </ul>
      </div>

      {/* Important Reminder */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-yellow-900 mb-2">⚠️ Important Reminder</h3>
        <p className="text-sm text-yellow-700">
          Make sure you&apos;ve safely stored your backup file! You&apos;ll need your private key (nsec) to sign in on other devices or if you clear your browser data. There is no password recovery option.
        </p>
      </div>

      {/* Terms Acceptance */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <label className="flex items-start cursor-pointer">
          <input
            type="checkbox"
            checked={hasAccepted}
            onChange={(e) => setHasAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <span className="ml-3 text-sm text-gray-700">
            I understand that Culture Bridge is a decentralized platform built on Nostr. I am responsible for managing my own keys and there is no password recovery. I have safely stored my backup file and understand that losing my keys means losing access to this account permanently.
          </span>
        </label>
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
          onClick={handleComplete}
          disabled={!hasAccepted}
          className="px-8 py-3 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Complete Sign-Up & Start Exploring
        </button>
      </div>
    </div>
  );
}
