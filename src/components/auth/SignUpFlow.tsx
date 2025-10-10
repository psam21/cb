/**
 * SignUpFlow Component
 * 
 * Multi-step wizard for Nostr sign-up
 * - Step 1: Profile Setup (display name, bio, avatar) → Auto-generates keys on "Next"
 * - Step 2: Key Backup (download backup file)
 * - Step 3: Final Confirmation (review and complete)
 * 
 * @module components/auth/SignUpFlow
 */

'use client';

import React from 'react';
import { useNostrSignUp } from '@/hooks/useNostrSignUp';
import ProfileSetupStep from './ProfileSetupStep';
import KeyBackupStep from './KeyBackupStep';
import FinalConfirmationStep from './FinalConfirmationStep';

export const SignUpFlow: React.FC = () => {
  const {
    currentStep,
    formData,
    generatedKeys,
    avatarUrl,
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
    goToStep,
  } = useNostrSignUp();

  // Step titles for progress indicator (3 steps)
  const stepTitles = [
    'Create Profile',
    'Backup Keys',
    'Complete',
  ];

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
              onNext={() => goToStep(3)}
              onBack={previousStep}
            />
          )}

          {/* Step 3: Final Confirmation */}
          {currentStep === 3 && generatedKeys && (
            <FinalConfirmationStep
              displayName={formData.displayName}
              bio={formData.bio}
              avatarUrl={avatarUrl}
              npub={generatedKeys.npub}
              onComplete={completeSignUp}
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
    </div>
  );
};
