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
    <div className="space-y-6">
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
                  {publishingError} You can update your profile later.
                </p>
              )}
              {(isPublishingInBackground || publishingStatus === 'uploading' || publishingStatus === 'publishing-profile' || publishingStatus === 'publishing-note') && (
                <p className="text-xs text-blue-600 mt-2">
                  You can continue while this completes in the background.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Backup Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Backup Your Keys</h3>
          <p className="text-sm text-gray-600 mb-4">
            Your keys are your identity. <strong>No one can recover them if lost</strong> - not even Culture Bridge.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          disabled={isCreatingBackup}
          className="w-full px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center mb-4"
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
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Concise 4-Item Storage Guide */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">🔐 Storage Guidelines</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div className="flex items-start">
              <span className="text-green-600 mr-2 font-bold">✓</span>
              <span className="text-gray-700">Use a password manager</span>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 mr-2 font-bold">✓</span>
              <span className="text-gray-700">Keep multiple copies</span>
            </div>
            <div className="flex items-start">
              <span className="text-red-600 mr-2 font-bold">✗</span>
              <span className="text-gray-700">Don&apos;t email or share it</span>
            </div>
            <div className="flex items-start">
              <span className="text-red-600 mr-2 font-bold">✗</span>
              <span className="text-gray-700">Don&apos;t upload to cloud</span>
            </div>
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
              I have downloaded and securely stored my backup. I understand these keys cannot be recovered if lost.
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
