/**
 * KeyBackupStep Component
 * 
 * Step 3 of sign-up: Backup private key
 * - Download backup file button
 * - Confirmation checkbox
 * - Security warnings and best practices
 * 
 * @module components/auth/KeyBackupStep
 */

'use client';

import React, { useState } from 'react';

type PublishingStatus = 'idle' | 'uploading' | 'publishing-profile' | 'publishing-note' | 'complete' | 'error';

interface KeyBackupStepProps {
  /** Display name */
  displayName: string;
  /** Generated npub */
  npub: string;
  /** Loading state for backup creation */
  isCreatingBackup: boolean;
  /** Error message for backup */
  error: string | null;
  /** Background publishing states */
  isPublishingInBackground: boolean;
  publishingStatus: PublishingStatus;
  publishingMessage: string;
  publishingError: string | null;
  /** Callback to create and download backup */
  onCreateBackup: () => void;
  /** Callback to go to next step */
  onNext: () => void;
  /** Callback to go back to previous step */
  onBack: () => void;
}

export default function KeyBackupStep({
  // displayName is used in backup file name generation by parent
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  displayName,
  npub,
  isCreatingBackup,
  error,
  isPublishingInBackground,
  publishingStatus,
  publishingMessage,
  publishingError,
  onCreateBackup,
  onNext,
  onBack,
}: KeyBackupStepProps) {
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  // Handle download backup
  const handleDownload = () => {
    onCreateBackup();
    setHasDownloaded(true);
  };

  // Can only proceed if downloaded and confirmed
  const canProceed = hasDownloaded && hasConfirmed;

  return (
    <div className="space-y-8">
      {/* Why Backup Section */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-yellow-900 mb-2">Why is this important?</h3>
        <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
          <li>Nostr is decentralized - there&apos;s no &quot;forgot password&quot; option</li>
          <li>If you lose your keys, you lose access to this identity forever</li>
          <li>Your backup file is the only way to sign in on other devices</li>
          <li>No one, not even Culture Bridge, can recover your keys for you</li>
        </ul>
      </div>

      {/* Publishing Status (Non-blocking) */}
      {publishingStatus !== 'idle' && (
        <div className={`border rounded-lg p-4 ${
          publishingStatus === 'complete' ? 'bg-green-50 border-green-200' :
          publishingStatus === 'error' ? 'bg-red-50 border-red-200' :
          'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {publishingStatus === 'complete' ? (
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : publishingStatus === 'error' ? (
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
            </div>
            <div className="ml-3 flex-1">
              <h3 className={`text-sm font-semibold mb-1 ${
                publishingStatus === 'complete' ? 'text-green-900' :
                publishingStatus === 'error' ? 'text-red-900' :
                'text-blue-900'
              }`}>
                {publishingStatus === 'complete' ? 'Profile Published Successfully!' :
                 publishingStatus === 'error' ? 'Publishing Issue (Non-Critical)' :
                 'Publishing Your Profile...'}
              </h3>
              <p className={`text-sm ${
                publishingStatus === 'complete' ? 'text-green-700' :
                publishingStatus === 'error' ? 'text-red-700' :
                'text-blue-700'
              }`}>
                {publishingMessage}
              </p>
              {publishingError && (
                <p className="text-xs text-red-600 mt-2">
                  {publishingError} You can update your profile later from your profile page.
                </p>
              )}
              {(isPublishingInBackground || publishingStatus === 'uploading' || publishingStatus === 'publishing-profile' || publishingStatus === 'publishing-note') && (
                <p className="text-xs text-blue-600 mt-2">
                  You can download your backup and continue while this completes in the background.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Download Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Download Backup File</h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-700 mb-2">
            This file will contain:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside ml-4">
            <li>Your public key (npub): <span className="font-mono text-xs">{npub.substring(0, 20)}...</span></li>
            <li>Your private key (nsec) - KEEP THIS SECRET!</li>
            <li>Instructions for using your keys</li>
          </ul>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          disabled={isCreatingBackup}
          className="w-full px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {isCreatingBackup ? (
            'Creating backup...'
          ) : hasDownloaded ? (
            <>
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Downloaded - Click to Download Again
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Backup File
            </>
          )}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>

      {/* Storage Best Practices */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">🔐 Best Practices for Storing Your Backup</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <div className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span>Store in a password manager (recommended)</span>
          </div>
          <div className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span>Save to an encrypted USB drive or external hard drive</span>
          </div>
          <div className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span>Print it out and store in a safe place</span>
          </div>
          <div className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span>Make multiple copies in different secure locations</span>
          </div>
          <div className="flex items-start mt-3">
            <span className="text-red-600 mr-2">✗</span>
            <span>Don&apos;t store it in plain text on your computer</span>
          </div>
          <div className="flex items-start">
            <span className="text-red-600 mr-2">✗</span>
            <span>Don&apos;t email it to yourself</span>
          </div>
          <div className="flex items-start">
            <span className="text-red-600 mr-2">✗</span>
            <span>Don&apos;t share it with anyone, even family or friends</span>
          </div>
          <div className="flex items-start">
            <span className="text-red-600 mr-2">✗</span>
            <span>Don&apos;t upload it to cloud storage unless it&apos;s encrypted</span>
          </div>
        </div>
      </div>

      {/* Confirmation Checkbox */}
      {hasDownloaded && (
        <div className="bg-accent-50 border border-accent-200 rounded-lg p-4">
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={hasConfirmed}
              onChange={(e) => setHasConfirmed(e.target.checked)}
              className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="ml-3 text-sm text-accent-900">
              I confirm that I have downloaded and securely stored my backup file. I understand that if I lose my keys, I will lose access to this account permanently, and no one can recover it for me.
            </span>
          </label>
        </div>
      )}

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
          disabled={!canProceed}
          className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Complete Sign Up
        </button>
      </div>
    </div>
  );
}
