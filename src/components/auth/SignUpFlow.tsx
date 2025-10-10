/**
 * SignUpFlow Component
 * 
 * Multi-step wizard for Nostr sign-up
 * - Step 1: Profile Setup (display name, bio, avatar)
 * - Step 2: Key Generation (generate keys, publish profile)
 * - Step 3: Key Backup (download backup file)
 * - Step 4: Final Confirmation (review and complete)
 * 
 * @module components/auth/SignUpFlow
 */

'use client';

import React from 'react';
import { useNostrSignUp } from '@/hooks/useNostrSignUp';
import ProfileSetupStep from './ProfileSetupStep';
import KeyGenerationStep from './KeyGenerationStep';
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
    generateKeys,
    createBackup,
    completeSignUp,
    nextStep,
    previousStep,
  } = useNostrSignUp();

  // Step titles for progress indicator
  const stepTitles = [
    'Profile Setup',
    'Generate Keys',
    'Backup Keys',
    'Complete',
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
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
                        flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold
                        ${isActive ? 'border-blue-600 bg-blue-600 text-white' : ''}
                        ${isCompleted ? 'border-green-600 bg-green-600 text-white' : ''}
                        ${!isActive && !isCompleted ? 'border-gray-300 bg-white text-gray-400' : ''}
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
                        mt-2 text-xs sm:text-sm font-medium
                        ${isActive ? 'text-blue-600' : ''}
                        ${isCompleted ? 'text-green-600' : ''}
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
                        flex-1 h-0.5 mx-2
                        ${stepNumber < currentStep ? 'bg-green-600' : 'bg-gray-300'}
                      `}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
          {/* Step 1: Profile Setup */}
          {currentStep === 1 && (
            <ProfileSetupStep
              displayName={formData.displayName}
              bio={formData.bio}
              avatarFile={formData.avatarFile}
              onDisplayNameChange={setDisplayName}
              onBioChange={setBio}
              onAvatarChange={setAvatarFile}
              onNext={nextStep}
            />
          )}

          {/* Step 2: Key Generation */}
          {currentStep === 2 && (
            <KeyGenerationStep
              displayName={formData.displayName}
              bio={formData.bio}
              avatarFile={formData.avatarFile}
              generatedKeys={generatedKeys}
              isGeneratingKeys={isGeneratingKeys}
              isUploadingAvatar={isUploadingAvatar}
              isPublishingProfile={isPublishingProfile}
              error={error}
              onGenerateKeys={generateKeys}
              onNext={nextStep}
              onBack={previousStep}
            />
          )}

          {/* Step 3: Key Backup */}
          {currentStep === 3 && generatedKeys && (
            <KeyBackupStep
              displayName={formData.displayName}
              npub={generatedKeys.npub}
              isCreatingBackup={isCreatingBackup}
              error={error}
              onCreateBackup={createBackup}
              onNext={nextStep}
              onBack={previousStep}
            />
          )}

          {/* Step 4: Final Confirmation */}
          {currentStep === 4 && generatedKeys && (
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
            <a href="/support" className="text-blue-600 hover:text-blue-700 font-medium">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
