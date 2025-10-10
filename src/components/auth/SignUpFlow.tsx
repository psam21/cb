/**
 * SignUpFlow Component
 * 
 * Multi-step wizard for Nostr sign-up
 * - Step 1: Profile Setup (display name, bio, avatar) → Auto-generates keys on "Next"
 * - Step 2: Key Backup (download backup file, confirm) → Success Modal → Home
 * 
 * @module components/auth/SignUpFlow
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNostrSignUp } from '@/hooks/useNostrSignUp';
import ProfileSetupStep from './ProfileSetupStep';
import KeyBackupStep from './KeyBackupStep';

export const SignUpFlow: React.FC = () => {
  const router = useRouter();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const {
    currentStep,
    formData,
    generatedKeys,
    isGeneratingKeys,
    isUploadingAvatar,
    isPublishingProfile,
    isCreatingBackup,
    error,
    setDisplayName,
    setBio,
    setAvatarFile,
    generateKeysAndMoveToBackup,
    createBackup,
    completeSignUp,
    previousStep,
  } = useNostrSignUp();

  // Step titles for progress indicator (2 steps)
  const stepTitles = [
    'Create Profile',
    'Backup Keys',
  ];

  // Handle completion - show modal then redirect
  const handleComplete = () => {
    setShowSuccessModal(true);
  };

  // Handle modal close - complete signup and redirect
  const handleModalClose = () => {
    completeSignUp();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-br from-accent-400 to-accent-600 text-white">
        <div className="container-width">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">
              Create Your <span className="text-white">Nostr Identity</span>
            </h1>
            <p className="text-xl md:text-2xl text-accent-100 leading-relaxed mb-6">
              Join the Culture Bridge community and start preserving indigenous heritage on the decentralized web.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-padding bg-white">
        <div className="container-width max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {stepTitles.map((title, index) => {
              const stepNumber = index + 1;
              const isActive = stepNumber === currentStep;
              const isCompleted = stepNumber < currentStep;

              return (
                <React.Fragment key={stepNumber}>
                  {/* Step */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`
                        flex items-center justify-center w-12 h-12 rounded-full font-semibold text-lg transition-all duration-300
                        ${isActive ? 'bg-gradient-to-br from-accent-400 to-accent-600 text-white shadow-lg scale-110' : ''}
                        ${isCompleted ? 'bg-primary-600 text-white' : ''}
                        ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-400' : ''}
                      `}
                    >
                      {isCompleted ? (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        stepNumber
                      )}
                    </div>
                    <p
                      className={`
                        mt-3 text-xs sm:text-sm font-medium
                        ${isActive ? 'text-primary-800 font-semibold' : ''}
                        ${isCompleted ? 'text-primary-600' : ''}
                        ${!isActive && !isCompleted ? 'text-gray-400' : ''}
                      `}
                    >
                      {title}
                    </p>
                  </div>

                  {/* Connector Line */}
                  {index < stepTitles.length - 1 && (
                    <div
                      className={`
                        flex-1 h-1 mx-2 rounded transition-all duration-300
                        ${stepNumber < currentStep ? 'bg-primary-600' : 'bg-gray-200'}
                      `}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 sm:p-12">
          {/* Step 1: Profile Setup (auto-generates keys on Next) */}
          {currentStep === 1 && (
            <ProfileSetupStep
              displayName={formData.displayName}
              bio={formData.bio}
              avatarFile={formData.avatarFile}
              onDisplayNameChange={setDisplayName}
              onBioChange={setBio}
              onAvatarChange={setAvatarFile}
              onNext={generateKeysAndMoveToBackup}
              isGeneratingKeys={isGeneratingKeys}
              isUploadingAvatar={isUploadingAvatar}
              isPublishingProfile={isPublishingProfile}
              error={error}
            />
          )}

          {/* Step 2: Key Backup */}
          {currentStep === 2 && generatedKeys && (
            <KeyBackupStep
              displayName={formData.displayName}
              npub={generatedKeys.npub}
              isCreatingBackup={isCreatingBackup}
              error={error}
              onCreateBackup={createBackup}
              onNext={handleComplete}
              onBack={previousStep}
            />
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <a href="/support" className="text-primary-600 hover:text-primary-700 font-medium">
              Contact Support
            </a>
          </p>
        </div>
        </div>
      </section>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-serif font-bold text-primary-800 mb-3">
                Welcome to Culture Bridge!
              </h2>
              <p className="text-lg text-gray-600 mb-4">
                Your Nostr identity has been created successfully. You&apos;re now part of the decentralized web.
              </p>
              <p className="text-sm text-gray-500">
                Start exploring indigenous heritage, connecting with communities, and preserving cultural knowledge for future generations.
              </p>
            </div>
            
            <button
              onClick={handleModalClose}
              className="w-full px-8 py-4 bg-gradient-to-br from-accent-400 to-accent-600 text-white font-semibold rounded-lg hover:from-accent-500 hover:to-accent-700 transition-all duration-200 shadow-lg"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
